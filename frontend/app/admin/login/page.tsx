'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getCurrentUser } from '@/lib/api';
import type { AdminUser } from '@/lib/types';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingUser, setExistingUser] = useState<AdminUser | null>(null);
  // 限流倒计时（秒）：命中 429 RL_EXCEEDED 时启动，0 时按钮恢复可点击
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const { login } = useAuth();

  // 倒计时 tick：单独 interval 实现，避免组件重渲染不停生成新 timer
  useEffect(() => {
    if (rateLimitCountdown <= 0) return;
    const id = window.setInterval(() => {
      setRateLimitCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [rateLimitCountdown]);

  // 预拉取：若已有有效token则直接放行到后台（避免已登录用户重复登录）
  useEffect(() => {
    const t = localStorage.getItem('admin_token');
    if (!t) return;
    let cancelled = false;
    getCurrentUser()
      .then((r) => {
        const user = r.user;
        if (cancelled) return;
        if (user && (user.role === 'admin' || user.role === 'editor')) {
          // 已登录态下用 assign 做硬跳转，避免 client-side 导航 cancel 出 ERR_ABORTED 噪声
          window.location.assign('/admin');
        } else {
          setExistingUser(null);
          localStorage.removeItem('admin_token');
        }
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem('admin_token');
        setExistingUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const formatCountdown = (seconds: number): string => {
    if (seconds <= 0) return '';
    if (seconds < 60) return `${seconds} 秒`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s === 0 ? `${m} 分钟` : `${m} 分 ${s} 秒`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rateLimitCountdown > 0) {
      setError(`请等待 ${formatCountdown(rateLimitCountdown)} 后再尝试登录，避免持续请求被继续限制。`);
      return;
    }
    setError('');
    setLoading(true);

    try {
      await login(username.trim(), password);
      // 改为 window.location.assign 硬跳转：
      //  ① 避免 Next.js App Router client-side 替换时 Document 层的 RSC prefetch 被 cancel 产生 ERR_ABORTED 噪声
      //  ② 强制重新拉取 /admin 的 RSC payload，确保已登录状态下 AuthProvider 不会因 render 竞争而继续渲染 null
      window.location.assign('/admin');
    } catch (err: unknown) {
      const e = err as Error & {
        code?: string;
        status?: number;
        details?: {
          attemptsLeft?: number;
          remainingMinutes?: number;
          lockedUntil?: string;
          errors?: string[];
          retryAfterSeconds?: number;
          windowMinutes?: number;
          limitType?: 'global_api' | 'login';
          maxPerWindow?: number;
          hint?: string;
        };
      };
      if (e.code === 'ACCOUNT_LOCKED' || e.status === 423) {
        const mins = e.details?.remainingMinutes ?? 15;
        setError(`账号已临时锁定：连续登录失败次数过多。请 ${mins} 分钟后再试，或联系管理员解锁。`);
      } else if (e.code === 'TWO_FA_REQUIRED') {
        setError('该账户已开启双因素认证（2FA），请输入 TOTP 动态验证码。若需临时关闭，请联系管理员。');
      } else if (e.code === 'INVALID_CREDENTIALS') {
        const left = e.details?.attemptsLeft;
        const suffix = typeof left === 'number' ? `（剩余尝试次数：${left}，连续 3 次失败将临时锁定 15 分钟）` : '';
        setError(`${e.message ?? '用户名或密码错误'}${suffix}`);
      } else if (e.code === 'WEAK_PASSWORD') {
        const list = e.details?.errors?.join('；') ?? '请按提示修改密码';
        setError(`新密码不符合复杂度要求：${list}`);
      } else if (e.code === 'RATE_LIMIT_EXCEEDED' || e.code === 'LOGIN_RATE_LIMIT_EXCEEDED') {
        // ---------- 命中限流：结构化倒计时 + 场景说明 ----------
        const retry = typeof e.details?.retryAfterSeconds === 'number' ? e.details.retryAfterSeconds : 60;
        const win = e.details?.windowMinutes ?? 15;
        const isLoginScope = e.code === 'LOGIN_RATE_LIMIT_EXCEEDED';
        const countdownText = formatCountdown(retry);
        const scopeText = isLoginScope
          ? `登录请求在最近 ${win} 分钟内过于密集（超过 ${e.details?.maxPerWindow ?? 120} 次）`
          : `本时间段内所有接口请求过于密集（${win} 分钟窗口）`;
        const sharedIpHint = e.details?.hint ?? '';
        setError(
          `请求被限制：${scopeText}。请 ${countdownText}后再试。${sharedIpHint ? ` ${sharedIpHint}` : ''}`,
        );
        // 启动倒计时：按钮禁用直到归零，避免用户狂点继续撞限流墙
        setRateLimitCountdown(Math.max(1, Math.min(retry, 60 * 60 * 12 /* 最多 12h */)));
      } else if (e.status === 429) {
        // 兜底：未知结构的 429
        setError('请求过于频繁，已被临时限制。请 1-2 分钟后再试，或切换网络重试。');
        setRateLimitCountdown(90);
      } else {
        setError(e.message || '登录失败，请检查用户名和密码');
      }
    } finally {
      setLoading(false);
    }
  };

  // Logo 点击：若已具备后台访问权限 → 直接进入后台（硬跳转避免 abort）
  const handleLogoClick = async () => {
    if (loading) return;
    try {
      const tok = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
      if (!tok && !existingUser) return;
      let user = existingUser;
      if (!user && tok) {
        const r = await getCurrentUser();
        user = r.user;
        setExistingUser(user);
      }
      if (user && (user.role === 'admin' || user.role === 'editor')) {
        window.location.assign('/admin');
      }
    } catch {
      /* ignore — token 失效直接停留在当前页即可 */
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-10 pb-20 sm:pb-24">
      {/* ====== 白色圆角登录卡片 ====== */}
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-white p-8 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] ring-1 ring-ink-100 sm:p-10">
          {/*
            ====== 企业 Logo（已精确边缘裁剪）：位于 用户输入框体区域 正上方 ======
            - 容器 + img 双层结构（参考经验 566810：背景/图分离，避免尺寸耦合裁切）
            - 高度随屏幕自适应：移动端 h-14 (56px) → 桌面 sm:h-20 (80px)
            - 与输入框体间距：mb-8 (32px)，视觉呼吸感充足
            - 宽 100% 按高等比缩放（objectFit:contain，主体不被裁切）
          */}
          <div className="mb-8 flex justify-center">
            <button
              type="button"
              onClick={handleLogoClick}
              className="group relative w-full max-w-[260px] cursor-pointer rounded-2xl p-2 transition-all hover:bg-brand-50/60 focus:outline-none focus:ring-4 focus:ring-brand-100 sm:max-w-[320px]"
              aria-label="点击进入管理后台（需已登录）"
              title="点击进入管理后台（需已登录）"
            >
              <div className="relative h-14 w-full sm:h-20">
                <Image
                  src="/images/logos/logo_horizontal.png"
                  alt="新蓝恒成 · 企业标识"
                  fill
                  priority
                  sizes="(max-width: 640px) 260px, 320px"
                  className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
            </button>
          </div>

          {/* 次级说明：配合 Logo（Logo 已含中文名称，此处不再重复） */}
          <p className="mb-6 text-center text-sm text-ink-500">
            欢迎登录管理后台
            {existingUser && (
              <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 align-middle ring-1 ring-brand-100">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                已登录：{existingUser.username}
              </span>
            )}
          </p>

          {/* ====== 用户输入框体 ====== */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 用户名 */}
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium text-ink-700">
                用户名
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="w-full rounded-xl border border-ink-200 bg-ink-50/40 px-4 py-3 text-base text-ink-800 transition-colors placeholder:text-ink-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
                disabled={loading}
                autoComplete="username"
              />
            </div>

            {/* 密码 */}
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-ink-700">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full rounded-xl border border-ink-200 bg-ink-50/40 px-4 py-3 text-base text-ink-800 transition-colors placeholder:text-ink-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {/* 登录按钮：与 Logo 蓝色主色一致（brand） + 限流倒计时禁用提示 */}
            <button
              type="submit"
              disabled={loading || rateLimitCountdown > 0}
              className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-all hover:bg-brand-600 hover:shadow-brand-500/40 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  登录中...
                </>
              ) : rateLimitCountdown > 0 ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  请 {formatCountdown(rateLimitCountdown)} 后再试
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  登录
                </>
              )}
            </button>

            {/* 默认账号提示 */}
            <p className="pt-1 text-center text-xs text-ink-400">
              默认账号：<span className="font-mono text-ink-500">admin</span>
              <span className="mx-1.5">/</span>
              <span className="font-mono text-ink-500">admin123</span>
            </p>
          </form>
        </div>
      </div>

      {/*
        ====== 固定底部版权条（蓝底白字 · 水平居中 · 不受滚动影响）======
        - fixed bottom-0 w-full → 始终贴视口底边，滚动不位移
        - 内层 flex justify-center + text-center → 水平正中间
        - brand 蓝色背景，白色文字（与截图样式完全匹配）
        - 外层容器 pb-20 / sm:pb-24 → 避免版权条遮挡登录卡片底部
      */}
      <footer
        aria-label="版权信息"
        className="fixed bottom-0 left-0 z-50 w-full border-t border-brand-400/20 bg-brand"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:py-3.5">
          <p className="text-center text-xs font-medium tracking-wide text-white/95 sm:text-sm">
            © 2026 湖南新蓝恒成信息技术有限公司 版权所有
          </p>
        </div>
      </footer>
    </div>
  );
}
