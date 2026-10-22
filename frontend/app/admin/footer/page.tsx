'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit3,
  X,
  AlertCircle,
  CheckCircle2,
  Link2,
  MapPin,
  Phone,
  Mail,
  Building2,
  ShieldCheck,
  FileText,
  Map,
  ExternalLink,
} from 'lucide-react';
import {
  getFooterData,
  updateFooterContact,
  getAdminFooterLinks,
  createFooterLink,
  updateFooterLink,
  deleteFooterLink,
  updateFooterLinkSort,
} from '@/lib/api';
import type { FooterContactData, FooterLinkData } from '@/lib/types';
import FooterPreview from '@/components/admin/FooterPreview';

const LINK_GROUPS: Array<{ value: string; label: string; hint: string }> = [
  { value: 'product',  label: '产品与服务',  hint: '链接列 1（产品/服务）' },
  { value: 'solution', label: '解决方案',    hint: '链接列 2（方案/行业）' },
  { value: 'about',    label: '关于我们',    hint: '链接列 3（公司/新闻/招聘）' },
  { value: 'info',     label: '底栏快速链接', hint: '版权行右侧的「隐私/条款/地图」等' },
  { value: 'custom',   label: '自定义列',    hint: '新增的自定义链接列' },
];

const DEFAULT_ICONS: Record<string, { label: string; icon: string }> = {
  隐私政策:  { label: '隐私政策',  icon: 'ShieldCheck' },
  服务条款:  { label: '服务条款',  icon: 'FileText' },
  网站地图:  { label: '网站地图',  icon: 'Map' },
};

type LinkForm = {
  id?: number;
  group: string;
  label: string;
  href: string;
  iconName: string;
  openInNew: boolean;
  sortOrder: number;
  active: boolean;
};

const emptyForm: LinkForm = {
  group: 'info',
  label: '',
  href: '#',
  iconName: '',
  openInNew: false,
  sortOrder: 10,
  active: true,
};

