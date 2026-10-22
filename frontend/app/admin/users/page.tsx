'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Loader2,
  Plus,
  KeyRound,
  ShieldCheck,
  ShieldOff,
  Users,
  Lock,
} from 'lucide-react';
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUserRole,
  resetAdminUserPassword,
  setAdminUserDisabled,
  type AdminUserItem,
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/admin/Modal';

function formatTime(iso: string | null): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false });
  } catch {
    return iso;
  }
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [items, setItems] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ---------- 新建 ---------- */
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<{ username: string; password: string; role: 'admin' | 'editor' }>({
    username: '',
    password: '',
    role: 'editor',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  /* ---------- 重置密码 ---------- */
  const [pwTarget, setPwTarget] = useState<AdminUserItem | null>(null);
  const [pwValue, setPwValue] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  const [actingId, setActingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await getAdminUsers());
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setCreateForm({ username: '', password: '', role: 'editor' });
    setCreateError('');
    setCreateOpen(true);
  };

  const doCreate = async () => {
    const username = createForm.username.trim();
    if (!/^[a-zA-Z0-9_-]{3,32}$/.test(username)) {
      setCreateError('用户名需为 3-32 位字母、数字、下划线或连字符');
      return;
    }
    if (!createForm.password) {
      setCreateError('密码不能为空');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      await createAdminUser({ username, password: createForm.password, role: createForm.role });
      setCreateOpen(false);
      await load();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const openResetPw = (item: AdminUserItem) => {
    setPwTarget(item);
    setPwValue('');
    setPwError('');
  };

  const doResetPw = async () => {
    if (!pwTarget) return;
    if (!pwValue) {
      setPwError('新密码不能为空');
      return;
    }
    setPwSaving(true);
    setPwError('');
    try {
      await resetAdminUserPassword(pwTarget.id, pwValue);
      setPwTarget(null);
      await load();
    } catch (e) {
      setPwError(e instanceof Error ? e.message : '重置失败');
    } finally {
      setPwSaving(false);
    }
  };

  const doToggleRole = async (item: AdminUserItem) => {
    const nextRole = item.role === 'admin' ? 'editor' : 'admin';
    if (
      !window.confirm(
        `确定将「${item.username}」的角色从 ${item.role === 'admin' ? '管理员' : '编辑'} 变更为 ${nextRole === 'admin' ? '管理员' : '编辑'} 吗？`,
      )
    )
      return;
    setActingId(item.id);
    setError('');
    try {
      await updateAdminUserRole(item.id, nextRole);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '角色变更失败');
    } finally {
      setActingId(null);
    }
  };

  const doToggleDisabled = async (item: AdminUserItem) => {
    const next = !item.disabled;
    if (
      !window.confirm(
        next
          ? `确定禁用「${item.username}」吗？禁用后该账号将无法登录。`
          : `确定启用「${item.username}」吗？`,
      )
    )
      return;
    setActingId(item.id);
    setError('');
    try {
      await setAdminUserDisabled(item.id, next);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '状态切换失败');
    } finally {
      setActingId(null);
    }
  };

  const isSelf = (item: AdminUserItem) => currentUser?.id === item.id;

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">用户管理</h1>
          <p className="mt-1 text-sm text-ink-400">
            管理后台账号：新建账号、重置密码、角色变更、禁用/启用（仅管理员可见）
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          新建账号
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {/* 列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-ink-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          加载中...
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 py-16 text-ink-400">
          <Users className="mb-3 h-10 w-10 text-ink-200" />
          <p className="text-sm">暂无账号</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-xs text-ink-400">
                <th className="px-5 py-3 font-medium">用户名</th>
                <th className="w-24 px-5 py-3 font-medium">角色</th>
                <th className="w-28 px-5 py-3 font-medium">状态</th>
                <th className="w-20 px-5 py-3 font-medium">2FA</th>
                <th className="px-5 py-3 font-medium">最近登录</th>
                <th className="w-56 px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const locked = item.lockedUntil && new Date(item.lockedUntil).getTime() > Date.now();
                return (
                  <tr key={item.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">{item.username}</span>
                        {isSelf(item) ? (
                          <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                            当前账号
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-0.5 text-xs text-ink-400">
                        创建于 {formatTime(item.createdAt)}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          item.role === 'admin'
                            ? 'bg-purple-50 text-purple-600'
                            : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        {item.role === 'admin' ? '管理员' : '编辑'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {item.disabled ? (
                        <span className="inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
                          已禁用
                        </span>
                      ) : locked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-600">
                          <Lock className="h-3 w-3" />
                          锁定中
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                          正常
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-ink-500">
                      {item.twoFactorEnabled ? '已开启' : '未开启'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-xs text-ink-600">{formatTime(item.lastLoginAt)}</div>
                      {item.lastLoginIp ? (
                        <div className="mt-0.5 text-xs text-ink-400">{item.lastLoginIp}</div>
                      ) : null}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {actingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-ink-400" />
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => openResetPw(item)}
                              title="重置密码"
                              className="rounded-lg border border-ink-200 p-1.5 text-ink-500 transition-colors hover:border-brand-300 hover:text-brand"
                            >
                              <KeyRound className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => doToggleRole(item)}
                              disabled={isSelf(item)}
                              title={
                                isSelf(item)
                                  ? '不能变更自己的角色'
                                  : item.role === 'admin'
                                    ? '降级为编辑'
                                    : '升级为管理员'
                              }
                              className="rounded-lg border border-ink-200 p-1.5 text-ink-500 transition-colors hover:border-brand-300 hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => doToggleDisabled(item)}
                              disabled={isSelf(item)}
                              title={isSelf(item) ? '不能禁用自己的账号' : item.disabled ? '启用账号' : '禁用账号'}
                              className={`rounded-lg border p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                                item.disabled
                                  ? 'border-emerald-200 text-emerald-500 hover:border-emerald-300'
                                  : 'border-red-200 text-red-500 hover:border-red-300'
                              }`}
                            >
                              <ShieldOff className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 新建账号弹窗 */}
      <Modal
        open={createOpen}
        title="新建账号"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={doCreate}
              disabled={creating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              创建
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-600">用户名</label>
            <input
              type="text"
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
              placeholder="3-32 位字母、数字、下划线或连字符"
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-600">初始密码</label>
            <input
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              placeholder="至少 8 位，含大小写字母、数字、特殊符号"
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-600">角色</label>
            <select
              value={createForm.role}
              onChange={(e) =>
                setCreateForm({ ...createForm, role: e.target.value as 'admin' | 'editor' })
              }
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
            >
              <option value="editor">编辑（可管理内容，不可管理用户/系统）</option>
              <option value="admin">管理员（全部权限）</option>
            </select>
          </div>
          {createError ? <p className="text-xs text-red-500">{createError}</p> : null}
        </div>
      </Modal>

      {/* 重置密码弹窗 */}
      <Modal
        open={pwTarget !== null}
        title={`重置密码 - ${pwTarget?.username ?? ''}`}
        onClose={() => setPwTarget(null)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setPwTarget(null)}
              className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={doResetPw}
              disabled={pwSaving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {pwSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              确认重置
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-500">
            为该账号设置新密码。重置后将同时解除登录锁定与失败计数。
          </p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-600">新密码</label>
            <input
              type="password"
              value={pwValue}
              onChange={(e) => setPwValue(e.target.value)}
              placeholder="至少 8 位，含大小写字母、数字、特殊符号"
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          {pwError ? <p className="text-xs text-red-500">{pwError}</p> : null}
        </div>
      </Modal>
    </div>
  );
}
