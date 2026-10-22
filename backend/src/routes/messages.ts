import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { success, fail } from '../utils/response';
import { sendAdminNotification } from '../utils/mailer';

const router = Router();

// 留言/咨询表单校验
const messageSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(50),
  phone: z.string().min(1, '电话不能为空').max(20),
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
  company: z.string().max(100).optional(),
  content: z.string().min(1, '留言内容不能为空').max(2000),
});

/** 留言入库后异步通知管理员（fire-and-forget，不阻塞响应） */
function notifyNewMessage(source: string, data: { name: string; phone: string; email?: string; company?: string; content: string }) {
  void sendAdminNotification(
    `新${source}提醒 - ${data.name}`,
    [
      `来源：${source}`,
      `姓名：${data.name}`,
      `电话：${data.phone}`,
      `邮箱：${data.email || '（未填）'}`,
      `公司：${data.company || '（未填）'}`,
      '',
      '内容：',
      data.content,
      '',
      '请登录后台「留言管理」查看处理。',
    ].join('\n'),
  );
}

// POST /api/messages - 提交留言
router.post('/', async (req, res, next) => {
  try {
    const data = messageSchema.parse(req.body);
    const message = await prisma.message.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        company: data.company || null,
        content: data.content,
        status: 'pending',
      },
    });
    notifyNewMessage('留言', data);
    success(res, { id: message.id }, 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(res, err.errors[0]?.message ?? '参数校验失败', 422, 'VALIDATION_ERROR');
    }
    next(err);
  }
});

// POST /api/contact - 合作咨询（复用留言表）
router.post('/contact', async (req, res, next) => {
  try {
    const data = messageSchema.parse(req.body);
    const message = await prisma.message.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        company: data.company || null,
        content: data.content,
        status: 'pending',
      },
    });
    notifyNewMessage('合作咨询', data);
    success(res, { id: message.id }, 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(res, err.errors[0]?.message ?? '参数校验失败', 422, 'VALIDATION_ERROR');
    }
    next(err);
  }
});

export default router;
