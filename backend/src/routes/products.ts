import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { success, paginate, fail } from '../utils/response';
import { AppError } from '../middleware/error';

const router = Router();

// 列表/详情共用的摘要字段
const PRODUCT_SUMMARY_SELECT = {
  id: true,
  name: true,
  slug: true,
  category: true,
  description: true,
  coverImage: true,
  sortOrder: true,
  viewCount: true,
} as const;

// GET /api/products - 产品列表
router.get('/', async (req, res, next) => {
  try {
    const category = req.query.category as string | undefined;
    const where: Record<string, unknown> = { status: 'active' };
    if (category) where.category = category;

    const items = await prisma.product.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      select: PRODUCT_SUMMARY_SELECT,
    });
    success(res, items);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/categories - 产品分类列表
router.get('/categories', async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'active' },
      select: { category: true },
      distinct: ['category'],
    });
    const categories = products.map((p) => p.category);
    success(res, categories);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/featured - 精选产品（首页用）
router.get('/featured', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 3, 10);
    const items = await prisma.product.findMany({
      where: { status: 'active' },
      orderBy: { sortOrder: 'asc' },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        description: true,
        coverImage: true,
      },
    });
    success(res, items);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:slug - 产品详情（仅上架产品对外可见，与列表/埋点口径一致）
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await prisma.product.findFirst({ where: { slug, status: 'active' } });
    if (!product) {
      const err: AppError = new Error('产品不存在或未上架');
      err.statusCode = 404;
      throw err;
    }
    success(res, product);
  } catch (err) {
    next(err);
  }
});

// ==================== 智能推荐 ====================
// GET /api/products/:slug/related - 相关产品推荐
// 策略：同分类 + 已上架 + 排除自身，按浏览量降序（热度优先）、sortOrder 升序兜底
router.get('/:slug/related', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const limit = Math.min(Number(req.query.limit) || 4, 8);
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, category: true },
    });
    if (!product) {
      const err: AppError = new Error('产品不存在');
      err.statusCode = 404;
      throw err;
    }
    const items = await prisma.product.findMany({
      where: { status: 'active', category: product.category, id: { not: product.id } },
      orderBy: [{ viewCount: 'desc' }, { sortOrder: 'asc' }],
      take: limit,
      select: PRODUCT_SUMMARY_SELECT,
    });
    success(res, items);
  } catch (err) {
    next(err);
  }
});

// ==================== 匿名浏览埋点 ====================
const viewTrackSchema = z.object({
  referrer: z.string().max(500).optional().nullable(),
});

// POST /api/products/:slug/view - 记录一次产品浏览（匿名：不存 IP/UA）
// 前端按 session 去重，避免刷新/StrictMode 重复计数
router.post('/:slug/view', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const parsed = viewTrackSchema.safeParse(req.body ?? {});
    const referrer = parsed.success ? parsed.data.referrer ?? null : null;

    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });
    if (!product || product.status !== 'active') {
      const err: AppError = new Error('产品不存在或未上架');
      err.statusCode = 404;
      throw err;
    }

    // 写浏览明细 + 累计计数，同事务保证一致性
    await prisma.$transaction([
      prisma.productView.create({ data: { productId: product.id, referrer } }),
      prisma.product.update({
        where: { id: product.id },
        data: { viewCount: { increment: 1 } },
      }),
    ]);
    success(res, { ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
