import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { success, paginate, fail } from '../utils/response';
import { AppError } from '../middleware/error';

const router = Router();

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  category: z.string().optional(),
  tag: z.string().optional(),
  status: z.string().default('published'),
});

// GET /api/news - 新闻列表（分页/分类/标签筛选）
router.get('/', async (req, res, next) => {
  try {
    const { page, pageSize, category, tag, status } = listSchema.parse(req.query);
    const where: Record<string, unknown> = { status };
    if (category) where.category = category;
    if (tag) where.tags = { contains: tag };

    const [items, total] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          coverImage: true,
          category: true,
          tags: true,
          viewCount: true,
          publishedAt: true,
        },
      }),
      prisma.news.count({ where }),
    ]);

    paginate(res, items, total, page, pageSize);
  } catch (err) {
    next(err);
  }
});

// GET /api/news/latest - 最新新闻（首页用）
router.get('/latest', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 3, 10);
    const items = await prisma.news.findMany({
      where: { status: 'published' },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        coverImage: true,
        category: true,
        publishedAt: true,
      },
    });
    success(res, items);
  } catch (err) {
    next(err);
  }
});

// GET /api/news/:slug - 新闻详情（自增浏览量）
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const news = await prisma.news.findUnique({ where: { slug } });
    if (!news) {
      const err: AppError = new Error('新闻不存在');
      err.statusCode = 404;
      throw err;
    }
    // 自增浏览量
    await prisma.news.update({
      where: { id: news.id },
      data: { viewCount: { increment: 1 } },
    });
    success(res, news);
  } catch (err) {
    next(err);
  }
});

export default router;
