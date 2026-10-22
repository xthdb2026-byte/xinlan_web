'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, GalleryHorizontal, Eye, EyeOff } from 'lucide-react';
import {
  getAdminBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  type AdminBannerItem,
  type BannerPayload,
} from '@/lib/api';
import Modal from '@/components/admin/Modal';

const emptyForm: BannerPayload = {
  title: '',
  subtitle: '',
  image: '',
  link: '',
  sortOrder: 0,
  enabled: true,
};

export default function AdminBannersPage() {
  const [items, setItems] = useState<AdminBannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* 新建 / 编辑 */
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBannerItem | null>(null); // null=新建
  const [form, setForm] = useState<BannerPayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  /* 删除 */
  const [deleteTarget, setDeleteTarget] = useState<AdminBannerItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [actingId, setActingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await getAdminBanners();
      setItems([...list].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id));
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
    setEditing(null);
    setForm({ ...emptyForm, sortOrder: items.length ? Math.max(...items.map((i) => i.sortOrder)) + 1 : 0 });
    setFormError('');
    setEditOpen(true);
  };

  const openEdit = (item: AdminBannerItem) => {
    setEditing(item);
    setForm({
      title: item.title,
      subtitle: item.subtitle ?? '',
      image: item.image,
      link: item.link ?? '',
      sortOrder: item.sortOrder,
      enabled: item.enabled,
    });
    setFormError('');
    setEditOpen(true);
  };

  const doSave = async () => {
    if (!form.title.trim()) {
      setFormError('标题不能为空');
      return;
    }
    if (!form.image.trim()) {
      setFormError('图片地址不能为空');
      return;
    }
    if (form.link && form.link.trim() && !form.link.trim().startsWith('/') && !/^https?:\/\//.test(form.link.trim())) {
      setFormError('跳转链接需为站内路径（/ 开头）或 http(s) 外链');
      return;
    }
    setSaving(true);
    setFormError('');
    const payload: BannerPayload = {
      ...form,
      title: form.title.trim(),
      subtitle: form.subtitle?.trim() || null,
      image: form.image.trim(),
      link: form.link?.trim() || null,
    };
    try {
      if (editing) {
        await updateBanner(editing.id, payload);
      } else {
        await createBanner(payload);
      }
      setEditOpen(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (item: AdminBannerItem) => {
    setActingId(item.id);
    try {
      await updateBanner(item.id, {
        title: item.title,
        subtitle: item.subtitle,
        image: item.image,
        link: item.link,
        sortOrder: item.sortOrder,
        enabled: !item.enabled,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '状态切换失败');
    } finally {
      setActingId(null);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteBanner(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : '删除失败');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* 页头 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GalleryHorizontal className="h-6 w-6 text-brand" />
          <h1 className="text-xl font-bold text-ink">轮播 Banner</h1>
          <span className="text-sm text-ink-400">共 {items.length} 条</span>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          新建 Banner
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {/* 列表 */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-ink-100">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-ink-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            加载中…
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-sm text-ink-400">
            暂无 Banner，点击右上角"新建 Banner"创建
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-ink-500">
                  <th className="px-4 py-3 font-medium">预览</th>
                  <th className="px-4 py-3 font-medium">标题 / 副标题</th>
                  <th className="px-4 py-3 font-medium">跳转链接</th>
                  <th className="px-4 py-3 font-medium">排序</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-ink-50/40">
                    <td className="px-4 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-12 w-20 rounded-md object-cover ring-1 ring-ink-100"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{item.title}</div>
                      {item.subtitle && (
                        <div className="mt-0.5 max-w-[260px] truncate text-xs text-ink-400">
                          {item.subtitle}
                        </div>
                      )}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-ink-500" title={item.link ?? ''}>
                      {item.link || '-'}
                    </td>
                    <td className="px-4 py-3 text-ink-500">{item.sortOrder}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleEnabled(item)}
                        disabled={actingId === item.id}
                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                          item.enabled
                            ? 'bg-green-50 text-green-600 hover:bg-green-100'
                            : 'bg-ink-50 text-ink-400 hover:bg-ink-100'
                        } disabled:opacity-50`}
                      >
                        {item.enabled ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}
                        {item.enabled ? '启用中' : '已停用'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-50 hover:text-brand"
                          aria-label={`编辑 ${item.title}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget(item);
                            setDeleteError('');
                          }}
                          className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          aria-label={`删除 ${item.title}`}
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
      </div>

      {/* 新建 / 编辑弹窗 */}
      <Modal
        open={editOpen}
        title={editing ? '编辑 Banner' : '新建 Banner'}
        onClose={() => setEditOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="rounded-lg border border-ink-200 px-4 py-2 text-sm text-ink-600 transition-colors hover:bg-ink-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={doSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              保存
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{formError}</div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-600">标题 *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              placeholder="Banner 主标题"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-600">副标题</label>
            <input
              type="text"
              value={form.subtitle ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              placeholder="可选"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-600">图片地址 *</label>
            <input
              type="text"
              value={form.image}
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 font-mono text-xs outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              placeholder="/uploads/... 或 https://..."
            />
            <p className="mt-1 text-xs text-ink-400">可先到「媒体库」上传图片后复制地址；建议 ≥1920×1080</p>
            {form.image.trim() && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.image}
                alt="预览"
                className="mt-2 h-28 w-full rounded-lg object-cover ring-1 ring-ink-100"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-600">跳转链接</label>
              <input
                type="text"
                value={form.link ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                placeholder="/products（可选）"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-600">排序值</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <p className="mt-1 text-xs text-ink-400">数值越小越靠前</p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-600">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
              className="h-4 w-4 rounded border-ink-300 text-brand focus:ring-brand"
            />
            启用（停用后前台不展示）
          </label>
        </div>
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        open={!!deleteTarget}
        title="确认删除"
        onClose={() => setDeleteTarget(null)}
        width="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="rounded-lg border border-ink-200 px-4 py-2 text-sm text-ink-600 transition-colors hover:bg-ink-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={doDelete}
              disabled={deleting}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              确认删除
            </button>
          </>
        }
      >
        {deleteError && (
          <div className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{deleteError}</div>
        )}
        <p className="text-sm text-ink-600">
          确定删除 Banner「<span className="font-medium">{deleteTarget?.title}</span>」吗？此操作不可恢复。
        </p>
      </Modal>
    </div>
  );
}
