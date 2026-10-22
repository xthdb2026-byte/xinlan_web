import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { success } from '../utils/response';
import { AppError } from '../middleware/error';

const router = Router();

// GET /api/solutions - 解决方案列表
router.get('/', async (req, res, next) => {
  try {
    const industry = req.query.industry as string | undefined;
    const where: Record<string, unknown> = { status: 'active' };
    if (industry) where.industry = industry;

    const items = await prisma.solution.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        industry: true,
        content: true,
        coverImage: true,
        sortOrder: true,
      },
    });
    success(res, items);
  } catch (err) {
    next(err);
  }
});

// GET /api/solutions/:slug - 方案详情
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const solution = await prisma.solution.findUnique({ where: { slug } });
    if (!solution) {
      const err: AppError = new Error('解决方案不存在');
      err.statusCode = 404;
      throw err;
    }
    success(res, solution);
  } catch (err) {
    next(err);
  }
});

export default router;
