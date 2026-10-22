import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { success, fail } from '../utils/response';

const router = Router();

// GET /api/page-configs/:page/:section
// 公共只读接口：返回指定页面分区配置，content 已解析为 JSON 对象。
// 配置不存在返回 404，前端以代码内默认值为兜底。
router.get('/:page/:section', async (req, res, next) => {
  try {
    const { page, section } = req.params;
    const cfg = await prisma.pageConfig.findUnique({
      where: { page_section: { page, section } },
    });
    if (!cfg) {
      return fail(res, '页面配置不存在', 404, 'PAGE_CONFIG_NOT_FOUND');
    }
    let content: unknown = cfg.content;
    try {
      content = JSON.parse(cfg.content);
    } catch {
      // content 非合法 JSON 时原样返回字符串，由前端兜底
    }
    success(res, {
      page: cfg.page,
      section: cfg.section,
      updatedAt: cfg.updatedAt,
      content,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
