import { Router, Request } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { success, fail, paginate } from '../utils/response';
import { authMiddleware, adminOnly } from '../middleware/auth';
import { validatePasswordPolicy } from '../lib/passwordPolicy';
import {
  globalLimiter,
  loginRateLimiter,
  buildLoginRateLimitKey,
  isLoopbackIp,
  secondsUntil,
} from '../middleware/rateLimit';
import logger from '../utils/logger';
import { sendMailTo } from '../utils/mailer';

const router = Router();
router.use(authMiddleware);

// 操作人信息提取（用于日志）
function getOperator(req: Request): string {
  const u = req.user;
  if (!u) return 'anonymous';
  return `userId=${u.id}, username=${u.username}, role=${u.role}`;
}

// ==================== 统计数据 ====================
// GET /api/admin/stats - 仪表盘统计
router.get('/stats', async (req, res, next) => {
  try {
    logger.info(`[Admin][Stats] Get dashboard stats by ${getOperator(req)}`);
    const [newsCount, productsCount, solutionsCount, jobsCount, messagesCount, applicationsCount] =
      await Promise.all([
        prisma.news.count(),
        prisma.product.count(),
        prisma.solution.count(),
        prisma.job.count(),
        prisma.message.count(),
        prisma.application.count(),
      ]);

    const recentMessages = await prisma.message.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    const recentApplications = await prisma.application.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    // 手动关联职位标题
    const jobIds = [...new Set(recentApplications.map((a) => a.jobId))];
    const jobs = await prisma.job.findMany({
      where: { id: { in: jobIds } },
      select: { id: true, title: true },
    });
    const jobMap = new Map(jobs.map((j) => [j.id, j.title]));
    const recentApplicationsWithJob = recentApplications.map((a) => ({
      ...a,
      job: { title: jobMap.get(a.jobId) ?? '' },
    }));

    logger.info(`[Admin][Stats] Stats result - news=${newsCount}, products=${productsCount}, solutions=${solutionsCount}, jobs=${jobsCount}, messages=${messagesCount}, applications=${applicationsCount}, recentMessages=${recentMessages.length}, recentApplications=${recentApplicationsWithJob.length}`);

    success(res, {
      counts: {
        news: newsCount,
        products: productsCount,
        solutions: solutionsCount,
        jobs: jobsCount,
        messages: messagesCount,
        applications: applicationsCount,
      },
      recentMessages,
      recentApplications: recentApplicationsWithJob,
    });
  } catch (err) {
    logger.error(`[Admin][Stats] Error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

// ==================== 新闻管理 ====================
const newsSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  slug: z.string().min(1, 'Slug 不能为空'),
  summary: z.string().min(1, '摘要不能为空'),
  content: z.string().min(1, '内容不能为空'),
  category: z.string().default('公司动态'),
  tags: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  status: z.string().default('published'),
});

// GET /api/admin/news - 新闻列表
router.get('/news', async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;
    logger.info(`[Admin][News] List query - page=${page}, pageSize=${pageSize}, by ${getOperator(req)}`);

    const [items, total] = await Promise.all([
      prisma.news.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, title: true, slug: true, category: true,
          status: true, viewCount: true, createdAt: true, publishedAt: true,
        },
      }),
      prisma.news.count(),
    ]);

    logger.info(`[Admin][News] List result - total=${total}, returned=${items.length}`);
    success(res, { items, total, page, pageSize });
  } catch (err) {
    logger.error(`[Admin][News] List error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

// POST /api/admin/news - 新建新闻
router.post('/news', adminOnly, async (req, res, next) => {
  try {
    const data = newsSchema.parse(req.body);
    logger.info(`[Admin][News] Create attempt - title="${data.title}", slug="${data.slug}", category="${data.category}", status="${data.status}", by ${getOperator(req)}`);
    const news = await prisma.news.create({ data });
    logger.info(`[Admin][News] Create success - id=${news.id}, slug="${news.slug}", by ${getOperator(req)}`);
    success(res, news, 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      logger.warn(`[Admin][News] Create validation failed - ${err.errors[0]?.message}, by ${getOperator(req)}`);
      return fail(res, err.errors[0]?.message ?? '参数错误', 422);
    }
    logger.error(`[Admin][News] Create error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

// PUT /api/admin/news/:id - 更新新闻
router.put('/news/:id', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = newsSchema.parse(req.body);
    logger.info(`[Admin][News] Update attempt - id=${id}, title="${data.title}", status="${data.status}", by ${getOperator(req)}`);
    const news = await prisma.news.update({ where: { id }, data });
    logger.info(`[Admin][News] Update success - id=${news.id}, slug="${news.slug}", by ${getOperator(req)}`);
    success(res, news);
  } catch (err) {
    if (err instanceof z.ZodError) {
      logger.warn(`[Admin][News] Update validation failed - ${err.errors[0]?.message}, by ${getOperator(req)}`);
      return fail(res, err.errors[0]?.message ?? '参数错误', 422);
    }
    logger.error(`[Admin][News] Update error - ${err instanceof Error ? err.message : String(err)}, id=${req.params.id}, by ${getOperator(req)}`);
    next(err);
  }
});

// DELETE /api/admin/news/:id - 删除新闻
router.delete('/news/:id', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    logger.info(`[Admin][News] Delete attempt - id=${id}, by ${getOperator(req)}`);
    await prisma.news.delete({ where: { id } });
    logger.info(`[Admin][News] Delete success - id=${id}, by ${getOperator(req)}`);
    success(res, { ok: true });
  } catch (err) {
    logger.error(`[Admin][News] Delete error - ${err instanceof Error ? err.message : String(err)}, id=${req.params.id}, by ${getOperator(req)}`);
    next(err);
  }
});

// ==================== 产品管理 ====================
// 生命周期状态：draft 草稿 → active 上架 → archived 下架归档
const PRODUCT_STATUSES = ['draft', 'active', 'archived'] as const;
const productSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  slug: z.string().min(1, 'Slug 不能为空'),
  category: z.string().default('智能车辆管理'),
  description: z.string().min(1, '描述不能为空'),
  features: z.string().optional().default('[]'),
  specs: z.string().optional().nullable(),
  priceInfo: z.string().optional().nullable(),
  scenarios: z.string().optional().nullable(),
  images: z.string().optional().default('[]'),
  coverImage: z.string().optional().nullable(),
  sortOrder: z.number().default(0),
  status: z.enum(PRODUCT_STATUSES).default('active'),
});

router.get('/products', async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;
    logger.info(`[Admin][Product] List query - page=${page}, pageSize=${pageSize}, by ${getOperator(req)}`);
    const [items, total] = await Promise.all([
      prisma.product.findMany({ skip, take: pageSize, orderBy: { sortOrder: 'asc' } }),
      prisma.product.count(),
    ]);
    logger.info(`[Admin][Product] List result - total=${total}, returned=${items.length}`);
    success(res, { items, total, page, pageSize });
  } catch (err) {
    logger.error(`[Admin][Product] List error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

router.post('/products', adminOnly, async (req, res, next) => {
  try {
    const data = productSchema.parse(req.body);
    logger.info(`[Admin][Product] Create attempt - name="${data.name}", slug="${data.slug}", category="${data.category}", status=${data.status}, sortOrder=${data.sortOrder}, by ${getOperator(req)}`);
    // 新建即上架的产品记录首次上架时间
    const item = await prisma.product.create({
      data: { ...data, publishedAt: data.status === 'active' ? new Date() : null },
    });
    logger.info(`[Admin][Product] Create success - id=${item.id}, slug="${item.slug}", by ${getOperator(req)}`);
    success(res, item, 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      logger.warn(`[Admin][Product] Create validation failed - ${err.errors[0]?.message}, by ${getOperator(req)}`);
      return fail(res, err.errors[0]?.message ?? '参数错误', 422);
    }
    logger.error(`[Admin][Product] Create error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

router.put('/products/:id', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = productSchema.parse(req.body);
    logger.info(`[Admin][Product] Update attempt - id=${id}, name="${data.name}", category="${data.category}", status=${data.status}, by ${getOperator(req)}`);
    // 生命周期流转：首次进入上架状态时回填 publishedAt
    const existing = await prisma.product.findUnique({ where: { id }, select: { publishedAt: true } });
    if (!existing) return fail(res, '产品不存在', 404);
    const publishedAt =
      data.status === 'active' && !existing.publishedAt ? new Date() : undefined;
    const item = await prisma.product.update({
      where: { id },
      data: { ...data, ...(publishedAt ? { publishedAt } : {}) },
    });
    logger.info(`[Admin][Product] Update success - id=${item.id}, slug="${item.slug}", status=${item.status}, by ${getOperator(req)}`);
    success(res, item);
  } catch (err) {
    if (err instanceof z.ZodError) {
      logger.warn(`[Admin][Product] Update validation failed - ${err.errors[0]?.message}, by ${getOperator(req)}`);
      return fail(res, err.errors[0]?.message ?? '参数错误', 422);
    }
    logger.error(`[Admin][Product] Update error - ${err instanceof Error ? err.message : String(err)}, id=${req.params.id}, by ${getOperator(req)}`);
    next(err);
  }
});

router.delete('/products/:id', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    logger.info(`[Admin][Product] Delete attempt - id=${id}, by ${getOperator(req)}`);
    await prisma.product.delete({ where: { id } });
    logger.info(`[Admin][Product] Delete success - id=${id}, by ${getOperator(req)}`);
    success(res, { ok: true });
  } catch (err) {
    logger.error(`[Admin][Product] Delete error - ${err instanceof Error ? err.message : String(err)}, id=${req.params.id}, by ${getOperator(req)}`);
    next(err);
  }
});

// ==================== 产品数据分析 ====================
// GET /api/admin/products/analytics - 生命周期/浏览量/趋势分析（仪表盘用）
router.get('/products/analytics', async (req, res, next) => {
  try {
    logger.info(`[Admin][Product][Analytics] Query by ${getOperator(req)}`);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalProducts,
      byStatusRaw,
      byCategoryRaw,
      topViewed,
      zeroViewCount,
      viewsLast30d,
      trendRows,
      totalViewsAgg,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.product.groupBy({ by: ['category'], _count: { _all: true } }),
      prisma.product.findMany({
        orderBy: [{ viewCount: 'desc' }, { sortOrder: 'asc' }],
        take: 10,
        select: { id: true, name: true, slug: true, category: true, status: true, viewCount: true },
      }),
      prisma.product.count({ where: { viewCount: 0, status: 'active' } }),
      prisma.productView.count({ where: { createdAt: { gte: since } } }),
      // 近30天按天聚合浏览量（Prisma 在 SQLite 以毫秒整数存时间，需 unixepoch 转换；localtime 对齐本地时区）
      prisma.$queryRaw<Array<{ day: string; views: bigint }>>`
        SELECT date(created_at / 1000, 'unixepoch', 'localtime') AS day, COUNT(*) AS views
        FROM product_views
        WHERE created_at >= ${since}
        GROUP BY date(created_at / 1000, 'unixepoch', 'localtime')
        ORDER BY day ASC
      `,
      prisma.product.aggregate({ _sum: { viewCount: true } }),
    ]);

    // 补齐 30 天中无浏览的日期，保证趋势图连续（与 SQL 的 localtime 保持一致，用本地日期）
    const trendMap = new Map(trendRows.map((r) => [r.day, Number(r.views)]));
    const trend30: { day: string; views: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      trend30.push({ day: key, views: trendMap.get(key) ?? 0 });
    }

    success(res, {
      totals: {
        products: totalProducts,
        totalViews: totalViewsAgg._sum.viewCount ?? 0,
        viewsLast30d,
        zeroViewActive: zeroViewCount,
      },
      byStatus: byStatusRaw.map((r) => ({ status: r.status, count: r._count._all })),
      byCategory: byCategoryRaw
        .map((r) => ({ category: r.category, count: r._count._all }))
        .sort((a, b) => b.count - a.count),
      topViewed,
      trend30,
    });
  } catch (err) {
    logger.error(`[Admin][Product][Analytics] Error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

// ==================== 产品批量操作（自动化流程） ====================
const batchSchema = z.object({
  action: z.enum(['publish', 'archive', 'delete']),
  ids: z.array(z.number().int().positive()).min(1, '请至少选择一条记录').max(200, '单次批量操作不超过200条'),
});

// POST /api/admin/products/batch - 批量上架/下架归档/删除
router.post('/products/batch', adminOnly, async (req, res, next) => {
  try {
    const { action, ids } = batchSchema.parse(req.body);
    logger.info(`[Admin][Product][Batch] ${action} attempt - ids=[${ids.join(',')}], by ${getOperator(req)}`);

    let affected = 0;
    if (action === 'delete') {
      const r = await prisma.product.deleteMany({ where: { id: { in: ids } } });
      affected = r.count;
    } else if (action === 'publish') {
      // 上架：状态置 active；未上架过的回填 publishedAt（事务保证一致）
      affected = await prisma.$transaction(async (tx) => {
        const r1 = await tx.product.updateMany({
          where: { id: { in: ids } },
          data: { status: 'active' },
        });
        await tx.product.updateMany({
          where: { id: { in: ids }, publishedAt: null },
          data: { publishedAt: new Date() },
        });
        return r1.count;
      });
    } else {
      // 下架归档
      const r = await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { status: 'archived' },
      });
      affected = r.count;
    }

    logger.info(`[Admin][Product][Batch] ${action} success - affected=${affected}, by ${getOperator(req)}`);
    success(res, { ok: true, action, affected });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(res, err.errors[0]?.message ?? '参数错误', 422);
    }
    logger.error(`[Admin][Product][Batch] Error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

// ==================== 产品资料文档管理 ====================
const DOC_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'product-docs');
const DOC_ALLOWED_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
];
const DOC_ALLOWED_EXT = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar', '.7z'];
const DOC_MAX_SIZE = 50 * 1024 * 1024; // 50MB
function ensureDocDir(): void {
  if (!fs.existsSync(DOC_UPLOAD_DIR)) fs.mkdirSync(DOC_UPLOAD_DIR, { recursive: true });
}
ensureDocDir();
const docStorage = multer.diskStorage({
  destination: (_req, _f, cb) => cb(null, DOC_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, name);
  },
});
const docUpload = multer({
  storage: docStorage,
  limits: { fileSize: DOC_MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!DOC_ALLOWED_MIME.includes(file.mimetype) && !DOC_ALLOWED_EXT.includes(ext)) {
      cb(new Error('仅支持 pdf/doc/docx/xls/xlsx/ppt/pptx/zip/rar/7z 文档'));
      return;
    }
    cb(null, true);
  },
});

const documentSchema = z.object({
  productId: z.coerce.number().int().min(1, '必须选择产品'),
  title: z.string().min(1, '标题不能为空').max(200),
  description: z.string().optional().nullable(),
  category: z.enum(['whitepaper', 'manual', 'driver', 'sdk', 'datasheet', 'other']).default('other'),
  fileName: z.string().min(1, '文件名不能为空'),
  fileUrl: z.string().min(1, '请先上传文档或填入外链URL'),
  fileType: z.string().default('application/octet-stream'),
  fileSize: z.coerce.number().int().nonnegative().default(0),
  version: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
  status: z.enum(['active', 'inactive']).default('active'),
  publishedAt: z.coerce.date().optional().nullable(),
});

// POST /api/admin/product-documents/upload - 文档上传（返回 url/fileName/mimeType/size）
router.post('/product-documents/upload', adminOnly, docUpload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return fail(res, '请选择需要上传的文档', 422);
    }
    const relPath = path.relative(process.cwd(), req.file.path).split(path.sep).join('/');
    const url = `/${relPath}`;
    logger.info(`[Admin][ProductDoc] Upload success - fileName="${req.file.originalname}", size=${req.file.size}, url=${url}, by ${getOperator(req)}`);
    success(res, {
      fileName: req.file.originalname,
      fileUrl: url,
      fileType: req.file.mimetype || 'application/octet-stream',
      fileSize: req.file.size,
    });
  } catch (err) {
    if (err instanceof multer.MulterError) {
      logger.warn(`[Admin][ProductDoc] Upload multer error - ${err.message}, by ${getOperator(req)}`);
      return fail(res, `上传失败：${err.message}`, 422);
    }
    logger.error(`[Admin][ProductDoc] Upload error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

// GET /api/admin/product-documents - 列表（可按 productId 筛选）
router.get('/product-documents', async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const productId = req.query.productId ? Number(req.query.productId) : undefined;
    const skip = (page - 1) * pageSize;
    const where: Record<string, unknown> = {};
    if (productId) where.productId = productId;
    const [items, total] = await Promise.all([
      prisma.productDocument.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ productId: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: { product: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.productDocument.count({ where }),
    ]);
    logger.info(`[Admin][ProductDoc] List - total=${total}, productId=${productId ?? 'all'}, by ${getOperator(req)}`);
    paginate(res, items, total, page, pageSize);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/product-documents - 创建
router.post('/product-documents', adminOnly, async (req, res, next) => {
  try {
    const data = documentSchema.parse(req.body);
    logger.info(`[Admin][ProductDoc] Create - title="${data.title}", pid=${data.productId}, cat=${data.category}, by ${getOperator(req)}`);
    const item = await prisma.productDocument.create({ data });
    success(res, item, 201);
  } catch (err) {
    if (err instanceof z.ZodError) return fail(res, err.errors[0]?.message ?? '参数错误', 422);
    next(err);
  }
});

// PUT /api/admin/product-documents/:id - 更新
router.put('/product-documents/:id', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = documentSchema.parse(req.body);
    logger.info(`[Admin][ProductDoc] Update - id=${id}, title="${data.title}", by ${getOperator(req)}`);
    const item = await prisma.productDocument.update({ where: { id }, data });
    success(res, item);
  } catch (err) {
    if (err instanceof z.ZodError) return fail(res, err.errors[0]?.message ?? '参数错误', 422);
    next(err);
  }
});

// DELETE /api/admin/product-documents/:id - 删除
router.delete('/product-documents/:id', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    logger.info(`[Admin][ProductDoc] Delete - id=${id}, by ${getOperator(req)}`);
    const doc = await prisma.productDocument.findUnique({ where: { id } });
    if (doc && !/^https?:\/\//i.test(doc.fileUrl)) {
      const abs = path.resolve(process.cwd(), doc.fileUrl.replace(/^\//, ''));
      if (fs.existsSync(abs)) {
        try { fs.unlinkSync(abs); } catch { /* 忽略删除失败 */ }
      }
    }
    await prisma.productDocument.delete({ where: { id } });
    success(res, { ok: true });
  } catch (err) {
    next(err);
  }
});

// ==================== 解决方案管理 ====================
const solutionSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  slug: z.string().min(1, 'Slug 不能为空'),
  industry: z.string().default('政府机关'),
  content: z.string().min(1, '内容不能为空'),
  coverImage: z.string().optional().nullable(),
  sortOrder: z.number().default(0),
  status: z.string().default('active'),
});

router.get('/solutions', async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;
    logger.info(`[Admin][Solution] List query - page=${page}, pageSize=${pageSize}, by ${getOperator(req)}`);
    const [items, total] = await Promise.all([
      prisma.solution.findMany({ skip, take: pageSize, orderBy: { sortOrder: 'asc' } }),
      prisma.solution.count(),
    ]);
    logger.info(`[Admin][Solution] List result - total=${total}, returned=${items.length}`);
    success(res, { items, total, page, pageSize });
  } catch (err) {
    logger.error(`[Admin][Solution] List error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

router.post('/solutions', adminOnly, async (req, res, next) => {
  try {
    const data = solutionSchema.parse(req.body);
    logger.info(`[Admin][Solution] Create attempt - title="${data.title}", slug="${data.slug}", industry="${data.industry}", status="${data.status}", by ${getOperator(req)}`);
    const item = await prisma.solution.create({ data });
    logger.info(`[Admin][Solution] Create success - id=${item.id}, slug="${item.slug}", by ${getOperator(req)}`);
    success(res, item, 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      logger.warn(`[Admin][Solution] Create validation failed - ${err.errors[0]?.message}, by ${getOperator(req)}`);
      return fail(res, err.errors[0]?.message ?? '参数错误', 422);
    }
    logger.error(`[Admin][Solution] Create error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

router.put('/solutions/:id', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = solutionSchema.parse(req.body);
    logger.info(`[Admin][Solution] Update attempt - id=${id}, title="${data.title}", industry="${data.industry}", by ${getOperator(req)}`);
    const item = await prisma.solution.update({ where: { id }, data });
    logger.info(`[Admin][Solution] Update success - id=${item.id}, slug="${item.slug}", by ${getOperator(req)}`);
    success(res, item);
  } catch (err) {
    if (err instanceof z.ZodError) {
      logger.warn(`[Admin][Solution] Update validation failed - ${err.errors[0]?.message}, by ${getOperator(req)}`);
      return fail(res, err.errors[0]?.message ?? '参数错误', 422);
    }
    logger.error(`[Admin][Solution] Update error - ${err instanceof Error ? err.message : String(err)}, id=${req.params.id}, by ${getOperator(req)}`);
    next(err);
  }
});

router.delete('/solutions/:id', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    logger.info(`[Admin][Solution] Delete attempt - id=${id}, by ${getOperator(req)}`);
    await prisma.solution.delete({ where: { id } });
    logger.info(`[Admin][Solution] Delete success - id=${id}, by ${getOperator(req)}`);
    success(res, { ok: true });
  } catch (err) {
    logger.error(`[Admin][Solution] Delete error - ${err instanceof Error ? err.message : String(err)}, id=${req.params.id}, by ${getOperator(req)}`);
    next(err);
  }
});

// ==================== 职位管理 ====================
const jobSchema = z.object({
  title: z.string().min(1, '职位名称不能为空'),
  department: z.string().default('研发部'),
  location: z.string().default('长沙'),
  type: z.string().default('full-time'),
  description: z.string().min(1, '职位描述不能为空'),
  requirements: z.string().min(1, '任职要求不能为空'),
  status: z.string().default('open'),
});

router.get('/jobs', async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;
    logger.info(`[Admin][Job] List query - page=${page}, pageSize=${pageSize}, by ${getOperator(req)}`);
    const [items, total] = await Promise.all([
      prisma.job.findMany({ skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      prisma.job.count(),
    ]);
    logger.info(`[Admin][Job] List result - total=${total}, returned=${items.length}`);
    success(res, { items, total, page, pageSize });
  } catch (err) {
    logger.error(`[Admin][Job] List error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

router.post('/jobs', adminOnly, async (req, res, next) => {
  try {
    const data = jobSchema.parse(req.body);
    logger.info(`[Admin][Job] Create attempt - title="${data.title}", department="${data.department}", location="${data.location}", type="${data.type}", status="${data.status}", by ${getOperator(req)}`);
    const item = await prisma.job.create({ data });
    logger.info(`[Admin][Job] Create success - id=${item.id}, title="${item.title}", by ${getOperator(req)}`);
    success(res, item, 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      logger.warn(`[Admin][Job] Create validation failed - ${err.errors[0]?.message}, by ${getOperator(req)}`);
      return fail(res, err.errors[0]?.message ?? '参数错误', 422);
    }
    logger.error(`[Admin][Job] Create error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

router.put('/jobs/:id', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = jobSchema.parse(req.body);
    logger.info(`[Admin][Job] Update attempt - id=${id}, title="${data.title}", status="${data.status}", by ${getOperator(req)}`);
    const item = await prisma.job.update({ where: { id }, data });
    logger.info(`[Admin][Job] Update success - id=${item.id}, title="${item.title}", by ${getOperator(req)}`);
    success(res, item);
  } catch (err) {
    if (err instanceof z.ZodError) {
      logger.warn(`[Admin][Job] Update validation failed - ${err.errors[0]?.message}, by ${getOperator(req)}`);
      return fail(res, err.errors[0]?.message ?? '参数错误', 422);
    }
    logger.error(`[Admin][Job] Update error - ${err instanceof Error ? err.message : String(err)}, id=${req.params.id}, by ${getOperator(req)}`);
    next(err);
  }
});

router.delete('/jobs/:id', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    logger.info(`[Admin][Job] Delete attempt - id=${id}, by ${getOperator(req)}`);
    await prisma.job.delete({ where: { id } });
    logger.info(`[Admin][Job] Delete success - id=${id}, by ${getOperator(req)}`);
    success(res, { ok: true });
  } catch (err) {
    logger.error(`[Admin][Job] Delete error - ${err instanceof Error ? err.message : String(err)}, id=${req.params.id}, by ${getOperator(req)}`);
    next(err);
  }
});

// ==================== 留言管理 ====================
router.get('/messages', async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;
    logger.info(`[Admin][Message] List query - page=${page}, pageSize=${pageSize}, by ${getOperator(req)}`);
    const [items, total] = await Promise.all([
      prisma.message.findMany({ skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      prisma.message.count(),
    ]);
    logger.info(`[Admin][Message] List result - total=${total}, returned=${items.length}`);
    success(res, { items, total, page, pageSize });
  } catch (err) {
    logger.error(`[Admin][Message] List error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

router.delete('/messages/:id', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    logger.info(`[Admin][Message] Delete attempt - id=${id}, by ${getOperator(req)}`);
    await prisma.message.delete({ where: { id } });
    logger.info(`[Admin][Message] Delete success - id=${id}, by ${getOperator(req)}`);
    success(res, { ok: true });
  } catch (err) {
    logger.error(`[Admin][Message] Delete error - ${err instanceof Error ? err.message : String(err)}, id=${req.params.id}, by ${getOperator(req)}`);
    next(err);
  }
});

router.put('/messages/:id/status', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    logger.info(`[Admin][Message] Update status attempt - id=${id}, status="${status}", by ${getOperator(req)}`);
    const item = await prisma.message.update({ where: { id }, data: { status } });
    logger.info(`[Admin][Message] Update status success - id=${item.id}, status="${item.status}", by ${getOperator(req)}`);
    success(res, item);
  } catch (err) {
    logger.error(`[Admin][Message] Update status error - ${err instanceof Error ? err.message : String(err)}, id=${req.params.id}, by ${getOperator(req)}`);
    next(err);
  }
});

// POST /api/admin/messages/:id/reply - 回复留言（保存回复内容，若留言人留邮箱则邮件通知）
const messageReplySchema = z.object({
  reply: z.string().min(1, '回复内容不能为空').max(2000, '回复内容不能超过 2000 字'),
});

router.post('/messages/:id/reply', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const parsed = messageReplySchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.issues[0]?.message ?? '参数校验失败', 400, 'MESSAGE_REPLY_INVALID');
    }
    const existing = await prisma.message.findUnique({ where: { id } });
    if (!existing) {
      return fail(res, '留言不存在', 404, 'MESSAGE_NOT_FOUND');
    }

    const item = await prisma.message.update({
      where: { id },
      data: { reply: parsed.data.reply, repliedAt: new Date(), status: 'replied' },
    });

    // 留言人留有邮箱时异步发送回复邮件（fire-and-forget，不阻塞响应）
    let mailQueued = false;
    if (existing.email) {
      mailQueued = true;
      void sendMailTo(
        existing.email,
        `留言回复 - 湖南新蓝恒成信息技术有限公司`,
        [
          `尊敬的 ${existing.name}：`,
          '',
          '感谢您的留言，我们的回复如下：',
          '',
          parsed.data.reply,
          '',
          '---',
          `您的原始留言：${existing.content.slice(0, 200)}${existing.content.length > 200 ? '…' : ''}`,
        ].join('\n'),
      );
    }

    try {
      await prisma.auditLog.create({
        data: {
          action: 'reply',
          targetType: 'message',
          targetId: id,
          detail: JSON.stringify({ replyLen: parsed.data.reply.length, mailTo: existing.email ?? null }),
          operator: getOperator(req),
        },
      });
    } catch (auditErr) {
      logger.error(`[Admin][Message] Reply AuditLog write error - ${auditErr instanceof Error ? auditErr.message : String(auditErr)}`);
    }

    logger.info(`[Admin][Message] Reply - id=${id}, mailQueued=${mailQueued}, by ${getOperator(req)}`);
    success(res, { ...item, mailQueued });
  } catch (err) {
    logger.error(`[Admin][Message] Reply error - ${err instanceof Error ? err.message : String(err)}, id=${req.params.id}, by ${getOperator(req)}`);
    next(err);
  }
});

// ==================== 投递申请管理 ====================
router.get('/applications', async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;
    logger.info(`[Admin][Application] List query - page=${page}, pageSize=${pageSize}, by ${getOperator(req)}`);
    const [rawItems, total] = await Promise.all([
      prisma.application.findMany({
        skip, take: pageSize, orderBy: { createdAt: 'desc' },
      }),
      prisma.application.count(),
    ]);

    // 手动关联职位标题
    const jobIds = [...new Set(rawItems.map((a) => a.jobId))];
    const jobs = await prisma.job.findMany({
      where: { id: { in: jobIds } },
      select: { id: true, title: true },
    });
    const jobMap = new Map(jobs.map((j) => [j.id, j.title]));
    const items = rawItems.map((a) => ({
      ...a,
      job: { title: jobMap.get(a.jobId) ?? '' },
    }));

    logger.info(`[Admin][Application] List result - total=${total}, returned=${items.length}, matchedJobs=${jobs.length}`);
    success(res, { items, total, page, pageSize });
  } catch (err) {
    logger.error(`[Admin][Application] List error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

router.put('/applications/:id/status', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    logger.info(`[Admin][Application] Update status attempt - id=${id}, status="${status}", by ${getOperator(req)}`);
    const item = await prisma.application.update({ where: { id }, data: { status } });
    logger.info(`[Admin][Application] Update status success - id=${item.id}, status="${item.status}", jobId=${item.jobId}, by ${getOperator(req)}`);
    success(res, item);
  } catch (err) {
    logger.error(`[Admin][Application] Update status error - ${err instanceof Error ? err.message : String(err)}, id=${req.params.id}, by ${getOperator(req)}`);
    next(err);
  }
});

router.delete('/applications/:id', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    logger.info(`[Admin][Application] Delete attempt - id=${id}, by ${getOperator(req)}`);
    await prisma.application.delete({ where: { id } });
    logger.info(`[Admin][Application] Delete success - id=${id}, by ${getOperator(req)}`);
    success(res, { ok: true });
  } catch (err) {
    logger.error(`[Admin][Application] Delete error - ${err instanceof Error ? err.message : String(err)}, id=${req.params.id}, by ${getOperator(req)}`);
    next(err);
  }
});

// ==================== 页面配置管理（PageConfig） ====================
// 提供首页（Hero / Values / AboutEntry）等配置化内容的读取与更新。
// 只读列表 + 单项查询任何已登录管理员可访问；更新需要 admin 角色（adminOnly）。
// content 统一存 JSON 字符串，避免 schema 强耦合。

const pageConfigUpdateSchema = z.object({
  content: z.string().min(1, 'content 不能为空（JSON 字符串）'),
});

// GET /api/admin/page-configs?page=home
// 返回某一 page 的所有 section；不带 page 则返回所有（用于后台一次性拉取）
router.get('/page-configs', async (req, res, next) => {
  try {
    const page = typeof req.query.page === 'string' ? req.query.page : undefined;
    logger.info(`[Admin][PageConfig] List query - page=${page ?? '(all)'}, by ${getOperator(req)}`);
    const items = await prisma.pageConfig.findMany({
      where: page ? { page } : {},
      orderBy: [{ page: 'asc' }, { section: 'asc' }],
    });
    // content 字符串原样返回，前端按需 JSON.parse；
    // 防止 admin 后台展示时双引号转义污染 UI，后端不再二次解析。
    success(res, { items });
  } catch (err) {
    logger.error(`[Admin][PageConfig] List error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

// GET /api/admin/page-configs/:page/:section
router.get('/page-configs/:page/:section', async (req, res, next) => {
  try {
    const { page, section } = req.params;
    logger.info(`[Admin][PageConfig] Get - page=${page}, section=${section}, by ${getOperator(req)}`);
    const cfg = await prisma.pageConfig.findUnique({
      where: { page_section: { page, section } },
    });
    if (!cfg) {
      return fail(res, '页面配置不存在', 404, 'PAGE_CONFIG_NOT_FOUND');
    }
    success(res, cfg);
  } catch (err) {
    logger.error(`[Admin][PageConfig] Get error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

// PUT /api/admin/page-configs/:page/:section
// 更新或创建（upsert）某 page/section 的 content。需要 admin 角色。
router.put('/page-configs/:page/:section', adminOnly, async (req, res, next) => {
  try {
    const { page, section } = req.params;
    const parsed = pageConfigUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        'VALIDATION_ERROR',
        400,
        'PAGE_CONFIG_INVALID_CONTENT',
        { issues: parsed.error.issues.map((i) => i.message) },
      );
    }

    // 后端兜底校验：content 必须能被 JSON.parse，否则写入后前端会落到 seed 兜底，无法发现配置错误。
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(parsed.data.content);
    } catch {
      return fail(
        res,
        'content 不是合法 JSON 字符串',
        400,
        'PAGE_CONFIG_INVALID_JSON',
      );
    }
    // 序列化一次以统一格式（去除多余空格、保持字段顺序），避免前后端 diff 噪音
    const normalized = JSON.stringify(parsedJson);

    const cfg = await prisma.pageConfig.upsert({
      where: { page_section: { page, section } },
      update: { content: normalized },
      create: { page, section, content: normalized },
    });

    // 版本快照：每次更新都留档，供历史查看与回滚（写入失败不阻断主流程）
    try {
      await prisma.pageConfigRevision.create({
        data: { page, section, content: normalized, operator: getOperator(req) },
      });
      await prisma.auditLog.create({
        data: {
          action: 'update',
          targetType: 'page_config',
          targetId: cfg.id,
          detail: JSON.stringify({ page, section, contentLen: normalized.length }),
          operator: getOperator(req),
        },
      });
    } catch (auditErr) {
      logger.error(`[Admin][PageConfig] Revision/AuditLog write error - ${auditErr instanceof Error ? auditErr.message : String(auditErr)}`);
    }

    logger.info(`[Admin][PageConfig] Upsert - page=${page}, section=${section}, contentLen=${normalized.length}, by ${getOperator(req)}`);
    success(res, cfg);
  } catch (err) {
    logger.error(`[Admin][PageConfig] Upsert error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

// GET /api/admin/page-configs/:page/:section/revisions - 历史版本列表（最近 30 条）
router.get('/page-configs/:page/:section/revisions', async (req, res, next) => {
  try {
    const { page, section } = req.params;
    logger.info(`[Admin][PageConfig] Revisions query - page=${page}, section=${section}, by ${getOperator(req)}`);
    const items = await prisma.pageConfigRevision.findMany({
      where: { page, section },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    success(res, { items });
  } catch (err) {
    logger.error(`[Admin][PageConfig] Revisions error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

// POST /api/admin/page-configs/:page/:section/rollback - 回滚到指定历史版本
router.post('/page-configs/:page/:section/rollback', adminOnly, async (req, res, next) => {
  try {
    const { page, section } = req.params;
    const revisionId = Number(req.body?.revisionId);
    if (!Number.isInteger(revisionId) || revisionId <= 0) {
      return fail(res, 'revisionId 必须为正整数', 400, 'PAGE_CONFIG_REVISION_ID_INVALID');
    }
    const revision = await prisma.pageConfigRevision.findFirst({
      where: { id: revisionId, page, section },
    });
    if (!revision) {
      return fail(res, '目标历史版本不存在', 404, 'PAGE_CONFIG_REVISION_NOT_FOUND');
    }

    const cfg = await prisma.pageConfig.upsert({
      where: { page_section: { page, section } },
      update: { content: revision.content },
      create: { page, section, content: revision.content },
    });

    // 回滚本身也产生一条新快照与审计记录，保证历史链完整可追溯
    try {
      await prisma.pageConfigRevision.create({
        data: {
          page,
          section,
          content: revision.content,
          operator: `${getOperator(req)} (rollback from #${revisionId})`,
        },
      });
      await prisma.auditLog.create({
        data: {
          action: 'rollback',
          targetType: 'page_config',
          targetId: cfg.id,
          detail: JSON.stringify({ page, section, fromRevisionId: revisionId }),
          operator: getOperator(req),
        },
      });
    } catch (auditErr) {
      logger.error(`[Admin][PageConfig] Rollback Revision/AuditLog write error - ${auditErr instanceof Error ? auditErr.message : String(auditErr)}`);
    }

    logger.info(`[Admin][PageConfig] Rollback - page=${page}, section=${section}, fromRevision=${revisionId}, by ${getOperator(req)}`);
    success(res, cfg);
  } catch (err) {
    logger.error(`[Admin][PageConfig] Rollback error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

// ==================== 轮播 Banner 管理 ====================
const bannerSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100),
  subtitle: z.string().max(200).optional().nullable(),
  image: z.string().min(1, '图片不能为空'),
  link: z.string().max(300).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  enabled: z.boolean().default(true),
});

// GET /api/admin/banners - 全部 Banner（含禁用），按排序
router.get('/banners', async (req, res, next) => {
  try {
    logger.info(`[Admin][Banner] List query by ${getOperator(req)}`);
    const items = await prisma.banner.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    success(res, { items });
  } catch (err) {
    logger.error(`[Admin][Banner] List error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

// POST /api/admin/banners - 新建
router.post('/banners', adminOnly, async (req, res, next) => {
  try {
    const parsed = bannerSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.issues.map((i) => i.message).join('；'), 400, 'BANNER_VALIDATION_ERROR');
    }
    const banner = await prisma.banner.create({ data: parsed.data });
    try {
      await prisma.auditLog.create({
        data: {
          action: 'create',
          targetType: 'banner',
          targetId: banner.id,
          detail: JSON.stringify({ title: banner.title }),
          operator: getOperator(req),
        },
      });
    } catch (auditErr) {
      logger.error(`[Admin][Banner] AuditLog write error - ${auditErr instanceof Error ? auditErr.message : String(auditErr)}`);
    }
    logger.info(`[Admin][Banner] Create - id=${banner.id}, title=${banner.title}, by ${getOperator(req)}`);
    success(res, banner, 201);
  } catch (err) {
    logger.error(`[Admin][Banner] Create error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

// PUT /api/admin/banners/:id - 更新
router.put('/banners/:id', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return fail(res, 'id 不合法', 400, 'BANNER_ID_INVALID');
    }
    const parsed = bannerSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.issues.map((i) => i.message).join('；'), 400, 'BANNER_VALIDATION_ERROR');
    }
    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) {
      return fail(res, 'Banner 不存在', 404, 'BANNER_NOT_FOUND');
    }
    const banner = await prisma.banner.update({ where: { id }, data: parsed.data });
    try {
      await prisma.auditLog.create({
        data: {
          action: 'update',
          targetType: 'banner',
          targetId: id,
          detail: JSON.stringify({ title: banner.title, enabled: banner.enabled }),
          operator: getOperator(req),
        },
      });
    } catch (auditErr) {
      logger.error(`[Admin][Banner] AuditLog write error - ${auditErr instanceof Error ? auditErr.message : String(auditErr)}`);
    }
    logger.info(`[Admin][Banner] Update - id=${id}, by ${getOperator(req)}`);
    success(res, banner);
  } catch (err) {
    logger.error(`[Admin][Banner] Update error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

// DELETE /api/admin/banners/:id - 删除
router.delete('/banners/:id', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return fail(res, 'id 不合法', 400, 'BANNER_ID_INVALID');
    }
    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) {
      return fail(res, 'Banner 不存在', 404, 'BANNER_NOT_FOUND');
    }
    await prisma.banner.delete({ where: { id } });
    try {
      await prisma.auditLog.create({
        data: {
          action: 'delete',
          targetType: 'banner',
          targetId: id,
          detail: JSON.stringify({ title: existing.title }),
          operator: getOperator(req),
        },
      });
    } catch (auditErr) {
      logger.error(`[Admin][Banner] AuditLog write error - ${auditErr instanceof Error ? auditErr.message : String(auditErr)}`);
    }
    logger.info(`[Admin][Banner] Delete - id=${id}, by ${getOperator(req)}`);
    success(res, { id });
  } catch (err) {
    logger.error(`[Admin][Banner] Delete error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

// ==================== 友情链接管理 ====================
const friendLinkSchema = z.object({
  title: z.string().min(1, '名称不能为空').max(100),
  url: z.string().min(1, '链接不能为空').max(300).refine(
    (v) => /^https?:\/\//i.test(v) || v.startsWith('/'),
    '链接需为 http(s):// 或站内路径',
  ),
  sortOrder: z.number().int().min(0).default(0),
  enabled: z.boolean().default(true),
});

// GET /api/admin/friend-links - 全部友情链接（含禁用），按排序
router.get('/friend-links', async (req, res, next) => {
  try {
    logger.info(`[Admin][FriendLink] List query by ${getOperator(req)}`);
    const items = await prisma.friendLink.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    success(res, { items });
  } catch (err) {
    logger.error(`[Admin][FriendLink] List error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

// POST /api/admin/friend-links - 新建
router.post('/friend-links', adminOnly, async (req, res, next) => {
  try {
    const parsed = friendLinkSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.issues.map((i) => i.message).join('；'), 400, 'FRIEND_LINK_VALIDATION_ERROR');
    }
    const item = await prisma.friendLink.create({ data: parsed.data });
    try {
      await prisma.auditLog.create({
        data: {
          action: 'create',
          targetType: 'friend_link',
          targetId: item.id,
          detail: JSON.stringify({ title: item.title }),
          operator: getOperator(req),
        },
      });
    } catch (auditErr) {
      logger.error(`[Admin][FriendLink] AuditLog write error - ${auditErr instanceof Error ? auditErr.message : String(auditErr)}`);
    }
    logger.info(`[Admin][FriendLink] Create - id=${item.id}, title=${item.title}, by ${getOperator(req)}`);
    success(res, item, 201);
  } catch (err) {
    logger.error(`[Admin][FriendLink] Create error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

// PUT /api/admin/friend-links/:id - 更新
router.put('/friend-links/:id', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return fail(res, 'id 不合法', 400, 'FRIEND_LINK_ID_INVALID');
    }
    const parsed = friendLinkSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.issues.map((i) => i.message).join('；'), 400, 'FRIEND_LINK_VALIDATION_ERROR');
    }
    const existing = await prisma.friendLink.findUnique({ where: { id } });
    if (!existing) {
      return fail(res, '友情链接不存在', 404, 'FRIEND_LINK_NOT_FOUND');
    }
    const item = await prisma.friendLink.update({ where: { id }, data: parsed.data });
    try {
      await prisma.auditLog.create({
        data: {
          action: 'update',
          targetType: 'friend_link',
          targetId: id,
          detail: JSON.stringify({ title: item.title, enabled: item.enabled }),
          operator: getOperator(req),
        },
      });
    } catch (auditErr) {
      logger.error(`[Admin][FriendLink] AuditLog write error - ${auditErr instanceof Error ? auditErr.message : String(auditErr)}`);
    }
    logger.info(`[Admin][FriendLink] Update - id=${id}, by ${getOperator(req)}`);
    success(res, item);
  } catch (err) {
    logger.error(`[Admin][FriendLink] Update error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

// DELETE /api/admin/friend-links/:id - 删除
router.delete('/friend-links/:id', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return fail(res, 'id 不合法', 400, 'FRIEND_LINK_ID_INVALID');
    }
    const existing = await prisma.friendLink.findUnique({ where: { id } });
    if (!existing) {
      return fail(res, '友情链接不存在', 404, 'FRIEND_LINK_NOT_FOUND');
    }
    await prisma.friendLink.delete({ where: { id } });
    try {
      await prisma.auditLog.create({
        data: {
          action: 'delete',
          targetType: 'friend_link',
          targetId: id,
          detail: JSON.stringify({ title: existing.title }),
          operator: getOperator(req),
        },
      });
    } catch (auditErr) {
      logger.error(`[Admin][FriendLink] AuditLog write error - ${auditErr instanceof Error ? auditErr.message : String(auditErr)}`);
    }
    logger.info(`[Admin][FriendLink] Delete - id=${id}, by ${getOperator(req)}`);
    success(res, { id });
  } catch (err) {
    logger.error(`[Admin][FriendLink] Delete error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

// ==================== 数据备份导出 ====================
// GET /api/admin/backup - 全量数据导出为 JSON 文件下载
router.get('/backup', adminOnly, async (req, res, next) => {
  try {
    logger.info(`[Admin][Backup] Export started by ${getOperator(req)}`);
    const [
      news,
      products,
      productDocuments,
      solutions,
      jobs,
      messages,
      applications,
      media,
      pageConfigs,
      pageConfigRevisions,
      banners,
      friendLinks,
      logoConfigs,
      footerContacts,
      footerLinks,
      auditLogs,
      users,
    ] = await Promise.all([
      prisma.news.findMany(),
      prisma.product.findMany(),
      prisma.productDocument.findMany(),
      prisma.solution.findMany(),
      prisma.job.findMany(),
      prisma.message.findMany(),
      prisma.application.findMany(),
      prisma.media.findMany(),
      prisma.pageConfig.findMany(),
      prisma.pageConfigRevision.findMany(),
      prisma.banner.findMany(),
      prisma.friendLink.findMany(),
      prisma.logoConfig.findMany(),
      prisma.footerContact.findMany(),
      prisma.footerLink.findMany(),
      prisma.auditLog.findMany(),
      prisma.user.findMany({
        // 明确剔除 2FA 密钥；password 为 bcrypt hash，恢复账号所必需故保留
        select: {
          id: true,
          username: true,
          password: true,
          role: true,
          twoFactorEnabled: true,
          failedAttempts: true,
          lockedUntil: true,
          lastLoginAt: true,
          lastLoginIp: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const payload = {
      meta: {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        operator: getOperator(req),
        counts: {
          news: news.length,
          products: products.length,
          productDocuments: productDocuments.length,
          solutions: solutions.length,
          jobs: jobs.length,
          messages: messages.length,
          applications: applications.length,
          media: media.length,
          pageConfigs: pageConfigs.length,
          pageConfigRevisions: pageConfigRevisions.length,
          banners: banners.length,
          friendLinks: friendLinks.length,
          logoConfigs: logoConfigs.length,
          footerContacts: footerContacts.length,
          footerLinks: footerLinks.length,
          auditLogs: auditLogs.length,
          users: users.length,
        },
      },
      data: {
        news,
        products,
        productDocuments,
        solutions,
        jobs,
        messages,
        applications,
        media,
        pageConfigs,
        pageConfigRevisions,
        banners,
        friendLinks,
        logoConfigs,
        footerContacts,
        footerLinks,
        auditLogs,
        users,
      },
    };

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const filename = `xinlan-backup-${stamp}.json`;

    logger.info(`[Admin][Backup] Export done - file=${filename}, counts=${JSON.stringify(payload.meta.counts)}, by ${getOperator(req)}`);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(payload, null, 2));
  } catch (err) {
    logger.error(`[Admin][Backup] Export error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

// ==================== 数据备份恢复 ====================
// POST /api/admin/backup/restore - 从备份 JSON 恢复数据
// 策略：按 id 逐条 upsert（合并而非清空覆盖），不会删除备份之外的新数据；
// auditLogs 不恢复（历史操作日志无恢复意义且量大）；单条失败跳过并计数，不中断整体。
type Upsertable = {
  upsert: (args: {
    where: { id: number };
    update: Record<string, unknown>;
    create: Record<string, unknown>;
  }) => Promise<unknown>;
};

const RESTORE_TABLES: ReadonlyArray<{
  key: string;
  delegate: () => Upsertable;
}> = [
  { key: 'news', delegate: () => prisma.news as unknown as Upsertable },
  { key: 'products', delegate: () => prisma.product as unknown as Upsertable },
  { key: 'productDocuments', delegate: () => prisma.productDocument as unknown as Upsertable },
  { key: 'solutions', delegate: () => prisma.solution as unknown as Upsertable },
  { key: 'jobs', delegate: () => prisma.job as unknown as Upsertable },
  { key: 'messages', delegate: () => prisma.message as unknown as Upsertable },
  { key: 'applications', delegate: () => prisma.application as unknown as Upsertable },
  { key: 'media', delegate: () => prisma.media as unknown as Upsertable },
  { key: 'pageConfigs', delegate: () => prisma.pageConfig as unknown as Upsertable },
  { key: 'pageConfigRevisions', delegate: () => prisma.pageConfigRevision as unknown as Upsertable },
  { key: 'banners', delegate: () => prisma.banner as unknown as Upsertable },
  { key: 'friendLinks', delegate: () => prisma.friendLink as unknown as Upsertable },
  { key: 'logoConfigs', delegate: () => prisma.logoConfig as unknown as Upsertable },
  { key: 'footerContacts', delegate: () => prisma.footerContact as unknown as Upsertable },
  { key: 'footerLinks', delegate: () => prisma.footerLink as unknown as Upsertable },
  { key: 'users', delegate: () => prisma.user as unknown as Upsertable },
];

router.post('/backup/restore', adminOnly, async (req, res, next) => {
  try {
    const { meta, data } = req.body ?? {};
    if (!meta || typeof meta !== 'object' || meta.version !== '1.0') {
      return fail(res, '备份文件格式不正确（meta.version 缺失或不支持）', 400, 'BACKUP_INVALID_META');
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return fail(res, '备份文件格式不正确（data 缺失）', 400, 'BACKUP_INVALID_DATA');
    }

    logger.warn(`[Admin][Backup] Restore started - exportedAt=${meta.exportedAt ?? '?'}, exportedBy=${meta.operator ?? '?'}, by ${getOperator(req)}`);

    const results: Record<string, { restored: number; failed: number }> = {};
    for (const table of RESTORE_TABLES) {
      const rows = (data as Record<string, unknown>)[table.key];
      if (!Array.isArray(rows)) {
        results[table.key] = { restored: 0, failed: 0 };
        continue;
      }
      let restored = 0;
      let failed = 0;
      const model = table.delegate();
      for (const row of rows) {
        const id = (row as { id?: unknown })?.id;
        if (!Number.isInteger(id) || (id as number) <= 0) {
          failed += 1;
          continue;
        }
        // 剥离运行时字段风险：users 表不恢复 2FA 密钥（备份中本就不含）
        const record = row as Record<string, unknown>;
        try {
          await model.upsert({
            where: { id: id as number },
            update: record,
            create: record,
          });
          restored += 1;
        } catch (rowErr) {
          failed += 1;
          logger.error(`[Admin][Backup] Restore row error - table=${table.key}, id=${id}, ${rowErr instanceof Error ? rowErr.message : String(rowErr)}`);
        }
      }
      results[table.key] = { restored, failed };
    }

    try {
      await prisma.auditLog.create({
        data: {
          action: 'restore',
          targetType: 'backup',
          targetId: 0,
          detail: JSON.stringify({ exportedAt: meta.exportedAt ?? null, results }),
          operator: getOperator(req),
        },
      });
    } catch (auditErr) {
      logger.error(`[Admin][Backup] Restore AuditLog write error - ${auditErr instanceof Error ? auditErr.message : String(auditErr)}`);
    }

    const totalRestored = Object.values(results).reduce((s, r) => s + r.restored, 0);
    const totalFailed = Object.values(results).reduce((s, r) => s + r.failed, 0);
    logger.warn(`[Admin][Backup] Restore done - restored=${totalRestored}, failed=${totalFailed}, by ${getOperator(req)}`);
    success(res, { results, totalRestored, totalFailed });
  } catch (err) {
    logger.error(`[Admin][Backup] Restore error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

// ==================== 操作日志（AuditLog 通用查询） ====================
// GET /api/admin/audit-logs?page=1&pageSize=20&targetType=logo&action=delete
router.get('/audit-logs', adminOnly, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const targetType = typeof req.query.targetType === 'string' && req.query.targetType.trim() ? req.query.targetType.trim() : undefined;
    const action = typeof req.query.action === 'string' && req.query.action.trim() ? req.query.action.trim() : undefined;
    const keyword = typeof req.query.keyword === 'string' && req.query.keyword.trim() ? req.query.keyword.trim() : undefined;
    const where = {
      ...(targetType ? { targetType } : {}),
      ...(action ? { action } : {}),
      ...(keyword
        ? {
            OR: [
              { operator: { contains: keyword } },
              { detail: { contains: keyword } },
            ],
          }
        : {}),
    };
    logger.info(`[Admin][AuditLog] List query - page=${page}, pageSize=${pageSize}, targetType=${targetType ?? '(all)'}, action=${action ?? '(all)'}, keyword=${keyword ?? '(none)'}, by ${getOperator(req)}`);

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);
    // 与 admin 其他列表接口保持一致的平铺分页结构（匹配前端 PaginatedAdminList）
    success(res, { items, total, page, pageSize });
  } catch (err) {
    logger.error(`[Admin][AuditLog] List error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

// ==================== 限流状态 / 清理接口 ====================
// 当用户反馈"请求过于频繁，请稍后再试"时，管理员可以：
//   A) GET /api/admin/rate-limit/status    → 查看双限流器当前配置、命中量、内网 IP 是否豁免等
//   B) POST /api/admin/rate-limit/reset    → 按 scope 清空限流记录（避免靠重启服务清空内存 store）
//        scope:
//          - 'login_all'                → 清除登录专属 limiter 所有 IP/用户
//          - 'global_all'               → 清除全局 limiter 所有记录（仅 admin）
//          - 'all'                      → 清除两者（仅 admin）
//          - 'login_by_ip'              → 可选: ip + username 精确清除某个用户(共享出口下只影响该用户,不影响同事)
//          - 'global_by_ip'             → 可选: ip 清除全局(仅 admin)
//        body: { scope, ip?: string, username?: string }

const rateLimitResetSchema = z.object({
  scope: z.enum(['login_all', 'global_all', 'all', 'login_by_ip', 'global_by_ip']),
  ip: z
    .string()
    .trim()
    .regex(/^[\w.:[\]]+$/i, 'IP 格式不合法')
    .optional()
    .nullable(),
  username: z.string().trim().max(64).optional().nullable(),
});

router.get('/rate-limit/status', async (req, res) => {
  const globalStore = (globalLimiter as any).store;
  const loginStore = (loginRateLimiter as any).store;
  const globalKeys = globalStore && typeof globalStore.keys === 'function' ? (await globalStore.keys()) ?? [] : null;
  const loginKeys = loginStore && typeof loginStore.keys === 'function' ? (await loginStore.keys()) ?? [] : null;
  success(res, {
    config: {
      global: {
        windowMs: (globalLimiter as any).windowMs ?? null,
        max: (globalLimiter as any).max ?? null,
      },
      login: {
        windowMs: (loginRateLimiter as any).windowMs ?? null,
        max: (loginRateLimiter as any).max ?? null,
      },
    },
    counts: {
      globalDistinctKeys: Array.isArray(globalKeys) ? globalKeys.length : null,
      loginDistinctKeys: Array.isArray(loginKeys) ? loginKeys.length : null,
    },
    client: {
      ip: req.ip ?? null,
      loopback: isLoopbackIp(req.ip),
      xff: (req.headers['x-forwarded-for'] as string) ?? null,
      loginKeyIfLoginToday: buildLoginRateLimitKey(req.ip || '', req.user?.username || undefined),
    },
  });
});

router.post('/rate-limit/reset', adminOnly, async (req, res, next) => {
  try {
    const parsed = rateLimitResetSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return fail(
        res,
        '参数错误：' + parsed.error.issues.map((i) => i.message).join('；'),
        400,
        'VALIDATION_ERROR',
      );
    }
    const { scope, ip, username } = parsed.data;
    const operator = getOperator(req);
    const cleared: string[] = [];

    const needAdminGlobal = scope === 'global_all' || scope === 'global_by_ip' || scope === 'all';
    if (needAdminGlobal && req.user?.role !== 'admin') {
      return fail(res, '清理全局/所有限流记录需要管理员(admin)角色', 403, 'ROLE_REQUIRED_ADMIN');
    }

    // --- (A) login scope 清除 ---
    if (scope === 'login_all' || scope === 'all') {
      const store = (loginRateLimiter as any).store;
      if (store && typeof store.resetAll === 'function') {
        await store.resetAll();
      } else if (store && typeof store.resetKey === 'function') {
        // 老版 store 无 resetAll：退化为按 keys 遍历
        const keys = typeof store.keys === 'function' ? (await store.keys()) ?? [] : [];
        for (const k of keys) await store.resetKey(k);
      }
      cleared.push('login_all');
    } else if (scope === 'login_by_ip') {
      if (!ip) return fail(res, 'login_by_ip 需要提供 ip 参数', 400, 'VALIDATION_ERROR');
      const store = (loginRateLimiter as any).store;
      if (store && typeof store.resetKey === 'function') {
        if (username) {
          // 精确按 "ip + username" 单独清理：共享出口下同事登录计数不受影响
          await store.resetKey(buildLoginRateLimitKey(ip, username));
          cleared.push(`login_by_ip:user=${username}@${ip}`);
        } else {
          // 模糊清理该 IP 下所有用户名：取所有 keys 过滤前缀=`${ip}|`
          const keys = typeof store.keys === 'function' ? (await store.keys()) ?? [] : [];
          const prefix = `${ip}|`;
          let count = 0;
          for (const k of keys) {
            if (k === ip || k.startsWith(prefix)) {
              await store.resetKey(k);
              count += 1;
            }
          }
          cleared.push(`login_by_ip:*@${ip}, clearedCount=${count}`);
        }
      }
    }

    // --- (B) global scope 清除 ---
    if (scope === 'global_all' || scope === 'all') {
      const store = (globalLimiter as any).store;
      if (store && typeof store.resetAll === 'function') {
        await store.resetAll();
      } else if (store && typeof store.resetKey === 'function') {
        const keys = typeof store.keys === 'function' ? (await store.keys()) ?? [] : [];
        for (const k of keys) await store.resetKey(k);
      }
      cleared.push('global_all');
    } else if (scope === 'global_by_ip') {
      if (!ip) return fail(res, 'global_by_ip 需要提供 ip 参数', 400, 'VALIDATION_ERROR');
      const store = (globalLimiter as any).store;
      if (store && typeof store.resetKey === 'function') {
        await store.resetKey(ip);
        cleared.push(`global_by_ip:${ip}`);
      }
    }

    logger.warn(
      `[Admin][RateLimit:Reset] scope=${scope} ip=${ip ?? '-'} username=${username ?? '-'} ` +
      `cleared=[${cleared.join('|')}] by ${operator}`,
    );
    success(res, {
      ok: true,
      scope,
      cleared,
      // 立即回传 reset 后用户该 IP 的状态（secondsUntil > 0 说明仍有限时剩余）
      client: {
        ip: req.ip ?? null,
        loginCountdownSeconds: secondsUntil(
          (req as any).rateLimit?.resetTime ? (req as any).rateLimit.resetTime.getTime() - Date.now() : 0,
        ),
      },
    });
  } catch (err) {
    logger.error(`[Admin][RateLimit:Reset] error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

// ==================== 用户管理 ====================
// 安全约束：全部 adminOnly；password/twoFactorSecret 永不回传；禁止自杀式操作（禁用/降级自己、移除唯一可用 admin）
const USER_SAFE_SELECT = {
  id: true,
  username: true,
  role: true,
  disabled: true,
  twoFactorEnabled: true,
  failedAttempts: true,
  lockedUntil: true,
  lastLoginAt: true,
  lastLoginIp: true,
  createdAt: true,
  updatedAt: true,
} as const;

const usernameSchema = z
  .string()
  .min(3, '用户名至少 3 位')
  .max(32, '用户名不能超过 32 位')
  .regex(/^[a-zA-Z0-9_-]+$/, '用户名仅支持字母、数字、下划线、连字符');

const userCreateSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, '密码不能为空').max(128),
  role: z.enum(['admin', 'editor']).default('editor'),
});

const userRoleSchema = z.object({ role: z.enum(['admin', 'editor']) });
const userPasswordSchema = z.object({ password: z.string().min(1, '密码不能为空').max(128) });
const userDisabledSchema = z.object({ disabled: z.boolean() });

// 统计当前可用的（未禁用）admin 数量
async function countActiveAdmins(excludeUserId?: number): Promise<number> {
  return prisma.user.count({
    where: {
      role: 'admin',
      disabled: false,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
  });
}

// GET /api/admin/users - 用户列表
router.get('/users', adminOnly, async (req, res, next) => {
  try {
    const items = await prisma.user.findMany({
      select: USER_SAFE_SELECT,
      orderBy: { id: 'asc' },
    });
    success(res, { items });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/users - 新建用户
router.post('/users', adminOnly, async (req, res, next) => {
  try {
    const parsed = userCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.issues[0]?.message ?? '参数校验失败', 400, 'USER_CREATE_INVALID');
    }
    const { username, password, role } = parsed.data;

    const policy = validatePasswordPolicy(password, username);
    if (!policy.ok) {
      return fail(res, `密码不符合复杂度要求：${policy.errors.join('；')}`, 422, 'WEAK_PASSWORD', { errors: policy.errors });
    }

    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) {
      return fail(res, '用户名已存在', 409, 'USER_EXISTS');
    }

    const hashed = await bcrypt.hash(password, 12);
    const item = await prisma.user.create({
      data: { username, password: hashed, role },
      select: USER_SAFE_SELECT,
    });

    try {
      await prisma.auditLog.create({
        data: {
          action: 'create',
          targetType: 'user',
          targetId: item.id,
          detail: JSON.stringify({ username, role }),
          operator: getOperator(req),
        },
      });
    } catch (auditErr) {
      logger.error(`[Admin][User] Create AuditLog write error - ${auditErr instanceof Error ? auditErr.message : String(auditErr)}`);
    }

    logger.info(`[Admin][User] Create - id=${item.id}, username=${username}, role=${role}, by ${getOperator(req)}`);
    success(res, item);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id/role - 变更角色
router.put('/users/:id/role', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const parsed = userRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, '角色不合法（仅支持 admin | editor）', 400, 'USER_ROLE_INVALID');
    }
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return fail(res, '用户不存在', 404, 'USER_NOT_FOUND');

    if (req.user?.id === id && parsed.data.role !== 'admin') {
      return fail(res, '不能降级自己的角色', 400, 'USER_SELF_ROLE_CHANGE');
    }
    // 降级 admin → editor 时，保证系统至少还剩一个可用 admin
    if (target.role === 'admin' && parsed.data.role === 'editor') {
      const remaining = await countActiveAdmins(id);
      if (remaining === 0) {
        return fail(res, '系统至少需保留一个可用的管理员账号', 400, 'USER_LAST_ADMIN');
      }
    }

    const item = await prisma.user.update({
      where: { id },
      data: { role: parsed.data.role },
      select: USER_SAFE_SELECT,
    });

    try {
      await prisma.auditLog.create({
        data: {
          action: 'update_role',
          targetType: 'user',
          targetId: id,
          detail: JSON.stringify({ from: target.role, to: parsed.data.role }),
          operator: getOperator(req),
        },
      });
    } catch (auditErr) {
      logger.error(`[Admin][User] Role AuditLog write error - ${auditErr instanceof Error ? auditErr.message : String(auditErr)}`);
    }

    logger.warn(`[Admin][User] Role changed - id=${id}, ${target.role} -> ${parsed.data.role}, by ${getOperator(req)}`);
    success(res, item);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id/password - 重置密码
router.put('/users/:id/password', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const parsed = userPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, '密码不能为空', 400, 'USER_PASSWORD_INVALID');
    }
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return fail(res, '用户不存在', 404, 'USER_NOT_FOUND');

    const policy = validatePasswordPolicy(parsed.data.password, target.username);
    if (!policy.ok) {
      return fail(res, `密码不符合复杂度要求：${policy.errors.join('；')}`, 422, 'WEAK_PASSWORD', { errors: policy.errors });
    }

    const hashed = await bcrypt.hash(parsed.data.password, 12);
    await prisma.user.update({
      where: { id },
      // 重置密码同时解除锁定与失败计数，避免"改了密码仍被锁"
      data: { password: hashed, failedAttempts: 0, lockedUntil: null },
    });

    try {
      await prisma.auditLog.create({
        data: {
          action: 'reset_password',
          targetType: 'user',
          targetId: id,
          detail: JSON.stringify({ username: target.username }),
          operator: getOperator(req),
        },
      });
    } catch (auditErr) {
      logger.error(`[Admin][User] ResetPw AuditLog write error - ${auditErr instanceof Error ? auditErr.message : String(auditErr)}`);
    }

    logger.warn(`[Admin][User] Password reset - id=${id}, username=${target.username}, by ${getOperator(req)}`);
    success(res, { id, ok: true });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id/disabled - 禁用/启用
router.put('/users/:id/disabled', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const parsed = userDisabledSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, 'disabled 需为布尔值', 400, 'USER_DISABLED_INVALID');
    }
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return fail(res, '用户不存在', 404, 'USER_NOT_FOUND');

    if (req.user?.id === id && parsed.data.disabled) {
      return fail(res, '不能禁用自己的账号', 400, 'USER_SELF_DISABLE');
    }
    // 禁用 admin 时，保证系统至少还剩一个可用 admin
    if (parsed.data.disabled && target.role === 'admin' && !target.disabled) {
      const remaining = await countActiveAdmins(id);
      if (remaining === 0) {
        return fail(res, '系统至少需保留一个可用的管理员账号', 400, 'USER_LAST_ADMIN');
      }
    }

    const item = await prisma.user.update({
      where: { id },
      // 禁用时顺带清零锁定状态；启用时也清零，确保"启用即可登录"
      data: { disabled: parsed.data.disabled, failedAttempts: 0, lockedUntil: null },
      select: USER_SAFE_SELECT,
    });

    try {
      await prisma.auditLog.create({
        data: {
          action: parsed.data.disabled ? 'disable' : 'enable',
          targetType: 'user',
          targetId: id,
          detail: JSON.stringify({ username: target.username }),
          operator: getOperator(req),
        },
      });
    } catch (auditErr) {
      logger.error(`[Admin][User] Disable AuditLog write error - ${auditErr instanceof Error ? auditErr.message : String(auditErr)}`);
    }

    logger.warn(`[Admin][User] ${parsed.data.disabled ? 'Disabled' : 'Enabled'} - id=${id}, username=${target.username}, by ${getOperator(req)}`);
    success(res, item);
  } catch (err) {
    next(err);
  }
});

// ==================== 审计日志查询 ====================
// GET /api/admin/audit-logs/facets - 筛选器可选项（已出现过的 action / targetType）
router.get('/audit-logs/facets', adminOnly, async (req, res, next) => {
  try {
    const [actions, targetTypes] = await Promise.all([
      prisma.auditLog.findMany({ select: { action: true }, distinct: ['action'], orderBy: { action: 'asc' } }),
      prisma.auditLog.findMany({ select: { targetType: true }, distinct: ['targetType'], orderBy: { targetType: 'asc' } }),
    ]);
    success(res, {
      actions: actions.map((a) => a.action),
      targetTypes: targetTypes.map((t) => t.targetType),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
