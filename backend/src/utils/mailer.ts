import nodemailer from 'nodemailer';
import logger from './logger';

/**
 * 邮件通知工具（P4-4）
 * 环境变量全部配置才启用：SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS
 * 可选：SMTP_FROM（缺省回退 SMTP_USER）、NOTIFY_EMAIL（管理员收件箱）、SMTP_SECURE
 * 未启用时所有发送静默跳过并返回 false，绝不抛出异常（fire-and-forget 安全）。
 */

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, NOTIFY_EMAIL, SMTP_SECURE } =
  process.env;

const enabled = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);

const transporter = enabled
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

const fromAddress = SMTP_FROM || SMTP_USER;

/** 向指定邮箱发送纯文本邮件；未启用或失败返回 false。lines 支持字符串数组或整段文本 */
export async function sendMailTo(
  to: string,
  subject: string,
  lines: string[] | string,
): Promise<boolean> {
  if (!transporter || !to) return false;
  const text = Array.isArray(lines) ? lines.join('\n') : lines;
  try {
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
    });
    logger.info(`邮件已发送: ${subject} -> ${to}`);
    return true;
  } catch (err) {
    logger.error(`邮件发送失败: ${subject} -> ${to}`, err);
    return false;
  }
}

/** 向管理员收件箱（NOTIFY_EMAIL）发送通知邮件 */
export async function sendAdminNotification(
  subject: string,
  lines: string[] | string,
): Promise<boolean> {
  if (!NOTIFY_EMAIL) return false;
  return sendMailTo(NOTIFY_EMAIL, subject, lines);
}
