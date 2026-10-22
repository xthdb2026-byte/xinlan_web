/**
 * 防暴力破解：登录失败计数 + 账户锁定
 *  - 默认策略：15 分钟内连续 3 次失败 → 锁定 15 分钟
 *  - 策略由 process.env 可覆盖：
 *      LOGIN_MAX_ATTEMPTS      默认 3
 *      LOGIN_LOCK_WINDOW_MS    默认 15*60*1000 (锁定窗口/失败计数窗口二合一，简化模型)
 *
 *  实现说明：
 *   - 为避免用户不存在导致的「用户名探测」计时攻击，失败计数统一以「输入用户名」为键，
 *     用户不存在时的错误提示与密码错误一致："用户名或密码错误"（不在响应层暴露区分）
 *   - 失败计数与锁定截止时间写入 User 表字段（SQLite 无需额外 Redis），生产环境可替换为 Redis
 */
import { prisma } from './prisma';

const MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS ?? 3);
const LOCK_MS = Number(process.env.LOGIN_LOCK_WINDOW_MS ?? 15 * 60 * 1000);

export interface LockCheckResult {
  locked: boolean;
  lockedUntil?: Date;
  remainingMs?: number;
  attemptsLeft: number;
}

/**
 * 登录前检查：账号是否被锁定
 *  - 锁定截止时间过期自动释放（无需单独 unlock job）
 *  - 返回剩余尝试次数（便于前端提示）
 */
export async function checkLockStatus(username: string): Promise<LockCheckResult> {
  const u = await prisma.user.findUnique({
    where: { username: username },
    select: { lockedUntil: true, failedAttempts: true },
  });
  if (!u) {
    // 用户名不存在也按"未锁定，只剩0次已用"返回 — 但对外不暴露用户存在性
    return { locked: false, attemptsLeft: MAX_ATTEMPTS };
  }
  const now = new Date();
  const expired = u.lockedUntil && u.lockedUntil.getTime() <= now.getTime();
  if (expired) {
    // 锁定已过期，重置
    await prisma.user.updateMany({
      where: { username },
      data: { failedAttempts: 0, lockedUntil: null },
    });
    return { locked: false, attemptsLeft: MAX_ATTEMPTS };
  }
  if (u.lockedUntil && !expired) {
    return {
      locked: true,
      lockedUntil: u.lockedUntil,
      remainingMs: u.lockedUntil.getTime() - now.getTime(),
      attemptsLeft: 0,
    };
  }
  return {
    locked: false,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - (u.failedAttempts ?? 0)),
  };
}

/**
 * 记录一次失败：失败次数 +1；达到阈值 → 写入 lockedUntil 至当前时间 + LOCK_MS
 */
export async function recordFailedAttempt(username: string): Promise<LockCheckResult> {
  const u = await prisma.user.findUnique({ where: { username } });
  if (!u) {
    return { locked: false, attemptsLeft: MAX_ATTEMPTS };
  }
  const now = Date.now();
  // 清零已过期的历史：仅当 lockedUntil 过期时重置失败计数
  const baseAttempts = u.lockedUntil && u.lockedUntil.getTime() <= now
    ? 0
    : (u.failedAttempts ?? 0);
  const nextAttempts = baseAttempts + 1;
  const hitThreshold = nextAttempts >= MAX_ATTEMPTS;
  const lockedUntil = hitThreshold ? new Date(now + LOCK_MS) : null;
  await prisma.user.update({
    where: { username },
    data: {
      failedAttempts: nextAttempts,
      lockedUntil,
    },
  });
  return {
    locked: !!lockedUntil,
    lockedUntil: lockedUntil ?? undefined,
    remainingMs: lockedUntil ? LOCK_MS : undefined,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - nextAttempts),
  };
}

/**
 * 登录成功后：清零失败计数 + 解锁 + 记录最近登录 IP
 */
export async function recordSuccessfulLogin(username: string, ip: string) {
  await prisma.user.update({
    where: { username },
    data: {
      failedAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    },
  });
}

export const loginLockConstants = {
  MAX_ATTEMPTS,
  LOCK_MS,
};
