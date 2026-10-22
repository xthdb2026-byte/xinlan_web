import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { success } from '../utils/response';
import { AppError } from '../middleware/error';

const router = Router();

// GET /api/jobs - 招聘职位列表
router.get('/', async (req, res, next) => {
  try {
    const department = req.query.department as string | undefined;
    const type = req.query.type as string | undefined;
    const where: Record<string, unknown> = { status: 'open' };
    if (department) where.department = department;
    if (type) where.type = type;

    const items = await prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    success(res, items);
  } catch (err) {
    next(err);
  }
});

// GET /api/jobs/:id - 职位详情
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      const err: AppError = new Error('无效的职位 ID');
      err.statusCode = 400;
      throw err;
    }
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      const err: AppError = new Error('职位不存在');
      err.statusCode = 404;
      throw err;
    }
    success(res, job);
  } catch (err) {
    next(err);
  }
});

export default router;
