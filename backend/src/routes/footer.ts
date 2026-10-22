import { Router, Request } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { success, fail } from '../utils/response';
import { authMiddleware, adminOnly } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();
const adminRouter = Router();
adminRouter.use(authMiddleware);

function getOperator(req: Request): string {
  const u = req.user;
  if (!u) return 'anonymous';
  return `userId=${u.id}, username=${u.username}, role=${u.role}`;
}

async function writeAuditLog(
  action: string,
  targetType: string,
  targetId: number,
  detail: string | null,
  operator: string,
) {
  try {
    await prisma.auditLog.create({
      data: { action, targetType, targetId, detail, operator },
    });
  } catch (err) {
    logger.error(`[Audit] footer log failed - ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ==================== 公开接口：GET /api/footer ====================
router.get('/', async (_req, res, next) => {
  try {
    const [contact, links] = await Promise.all([
      prisma.footerContact.findFirst({ where: { version: 1 } }),
      prisma.footerLink.findMany({
        where: { active: true },
        orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
      }),
    ]);
    success(res, {
      contact: contact ?? {
        companyName: '湖南新蓝恒成信息技术有限公司',
        address: '湖南省长沙市岳麓区',
        phone: '0731-XXXX-XXXX',
        email: 'contact@xinlanhengcheng.com',
        copyrightText: '湖南新蓝恒成信息技术有限公司 版权所有',
      },
      links: links.map((l) => ({
        id: l.id,
        group: l.group,
        label: l.label,
        href: l.href,
        iconName: l.iconName,
        openInNew: l.openInNew,
        sortOrder: l.sortOrder,
      })),
    });
  } catch (err) {
    logger.error(`[Footer] GET error - ${err instanceof Error ? err.message : String(err)}`);
    next(err);
  }
});

// ==================== 管理接口 ====================

const contactSchema = z.object({
  companyName: z.string().min(1).max(100),
  address: z.string().min(1).max(200),
  phone: z.string().min(1).max(50),
  email: z.string().email().max(100),
  copyrightText: z.string().min(1).max(200),
  extras: z.record(z.unknown()).optional().nullable(),
});

// PUT /api/admin/footer/contact — 更新（单例 upsert）
adminRouter.put('/contact', adminOnly, async (req, res, next) => {
  const operator = getOperator(req);
  try {
    const parsed = contactSchema.parse(req.body);
    const contact = await prisma.footerContact.upsert({
      where: { version: 1 },
      create: { version: 1, ...parsed, extras: parsed.extras ? JSON.stringify(parsed.extras) : null },
      update: { ...parsed, extras: parsed.extras ? JSON.stringify(parsed.extras) : null },
    });
    await writeAuditLog('update', 'footer_contact', 1, JSON.stringify(parsed), operator);
    logger.info(`[Admin][Footer] contact updated, by ${operator}`);
    success(res, contact, 200);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(res, '参数错误：' + err.issues.map((i) => i.message).join('；'), 400);
    }
    logger.error(`[Admin][Footer] update contact - ${err instanceof Error ? err.message : String(err)}`);
    next(err);
  }
});

// GET /api/admin/footer/links — 管理端列表（含未启用项）
adminRouter.get('/links', adminOnly, async (_req, res, next) => {
  try {
    const rows = await prisma.footerLink.findMany({
      orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    });
    success(res, rows);
  } catch (err) {
    next(err);
  }
});

const linkSchema = z.object({
  group: z.string().max(32).default('info'),
  label: z.string().min(1).max(50),
  href: z.string().min(1).max(500),
  iconName: z.string().max(50).optional().nullable(),
  openInNew: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

// POST /api/admin/footer/links — 新增
adminRouter.post('/links', adminOnly, async (req, res, next) => {
  const operator = getOperator(req);
  try {
    const data = linkSchema.parse(req.body);
    const row = await prisma.footerLink.create({ data });
    await writeAuditLog('create', 'footer_link', row.id, JSON.stringify(data), operator);
    logger.info(`[Admin][Footer] link #${row.id} created (${data.label}), by ${operator}`);
    success(res, row, 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(res, '参数错误：' + err.issues.map((i) => i.message).join('；'), 400);
    }
    next(err);
  }
});

// PUT /api/admin/footer/links/:id — 修改
adminRouter.put('/links/:id', adminOnly, async (req, res, next) => {
  const operator = getOperator(req);
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return fail(res, '无效ID', 400);
    const data = linkSchema.partial().parse(req.body);
    const exists = await prisma.footerLink.findUnique({ where: { id } });
    if (!exists) return fail(res, '链接不存在', 404);
    const row = await prisma.footerLink.update({ where: { id }, data });
    await writeAuditLog('update', 'footer_link', id, JSON.stringify(data), operator);
    logger.info(`[Admin][Footer] link #${id} updated, by ${operator}`);
    success(res, row);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(res, '参数错误：' + err.issues.map((i) => i.message).join('；'), 400);
    }
    next(err);
  }
});

// PATCH /api/admin/footer/links/:id/sort — 仅更新排序
adminRouter.patch('/links/:id/sort', adminOnly, async (req, res, next) => {
  const operator = getOperator(req);
  try {
    const id = Number(req.params.id);
    const { sortOrder } = z.object({ sortOrder: z.number().int() }).parse(req.body);
    const row = await prisma.footerLink.update({ where: { id }, data: { sortOrder } });
    await writeAuditLog('update_sort', 'footer_link', id, JSON.stringify({ sortOrder }), operator);
    success(res, row);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/footer/links/:id
adminRouter.delete('/links/:id', adminOnly, async (req, res, next) => {
  const operator = getOperator(req);
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return fail(res, '无效ID', 400);
    const exists = await prisma.footerLink.findUnique({ where: { id } });
    if (!exists) return fail(res, '链接不存在', 404);
    await prisma.footerLink.delete({ where: { id } });
    await writeAuditLog('delete', 'footer_link', id, JSON.stringify({ label: exists.label }), operator);
    logger.info(`[Admin][Footer] link #${id} (${exists.label}) deleted, by ${operator}`);
    success(res, { ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
export { adminRouter as adminFooterRouter };
