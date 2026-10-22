import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { success, fail } from '../utils/response';
import { sendAdminNotification } from '../utils/mailer';

const router = Router();

// 投递申请表单校验
const applicationSchema = z.object({
  jobId: z.number().int().positive('职位 ID 无效'),
  name: z.string().min(1, '姓名不能为空').max(50),
  phone: z.string().min(1, '电话不能为空').max(20),
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
  resumeUrl: z.string().url('简历链接格式不正确').optional().or(z.literal('')),
  coverLetter: z.string().max(2000, '求职说明不能超过 2000 个字符').optional(),
});

// POST /api/applications - 提交投递申请
router.post('/', async (req, res, next) => {
  try {
    const data = applicationSchema.parse(req.body);

    // 校验职位是否存在且开放
    const job = await prisma.job.findUnique({
      where: { id: data.jobId },
    });

    if (!job) {
      return fail(res, '职位不存在', 404, 'NOT_FOUND');
    }

    if (job.status !== 'open') {
      return fail(res, '该职位已停止招聘', 400, 'JOB_CLOSED');
    }

    const application = await prisma.application.create({
      data: {
        jobId: data.jobId,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        resumeUrl: data.resumeUrl || null,
        coverLetter: data.coverLetter || null,
        status: 'pending',
      },
    });

    // 异步通知管理员（fire-and-forget，不阻塞响应）
    void sendAdminNotification(
      `新简历投递提醒 - ${data.name}（应聘：${job.title}）`,
      [
        `应聘职位：${job.title}`,
        `姓名：${data.name}`,
        `电话：${data.phone}`,
        `邮箱：${data.email || '（未填）'}`,
        `简历链接：${data.resumeUrl || '（未传）'}`,
        '',
        '求职说明：',
        data.coverLetter || '（未填）',
        '',
        '请登录后台「投递管理」查看处理。',
      ].join('\n'),
    );

    success(res, { id: application.id }, 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(res, err.errors[0]?.message ?? '参数校验失败', 422, 'VALIDATION_ERROR');
    }
    next(err);
  }
});

export default router;
