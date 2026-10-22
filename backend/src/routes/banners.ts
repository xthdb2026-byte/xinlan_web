import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { success } from '../utils/response';
import logger from '../utils/logger';

const router = Router();

/**
 * 公开 GET /api/banners
 * — 返回启用中的首页轮播 Banner（按 sortOrder 升序），无需鉴权。
 * — 无数据时返回空数组，前台保持默认单图 Hero 模式。
 */
router.get('/', async (_req, res) => {
  try {
    const items = await prisma.banner.findMany({
      where: { enabled: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        title: true,
        subtitle: true,
        image: true,
        link: true,
        sortOrder: true,
      },
    });
    return success(res, { items });
  } catch (err) {
    logger.error('[banners] 查询异常：', err);
    // 公开接口降级为空数组，避免影响首页渲染
    return success(res, { items: [] });
  }
});

export default router;
