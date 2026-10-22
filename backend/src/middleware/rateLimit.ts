import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * 登录限流分层策略（与 app.ts 中解释一致，抽出单独文件以避免 app → auth → app 的循环依赖）：
 *   A) globalLimiter   — 全局 /api 限流：排除登录接口、内网 IP 跳过、阈值 15min/600
 *   B) loginRateLimiter — 登录专属限流：维度=IP+用户名、阈值 15min/120
 *
 * 两个 limiter 都 export，供：
 *   - app.ts 注册中间件
 *   - routes/auth.ts 登录成功时执行 store.resetKey(ip+user) 重置当前用户计数
 *   - routes/admin.ts 管理员接口清理/解禁限流记录
 */

export function secondsUntil(ms: number | undefined): number {
  if (!ms || !Number.isFinite(ms)) return 0;
  return Math.max(0, Math.ceil(ms / 1000));
}

export function isLoopbackIp(ip: string | undefined): boolean {
  if (!ip) return false;
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === '::ffff:127.0.0.1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.2') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.')
  );
}

export const GLOBAL_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
export const GLOBAL_MAX = Number(process.env.RATE_LIMIT_MAX ?? 600);
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_MAX = Number(process.env.LOGIN_RATE_LIMIT_MAX ?? 120);

// ---------- (A) 全局限流：对除登录接口外的所有 /api/* 生效 ----------
export const globalLimiter = rateLimit({
  windowMs: GLOBAL_WINDOW_MS,
  limit: GLOBAL_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // ① 登录接口走 authLimiter，排除全局，避免两层叠加"正常登录也被 429"
    if (req.path === '/api/auth/login' || req.url === '/api/auth/login') return true;
    // ② 本机/内网 IP：默认跳过全局（仅限登录专属才限流），避免开发/运维调试被误伤
    if (isLoopbackIp(req.ip)) return true;
    return false;
  },
  handler: (req: Request, res: Response, _next: NextFunction, optionsUsed) => {
    const rl = (req as any).rateLimit;
    const nowMs = Math.ceil((rl?.resetTime?.getTime() ?? Date.now()) - Date.now());
    logger.warn(
      `[RATE-LIMIT:GLOBAL] hit ip=${req.ip} xff=${req.headers['x-forwarded-for'] ?? '-'} ` +
      `remaining=${rl?.remaining ?? '?'} used=${rl?.used ?? '?'} ` +
      `retryAfter=${secondsUntil(nowMs)}s url=${req.originalUrl} ua=${String(req.headers['user-agent'] ?? '').slice(0, 80)}`,
    );
    const resetMs = rl?.resetTime?.getTime?.()
      ? rl.resetTime.getTime() - Date.now()
      : GLOBAL_WINDOW_MS;
    const payload = {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求过于频繁，请稍后再试',
      details: {
        limitType: 'global_api' as const,
        windowMinutes: Math.round(GLOBAL_WINDOW_MS / 60000),
        retryAfterSeconds: secondsUntil(resetMs),
        hint: '若您在公司/校园/家庭共享网络下，可能是多人共用同一公网IP触发；请稍后重试或联系管理员临时解禁。',
      },
    };
    res.status(optionsUsed.statusCode).json(payload);
  },
});

// ---------- (B) 登录接口专属限流：仅对 POST /api/auth/login 生效 ----------
export const loginRateLimiter = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  limit: LOGIN_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // 成功登录也计一次，防止"成功后用脚本重登录"
  keyGenerator: (req: Request) => {
    // 维度：客户端真实 IP（trust proxy 解析 XFF 后的结果）
    // 同时拼接用户名字段"影子"：避免同一公司出口下所有员工共用 IP、
    // 某一个人被锁导致其他人也被限流（代价是暴力破解方也会按 username 分散计数，
    // 但后面的账户锁定是 per-user 的，能补足这一点）
    const bodyUser =
      req.body && typeof req.body === 'object' && typeof (req.body as any).username === 'string'
        ? `|${(req.body as any).username.trim().toLowerCase()}`
        : '';
    return `${req.ip}${bodyUser}`;
  },
  handler: (req: Request, res: Response, _next: NextFunction, optionsUsed) => {
    const rl = (req as any).rateLimit;
    const resetMs = rl?.resetTime?.getTime?.()
      ? rl.resetTime.getTime() - Date.now()
      : LOGIN_WINDOW_MS;
    logger.warn(
      `[RATE-LIMIT:LOGIN] hit ip=${req.ip} xff=${req.headers['x-forwarded-for'] ?? '-'} ` +
      `remaining=${rl?.remaining ?? '?'} retryAfter=${secondsUntil(resetMs)}s ` +
      `username=${(req.body as any)?.username ?? '-'} ua=${String(req.headers['user-agent'] ?? '').slice(0, 80)}`,
    );
    const payload = {
      code: 'LOGIN_RATE_LIMIT_EXCEEDED',
      message: '登录尝试过于频繁，请 15 分钟后再试',
      details: {
        limitType: 'login' as const,
        windowMinutes: Math.round(LOGIN_WINDOW_MS / 60000),
        retryAfterSeconds: secondsUntil(resetMs),
        maxPerWindow: LOGIN_MAX,
        hint: '多人共用一个网络出口（公司WIFI/校园网）时会按"IP+用户名"合并计数；建议稍后重试，或联系管理员临时解锁限流记录。',
      },
    };
    res.status(optionsUsed.statusCode).json(payload);
  },
});

/**
 * 便捷方法：构造登录 limiter 的限流 key（与 keyGenerator 规则完全一致），
 * 用于 auth.ts 登录成功后 "清零该用户计数"，以及 admin 清理接口按 IP+user 精确清理。
 */
export function buildLoginRateLimitKey(ip: string, username?: string): string {
  const safeIp = ip || 'unknown';
  if (!username) return safeIp;
  return `${safeIp}|${username.trim().toLowerCase()}`;
}
