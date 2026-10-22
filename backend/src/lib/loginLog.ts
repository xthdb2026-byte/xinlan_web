/**
 * 登录日志记录（持久化）
 *  记录字段：用户名、成功/失败、失败原因、IP、设备类型、操作系统、浏览器
 *  方便安全审计 + 攻击溯源
 */
import { UAParser } from 'ua-parser-js';
import { prisma } from './prisma';

export type LoginFailureReason =
  | 'WRONG_PASSWORD'
  | 'LOCKED'
  | 'NO_USER'
  | 'VALIDATION_ERROR'
  | '2FA_REQUIRED'
  | '2FA_FAILED'
  | 'DISABLED'
  | 'POLICY_WEAK_PASSWORD';

export interface LoginLogInput {
  username: string;
  userId?: number;
  success: boolean;
  failureReason?: LoginFailureReason;
  ip: string;
  userAgent: string; // 原始 UA 字符串，此处内部解析为 device/os/browser
}

export function parseUserAgent(ua: string) {
  const parser = new UAParser(ua);
  const device = parser.getDevice();
  const os = parser.getOS();
  const browser = parser.getBrowser();
  return {
    device: device.type || 'Desktop',
    os: [os.name, os.version].filter(Boolean).join(' ') || undefined,
    browser: [browser.name, browser.version].filter(Boolean).join(' ') || undefined,
  };
}

export async function writeLoginLog(input: LoginLogInput) {
  try {
    const { device, os, browser } = parseUserAgent(input.userAgent);
    await prisma.loginAttemptLog.create({
      data: {
        username: input.username,
        userId: input.userId ?? null,
        success: input.success,
        failureReason: input.failureReason ?? null,
        ip: input.ip,
        device,
        os,
        browser,
      },
    });
  } catch (err) {
    // 日志写入失败绝对不能阻塞登录流程本身（否则 DoS 简单）
    // 此处仅将错误打印到标准错误供运维监控
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[LoginLog] write failed: ${msg}\n`);
  }
}
