import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { prisma } from '../lib/prisma';
import { success, fail } from '../utils/response';
import { signToken, authMiddleware } from '../middleware/auth';
import { loginRateLimiter, buildLoginRateLimitKey } from '../middleware/rateLimit';
import logger from '../utils/logger';
import { checkLockStatus, recordFailedAttempt, recordSuccessfulLogin } from '../lib/loginLock';
import type { LockCheckResult } from '../lib/loginLock';
import { writeLoginLog } from '../lib/loginLog';
import { validatePasswordPolicy, generateStrongPassword } from '../lib/passwordPolicy';

const router = Router();

// ==================== 防暴力：全局 rate limit（已在 app.ts 启用，此处再加登录口专属更严的计数）
// 用户级限流：5 次 / 15 分钟 / IP（独立于锁定策略，属于第二层防护）
// （实际通过 authMiddleware 外部的 express-rate-limit 做；此处内部逻辑走 checkLockStatus + 日志记录）

const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空').max(64, '用户名过长'),
  password: z.string().min(1, '密码不能为空').max(256, '密码过长'),
  // 2FA 一次性密码（可选；当用户 twoFactorEnabled=true 时必填）
  totpCode: z.string().length(6, 'TOTP 验证码必须为 6 位数字').optional(),
});

/**
 * 恒定时延抖动：用于挫败"bcrypt compare 时长 → 用户存在性探测"的时序攻击
 * 无论成功失败都至少 sleep 500±80ms
 */
async function constantTimeJitter(baseMs = 500, jitterMs = 80) {
  const jitter = Math.floor(Math.random() * jitterMs * 2) - jitterMs;
  const dur = Math.max(250, baseMs + jitter);
  return new Promise<void>((r) => setTimeout(r, dur));
}