export default function AdminFooterPage() {
  // ===== Contact 表单状态 =====
  const [contact, setContact] = useState<FooterContactData & { extras?: Record<string, unknown> | null }>({
    companyName: '', address: '', phone: '', email: '', copyrightText: '',
  });
  const [contactSaving, setContactSaving] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);

  // ===== Links 列表状态 =====
  const [links, setLinks] = useState<FooterLinkData[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);

  // ===== 新增/编辑链接弹窗 =====
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<LinkForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<FooterLinkData | null>(null);

  const [globalError, setGlobalError] = useState('');

  // ============ 初始化加载 ============
  const loadAll = useCallback(async () => {
    setLinksLoading(true);
    setGlobalError('');
    try {
      const [data, allLinks] = await Promise.all([
        getFooterData(),
        getAdminFooterLinks(),
      ]);
      setContact(data.contact);
      setLinks(allLinks);
    } catch (e) {
      setGlobalError((e as { message?: string })?.message ?? '加载失败，请检查后端服务');
    } finally {
      setLinksLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // ============ 联系信息保存 ============
  const handleSaveContact = async () => {
    if (!contact.companyName || !contact.address || !contact.phone || !contact.email || !contact.copyrightText) {
      setGlobalError('所有联系方式字段均不能为空');
      return;
    }
    setContactSaving(true);
    setContactSaved(false);
    setGlobalError('');
    try {
      const saved = await updateFooterContact(contact);
      setContact(saved);
      setContactSaved(true);
      setTimeout(() => setContactSaved(false), 2200);
    } catch (e) {
      setGlobalError((e as { message?: string })?.message ?? '保存失败');
    } finally {
      setContactSaving(false);
    }
  };

  // ============ 链接增删改 ============
  const openCreate = (group = 'info') => {
    setEditingId(null);
    const existing = links.filter((l) => l.group === group);
    setForm({ ...emptyForm, group, sortOrder: existing.length + 1 });
    setShowForm(true);
  };

  const openEdit = (l: FooterLinkData) => {
    setEditingId(l.id);
    setForm({
      id: l.id,
      group: l.group,
      label: l.label,
      href: l.href,
      iconName: l.iconName ?? '',
      openInNew: !!l.openInNew,
      sortOrder: l.sortOrder,
      active: l.active !== false,
    });
    setShowForm(true);
  };

  const submitLink = async () => {
    if (!form.label.trim()) { setGlobalError('链接显示文本不能为空'); return; }
    if (!form.href.trim())  { setGlobalError('链接地址不能为空');  return; }
    setSubmitting(true);
    setGlobalError('');
    try {
      if (editingId) {
        await updateFooterLink(editingId, {
          group: form.group,
          label: form.label.trim(),
          href: form.href.trim(),
          iconName: form.iconName.trim() || null,
          openInNew: form.openInNew,
          sortOrder: form.sortOrder,
          active: form.active,
        });
      } else {
        await createFooterLink({
          group: form.group,
          label: form.label.trim(),
          href: form.href.trim(),
          iconName: form.iconName.trim() || null,
          openInNew: form.openInNew,
          sortOrder: form.sortOrder,
          active: form.active,
        });
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await loadAll();
    } catch (e) {
      setGlobalError((e as { message?: string })?.message ?? '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const doDelete = async (l: FooterLinkData) => {
    try {
      await deleteFooterLink(l.id);
      setConfirmDelete(null);
      await loadAll();
    } catch (e) {
      setGlobalError((e as { message?: string })?.message ?? '删除失败');
    }
  };

  const swapSort = async (idx: number, direction: 'up' | 'down') => {
    const list = [...links];
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === list.length - 1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const [a, b] = [list[idx], list[swapIdx]];
    // 仅同组交换，避免打乱跨组顺序
    if (a.group !== b.group) return;
    try {
      const [, upd] = await Promise.all([
        updateFooterLinkSort(a.id, b.sortOrder),
        updateFooterLinkSort(b.id, a.sortOrder),
      ]);
      void upd;
      await loadAll();
    } catch (e) {
      setGlobalError((e as { message?: string })?.message ?? '排序失败');
    }
  };

  // ============ UI 渲染 ============
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">底部内容管理</h1>
        <p className="mt-1 text-sm text-ink-500">管理网站 Footer 区域的联系信息、快速链接等内容 · 修改后前台自动同步显示</p>
      </div>

      {globalError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {globalError}
        </div>
      )}

      {/* ======= 实时预览 ======= */}
      <FooterPreview contact={contact} links={links.filter((l) => l.active !== false)} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* ======= 联系信息表单 ======= */}
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-ink-100 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
              <Building2 className="h-5 w-5 text-brand" />
              联系方式 & 版权
            </h2>
            <button
              type="button"
              onClick={handleSaveContact}
              disabled={contactSaving}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand/90 disabled:opacity-60"
            >
              {contactSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              保存
            </button>
          </div>
          {contactSaved && (
            <div className="mb-3 flex items-center gap-1.5 rounded-md bg-green-50 px-2.5 py-1.5 text-xs text-green-700 ring-1 ring-green-200">
              <CheckCircle2 className="h-3.5 w-3.5" /> 联系信息已保存，前台同步显示
            </div>
          )}
          <div className="space-y-3">
            <Field label="公司名称" icon={Building2}>
              <input
                value={contact.companyName}
                onChange={(e) => setContact({ ...contact, companyName: e.target.value })}
                placeholder="例：湖南新蓝恒成信息技术有限公司"
                className="input"
              />
            </Field>
            <Field label="公司地址" icon={MapPin}>
              <input
                value={contact.address}
                onChange={(e) => setContact({ ...contact, address: e.target.value })}
                placeholder="例：湖南省长沙市岳麓区XXX街道"
                className="input"
              />
            </Field>
            <Field label="联系电话" icon={Phone}>
              <input
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                placeholder="例：0731-8888-9999"
                className="input"
              />
            </Field>
            <Field label="联系邮箱" icon={Mail}>
              <input
                type="email"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                placeholder="例：contact@xinlanhengcheng.com"
                className="input"
              />
            </Field>
            <Field label="版权文字（前缀，自动追加年份）" icon={FileText}>
              <input
                value={contact.copyrightText}
                onChange={(e) => setContact({ ...contact, copyrightText: e.target.value })}
                placeholder="例：湖南新蓝恒成信息技术有限公司 版权所有"
                className="input"
              />
            </Field>
          </div>
          <p className="mt-4 text-xs text-ink-400">
            保存后无需部署，前台 Footer 组件动态读取即自动更新。
          </p>
        </section>

        {/* ======= 链接列表 ======= */}
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-ink-100 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
              <Link2 className="h-5 w-5 text-brand" />
              链接管理
              <span className="ml-1 text-xs font-normal text-ink-400">共 {links.length} 条</span>
            </h2>
            <button
              type="button"
              onClick={() => openCreate('info')}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand/90"
            >
              <Plus className="h-4 w-4" />
              新增链接
            </button>
          </div>

          <style>{`.input{@apply w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-brand focus:ring-2 focus:ring-brand/20}`}</style>
          <style>{`.field-label{@apply mb-1 flex items-center gap-1 text-xs font-medium text-ink-600}`}</style>

          {linksLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-ink-100" />
              ))}
            </div>
          ) : links.length === 0 ? (
            <div className="rounded-lg border border-dashed border-ink-200 py-12 text-center text-sm text-ink-400">
              还没有添加链接，点击右上角「新增链接」开始。
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg ring-1 ring-ink-100">
              <table className="w-full text-sm">
                <thead className="bg-ink-50 text-left text-xs font-semibold uppercase text-ink-500">
                  <tr>
                    <th className="px-3 py-2">分组</th>
                    <th className="px-3 py-2">显示文本</th>
                    <th className="px-3 py-2">链接</th>
                    <th className="px-3 py-2 text-center">图标</th>
                    <th className="px-3 py-2 text-center">排序</th>
                    <th className="px-3 py-2 text-center">状态</th>
                    <th className="px-3 py-2 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {links.map((l, idx) => (
                    <tr key={l.id} className="hover:bg-ink-50/50">
                      <td className="px-3 py-2">
                        <span className="inline-block rounded-md bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                          {LINK_GROUPS.find((g) => g.value === l.group)?.label ?? l.group}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-medium text-ink">
                        {l.label}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1 text-ink-600">
                          <code className="rounded bg-ink-50 px-1.5 py-0.5 text-xs">{l.href}</code>
                          {l.openInNew ? <ExternalLink className="h-3.5 w-3.5 text-ink-400" /> : null}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {l.iconName ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-ink-50 px-2 py-0.5 text-xs text-ink-600">
                            {l.iconName}
                          </span>
                        ) : (
                          <span className="text-xs text-ink-300">无</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center text-ink-500">
                        <div className="inline-flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => swapSort(idx, 'up')}
                            className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-600"
                            aria-label="上移"
                            disabled={idx === 0}
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-mono">{l.sortOrder}</span>
                          <button
                            type="button"
                            onClick={() => swapSort(idx, 'down')}
                            className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-600"
                            aria-label="下移"
                            disabled={idx === links.length - 1}
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {l.active === false ? (
                          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                            停用
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
                            启用
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => window.open(
                              l.href.startsWith('http') || l.href.startsWith('/') ? l.href : `/${l.href}`,
                              '_blank',
                            )}
                            className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                            title="预览链接"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(l)}
                            className="rounded p-1.5 text-brand hover:bg-brand/10"
                            title="编辑"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(l)}
                            className="rounded p-1.5 text-red-500 hover:bg-red-50"
                            title="删除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-ink-400">
            说明：「底栏快速链接」分组的内容将显示在版权行右侧（如：隐私政策·服务条款·网站地图），其它分组显示在上方链接列中。
          </p>
        </section>
      </div>

      {/* ============ 新增/编辑链接弹窗 ============ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
              <h3 className="font-semibold text-ink">
                {editingId ? '编辑链接' : '新增链接'}
              </h3>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(emptyForm); setEditingId(null); }}
                className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                aria-label="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 px-5 py-4">
              <div>
                <div className="field-label">分组</div>
                <select
                  value={form.group}
                  onChange={(e) => setForm({ ...form, group: e.target.value })}
                  className="input"
                >
                  {LINK_GROUPS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label} — {g.hint}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="field-label">显示文本 *</div>
                <input
                  value={form.label}
                  onChange={(e) => {
                    const v = e.target.value;
                    const fallback = DEFAULT_ICONS[v]?.icon ?? '';
                    setForm({
                      ...form,
                      label: v,
                      iconName: form.iconName || fallback,
                    });
                  }}
                  placeholder="例：隐私政策 / 关于我们"
                  className="input"
                />
              </div>
              <div>
                <div className="field-label">链接地址 *（站内 / 站外均可）</div>
                <input
                  value={form.href}
                  onChange={(e) => setForm({ ...form, href: e.target.value })}
                  placeholder="例：/about 或 https://www.example.com"
                  className="input"
                />
              </div>
              <div>
                <div className="field-label">图标名（可选；lucide-react 组件名，如 ShieldCheck / Map）</div>
                <input
                  value={form.iconName}
                  onChange={(e) => setForm({ ...form, iconName: e.target.value })}
                  placeholder="例：ShieldCheck"
                  className="input"
                />
                <div className="mt-1 flex flex-wrap gap-2">
                  {['ShieldCheck', 'FileText', 'Map', 'Mail', 'Phone', 'MapPin', 'Building2'].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm({ ...form, iconName: n })}
                      className={`rounded-md border px-2 py-0.5 text-xs transition ${
                        form.iconName === n
                          ? 'border-brand bg-brand text-white'
                          : 'border-ink-200 text-ink-600 hover:border-brand/60 hover:text-brand'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="field-label">排序序号（同组内数字越小越靠前）</div>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })}
                  className="input"
                />
              </div>
              <div className="flex items-center gap-5 rounded-md bg-ink-50 px-3 py-2 text-sm">
                <label className="flex items-center gap-2 text-ink-700">
                  <input
                    type="checkbox"
                    checked={form.openInNew}
                    onChange={(e) => setForm({ ...form, openInNew: e.target.checked })}
                    className="h-4 w-4 accent-brand"
                  />
                  新窗口打开
                </label>
                <label className="flex items-center gap-2 text-ink-700">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="h-4 w-4 accent-brand"
                  />
                  启用（前台显示）
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-ink-100 px-5 py-3">
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(emptyForm); setEditingId(null); }}
                className="rounded-md border border-ink-200 px-4 py-2 text-sm text-ink-600 hover:bg-ink-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={submitLink}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand/90 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingId ? '保存修改' : '创建链接'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ 删除确认 ============ */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl ring-1 ring-black/5">
            <div className="px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink">确认删除链接？</h3>
                  <p className="mt-1 text-sm text-ink-500">
                    将删除「{confirmDelete.group}」分组下的链接「{confirmDelete.label}」，此操作不可撤销。
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-ink-100 px-5 py-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-md border border-ink-200 px-4 py-2 text-sm text-ink-600 hover:bg-ink-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => void doDelete(confirmDelete)}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label, icon: Icon, children,
}: { label: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div>
      <div className="field-label">
        <Icon className="h-3.5 w-3.5 text-brand" />
        {label}
      </div>
      {children}
    </div>
  );
}