// ==================== POST /api/auth/login 登录 ====================
router.post('/login', async (req, res, next) => {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    ?? req.ip
    ?? req.socket.remoteAddress
    ?? 'unknown';
  const userAgent = req.headers['user-agent'] ?? 'unknown';

  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const first = parseResult.error.errors[0]?.message ?? '参数校验失败';
      await writeLoginLog({
        username: (req.body?.username as string) ?? '',
        success: false,
        failureReason: 'VALIDATION_ERROR',
        ip,
        userAgent,
      });
      await constantTimeJitter();
      return fail(res, first, 422, 'VALIDATION_ERROR');
    }
    const { username, password, totpCode } = parseResult.data;

    // ① 锁定检查（提前失败也写入日志）
    const lock = await checkLockStatus(username);
    if (lock.locked) {
      await writeLoginLog({ username, success: false, failureReason: 'LOCKED', ip, userAgent });
      await constantTimeJitter();
      return fail(
        res,
        `账号已临时锁定，请 ${Math.ceil((lock.remainingMs ?? 0) / 60000)} 分钟后再试，或联系管理员解锁`,
        423,
        'ACCOUNT_LOCKED',
        {
          lockedUntil: lock.lockedUntil?.toISOString(),
          remainingMinutes: Math.ceil((lock.remainingMs ?? 0) / 60000),
        },
      );
    }

    // ② 拉取用户 + 强制 bcrypt 校验（必须用户名存在 + 密码哈希一致二者缺一不可）
    //    注意：即便用户不存在，也仍然执行一次 bcrypt.compare 抵抗时序攻击（防止通过响应时延探测用户存在性）
    const user = await prisma.user.findUnique({ where: { username } });
    const hashToCompare = user?.password ?? '$2a$10$invalidhash00000000000000000000000000000000000000000000000';
    const passwordValid = await bcrypt.compare(password, hashToCompare);

    if (!user || !passwordValid) {
      const reason: 'NO_USER' | 'WRONG_PASSWORD' = user ? 'WRONG_PASSWORD' : 'NO_USER';
      // 仅当用户真实存在时计数锁定（避免对不存在的用户名疯狂请求 → 不过仍然记录日志）
      let lockAfter: LockCheckResult | null = null;
      if (user) {
        lockAfter = await recordFailedAttempt(username);
      }
      await writeLoginLog({
        username,
        userId: user?.id,
        success: false,
        failureReason: reason,
        ip,
        userAgent,
      });
      await constantTimeJitter();
      // 统一错误文案，避免暴露用户存在性（OWASP TOP 安全准则）
      const attemptsLeft = lockAfter ? lockAfter.attemptsLeft : undefined;
      if (lockAfter?.locked) {
        return fail(
          res,
          `连续登录失败次数过多，账号已临时锁定，请 ${Math.ceil((lockAfter.remainingMs ?? 0) / 60000)} 分钟后再试，或联系管理员解锁`,
          423,
          'ACCOUNT_LOCKED',
          {
            lockedUntil: lockAfter.lockedUntil?.toISOString(),
            remainingMinutes: Math.ceil((lockAfter.remainingMs ?? 0) / 60000),
          },
        );
      }
      return fail(res, '用户名或密码错误', 401, 'INVALID_CREDENTIALS', {
        // 仅当用户存在且尝试次数有剩余时，回传剩余尝试次数
        attemptsLeft,
      });
    }

    // ②.5 禁用账户直接拒绝（密码正确也不放行），记录日志但不暴露具体原因给前端以外的枚举探测
    if (user.disabled) {
      await writeLoginLog({
        username, userId: user.id, success: false, failureReason: 'DISABLED', ip, userAgent,
      });
      await constantTimeJitter();
      logger.warn(`[Auth] Disabled account login attempt - userId=${user.id}, username=${username}, ip=${ip}`);
      return fail(res, '账号已被禁用，请联系管理员', 403, 'ACCOUNT_DISABLED');
    }

    // ③ 2FA 双因素认证校验：启用 2FA 时要求 totpCode，且必须正确
    if (user.twoFactorEnabled) {
      if (!totpCode) {
        await writeLoginLog({
          username, userId: user.id, success: false, failureReason: '2FA_REQUIRED', ip, userAgent,
        });
        await constantTimeJitter();
        return fail(res, '该账户已开启双因素认证，请输入 6 位 TOTP 验证码', 428, 'TWO_FA_REQUIRED');
      }
      if (!user.twoFactorSecret) {
        // 数据异常：启用 2FA 但无 secret — 不允许通过，提示管理员重置
        logger.error(`[Auth] 2FA enabled but secret missing for userId=${user.id}`);
        return fail(res, '2FA 配置异常，请联系管理员重置双因素认证', 428, 'TWO_FA_MISCONFIGURED');
      }
      const totpOk = authenticator.check(totpCode, user.twoFactorSecret);
      if (!totpOk) {
        // 2FA 错误也要计入失败次数（攻击面：窃取密码后无 TOTP 无限试）
        await recordFailedAttempt(username);
        await writeLoginLog({
          username, userId: user.id, success: false, failureReason: '2FA_FAILED', ip, userAgent,
        });
        await constantTimeJitter();
        return fail(res, '2FA 验证码错误', 401, 'INVALID_CREDENTIALS');
      }
    }

    // ④ 全部通过：签发 JWT + 记录成功 + 解锁清零 + 写登录日志
    await recordSuccessfulLogin(username, ip);
    await writeLoginLog({ username, userId: user.id, success: true, ip, userAgent });

    // ⑤ 登录成功后，**清零当前 IP+用户名 的登录专属限流计数**，避免用户密码输错几次后，
    //    即便登录成功也会因为累积的 used 计数很快逼近 120 次阈值被 LOGIN_RATE_LIMIT_EXCEEDED 误伤。
    //    store.resetKey 失败时静默（不影响登录响应，毕竟只属于体验优化）
    try {
      const key = buildLoginRateLimitKey(ip, username);
      const store = (loginRateLimiter as any).store;
      if (store && typeof store.resetKey === 'function') {
        await store.resetKey(key);
      }
    } catch (e) {
      logger.debug(
        `[Auth] loginRateLimiter resetKey failed for user=${username} ip=${ip}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    const token = signToken({ id: user.id, username: user.username, role: user.role });

    // httpOnly cookie：防御 XSS 窃取 token
    const isSecure = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: isSecure ? 'strict' : 'lax',
      secure: isSecure,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天
      path: '/',
    });

    await constantTimeJitter();
    success(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (err) {
    logger.error(`[Auth] Login error - ${err instanceof Error ? err.message : String(err)}, ip=${ip}`);
    next(err);
  }
});

// ==================== POST /api/auth/logout 登出 ====================
router.post('/logout', (req, res) => {
  const user = req.user;
  logger.info(`[Auth] Logout - userId: ${user?.id ?? '-'}, username: ${user?.username ?? '-'}`);
  res.clearCookie('token', { path: '/' });
  success(res, { ok: true });
});

// ==================== GET /api/auth/me 当前用户 ====================
router.get('/me', authMiddleware, (req, res) => {
  logger.debug(`[Auth] Get current user - userId=${req.user?.id ?? '-'}, username=${req.user?.username ?? '-'}`);
  success(res, { user: req.user });
});

// ============ 2FA 双因素认证（可选增强）============
//  流程：
//   ① GET  /api/auth/2fa/setup    已登录：生成 secret + QR 码
//   ② POST /api/auth/2fa/verify   已登录：验证首次 TOTP 成功后启用 2FA
//   ③ POST /api/auth/2fa/disable  已登录：需再次验证当前密码 + TOTP 才能关闭

function requireLogin2faBody() {
  return z.object({
    password: z.string().min(1).max(256),     // 再次确认当前密码，防止会话被借用启用/关闭 2FA
    totpCode: z.string().length(6).optional(),
  });
}

// ① 生成 2FA 密钥和扫码图
router.get('/2fa/setup', authMiddleware, async (req, res) => {
  if (!req.user) return fail(res, '未登录', 401, 'UNAUTHORIZED');
  if (req.user.role !== 'admin') {
    return fail(res, '仅管理员可管理双因素认证', 403, 'FORBIDDEN');
  }
  try {
    const secret = authenticator.generateSecret();
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return fail(res, '用户不存在', 404, 'NOT_FOUND');
    // 暂存到 session（这里简单：未启用阶段先写入 twoFactorSecret + enabled=false，等 verify 再打标）
    const appLabel = '新蓝恒成管理后台';
    const otpauth = authenticator.keyuri(user.username, appLabel, secret);
    const qrDataUrl = await QRCode.toDataURL(otpauth);
    await prisma.user.update({ where: { id: req.user.id }, data: { twoFactorSecret: secret, twoFactorEnabled: false } });
    success(res, {
      secret,
      qrDataUrl,
      otpauth,
      note: '请使用 Google Authenticator、1Password、Authy 等 App 扫描二维码；然后调用 /2fa/verify 输入 6 位验证码完成启用。',
    });
  } catch (err) {
    logger.error(`[2FA] setup failed: ${err instanceof Error ? err.message : String(err)}`);
    fail(res, '2FA 初始化失败', 500, 'SERVER_ERROR');
  }
});

// ② 验证并启用 2FA
router.post('/2fa/verify', authMiddleware, async (req, res) => {
  if (!req.user) return fail(res, '未登录', 401, 'UNAUTHORIZED');
  try {
    const body = requireLogin2faBody().extend({ totpCode: z.string().length(6) }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return fail(res, '用户不存在', 404, 'NOT_FOUND');
    const pwOk = await bcrypt.compare(body.password, user.password);
    if (!pwOk) return fail(res, '当前密码错误', 401, 'INVALID_CREDENTIALS');
    if (!user.twoFactorSecret) return fail(res, '请先调用 GET /2fa/setup 获取 QR 码', 412, 'PRECONDITION_REQUIRED');
    const ok = authenticator.check(body.totpCode, user.twoFactorSecret);
    if (!ok) return fail(res, 'TOTP 验证码错误', 401, 'INVALID_CREDENTIALS');
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });
    success(res, { ok: true, twoFactorEnabled: true });
  } catch (err) {
    if (err instanceof z.ZodError) return fail(res, err.errors[0]?.message ?? '参数错误', 422, 'VALIDATION_ERROR');
    logger.error(`[2FA] verify failed: ${err instanceof Error ? err.message : String(err)}`);
    fail(res, '2FA 验证失败', 500, 'SERVER_ERROR');
  }
});

// ③ 关闭 2FA
router.post('/2fa/disable', authMiddleware, async (req, res) => {
  if (!req.user) return fail(res, '未登录', 401, 'UNAUTHORIZED');
  if (req.user.role !== 'admin') return fail(res, '仅管理员可管理 2FA', 403, 'FORBIDDEN');
  try {
    const body = requireLogin2faBody().parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return fail(res, '用户不存在', 404, 'NOT_FOUND');
    const pwOk = await bcrypt.compare(body.password, user.password);
    if (!pwOk) return fail(res, '当前密码错误', 401, 'INVALID_CREDENTIALS');
    // 若之前已启用 2FA，则关闭必须再次验证 TOTP；从未启用可直接无 totpCode 视为关闭（no-op）
    if (user.twoFactorEnabled) {
      if (!body.totpCode || !user.twoFactorSecret) return fail(res, '已启用 2FA，必须提供 TOTP 验证码关闭', 422, 'VALIDATION_ERROR');
      const ok = authenticator.check(body.totpCode, user.twoFactorSecret);
      if (!ok) return fail(res, 'TOTP 验证码错误', 401, 'INVALID_CREDENTIALS');
    }
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } });
    success(res, { ok: true, twoFactorEnabled: false });
  } catch (err) {
    if (err instanceof z.ZodError) return fail(res, err.errors[0]?.message ?? '参数错误', 422, 'VALIDATION_ERROR');
    logger.error(`[2FA] disable failed: ${err instanceof Error ? err.message : String(err)}`);
    fail(res, '2FA 关闭失败', 500, 'SERVER_ERROR');
  }
});

// ============ 管理：重置/修改密码（管理员操作，强制强密码策略）============
router.patch('/user/password', authMiddleware, async (req, res) => {
  if (!req.user) return fail(res, '未登录', 401, 'UNAUTHORIZED');
  const ChangeSchema = z.object({
    oldPassword: z.string().min(1).max(256),
    newPassword: z.string().min(1).max(256),
  });
  try {
    const body = ChangeSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return fail(res, '用户不存在', 404, 'NOT_FOUND');
    const pwOk = await bcrypt.compare(body.oldPassword, user.password);
    if (!pwOk) return fail(res, '当前密码错误', 401, 'INVALID_CREDENTIALS');
    // 不得与旧密码相同
    if (body.oldPassword === body.newPassword) {
      return fail(res, '新密码不能与旧密码相同', 422, 'WEAK_PASSWORD', { errors: ['新密码不能与旧密码相同'] });
    }
    // 强密码策略
    const policy = validatePasswordPolicy(body.newPassword, user.username);
    if (!policy.ok) return fail(res, `新密码不符合复杂度要求：${policy.errors.join('；')}`, 422, 'WEAK_PASSWORD', { errors: policy.errors, score: policy.score, warnings: policy.warnings });
    const hashed = await bcrypt.hash(body.newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    success(res, { ok: true, score: policy.score, warnings: policy.warnings });
  } catch (err) {
    if (err instanceof z.ZodError) return fail(res, err.errors[0]?.message ?? '参数错误', 422, 'VALIDATION_ERROR');
    logger.error(`[Auth] Change own password error: ${err instanceof Error ? err.message : String(err)}`);
    fail(res, '修改密码失败', 500, 'SERVER_ERROR');
  }
});
router.post('/password/change', authMiddleware, async (req, res) => {
  if (!req.user) return fail(res, '未登录', 401, 'UNAUTHORIZED');
  const ChangeSchema = z.object({
    currentPassword: z.string().min(1).max(256),
    newPassword: z.string().min(1).max(256),
  });
  try {
    const body = ChangeSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return fail(res, '用户不存在', 404, 'NOT_FOUND');
    const pwOk = await bcrypt.compare(body.currentPassword, user.password);
    if (!pwOk) return fail(res, '当前密码错误', 401, 'INVALID_CREDENTIALS');
    if (body.currentPassword === body.newPassword) {
      return fail(res, '新密码不能与旧密码相同', 422, 'WEAK_PASSWORD', { errors: ['新密码不能与旧密码相同'] });
    }
    // 强密码策略
    const policy = validatePasswordPolicy(body.newPassword, user.username);
    if (!policy.ok) return fail(res, `新密码不符合复杂度要求：${policy.errors.join('；')}`, 422, 'WEAK_PASSWORD', { errors: policy.errors, score: policy.score, warnings: policy.warnings });
    const hashed = await bcrypt.hash(body.newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    success(res, { ok: true, score: policy.score, warnings: policy.warnings });
  } catch (err) {
    if (err instanceof z.ZodError) return fail(res, err.errors[0]?.message ?? '参数错误', 422, 'VALIDATION_ERROR');
    logger.error(`[Auth] password/change failed: ${err instanceof Error ? err.message : String(err)}`);
    fail(res, '修改密码失败', 500, 'SERVER_ERROR');
  }
});

// ============ 管理员：生成合规随机强密码（一键生成）============
router.get('/password/generate', authMiddleware, async (req, res) => {
  if (!req.user) return fail(res, '未登录', 401, 'UNAUTHORIZED');
  if (req.user.role !== 'admin') return fail(res, '仅管理员可调用密码生成器', 403, 'FORBIDDEN');
  const length = Number((req.query.len as string) ?? 16);
  const pw = generateStrongPassword(Number.isFinite(length) ? length : 16);
  const policy = validatePasswordPolicy(pw, undefined);
  success(res, { password: pw, ok: policy.ok, score: policy.score, warnings: policy.warnings });
});

export default router;
