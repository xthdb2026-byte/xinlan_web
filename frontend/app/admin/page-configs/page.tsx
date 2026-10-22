'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  Pencil,
  History,
  Home,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Eye,
} from 'lucide-react';
import {
  getAdminPageConfigs,
  updateAdminPageConfig,
  getPageConfigRevisions,
  rollbackPageConfig,
  type AdminPageConfigItem,
  type PageConfigRevisionItem,
} from '@/lib/api';
import Modal from '@/components/admin/Modal';

/** 页面标识 → 中文名 */
const PAGE_LABELS: Record<string, string> = {
  home: '首页',
  about: '关于我们',
  products: '产品与服务',
  solutions: '解决方案',
  news: '新闻中心',
  careers: '加入我们',
  contact: '联系我们',
};

/** 站内链接快捷选项（轮播图跳转目标） */
const LINK_OPTIONS = ['/about', '/products', '/solutions', '/news', '/careers', '/contact'];

interface ImageRow {
  image: string;
  link: string;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false });
  } catch {
    return iso;
  }
}

function isHeroSection(item: AdminPageConfigItem): boolean {
  return item.section === 'hero';
}

/** 解析 content 为对象；非法时返回 null */
function parseContent(content: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(content);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export default function AdminPageConfigsPage() {
  const [items, setItems] = useState<AdminPageConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageFilter, setPageFilter] = useState('');

  /* ---------- 编辑弹窗 ---------- */
  const [editTarget, setEditTarget] = useState<AdminPageConfigItem | null>(null);
  const [editMode, setEditMode] = useState<'visual' | 'json'>('json');
  const [contentObj, setContentObj] = useState<Record<string, unknown>>({});
  const [jsonText, setJsonText] = useState('');
  const [imageRows, setImageRows] = useState<ImageRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  /* ---------- 历史版本弹窗 ---------- */
  const [revTarget, setRevTarget] = useState<AdminPageConfigItem | null>(null);
  const [revisions, setRevisions] = useState<PageConfigRevisionItem[]>([]);
  const [revLoading, setRevLoading] = useState(false);
  const [revError, setRevError] = useState('');
  const [previewRev, setPreviewRev] = useState<PageConfigRevisionItem | null>(null);
  const [rollingId, setRollingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await getAdminPageConfigs(pageFilter || undefined));
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [pageFilter]);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------- 编辑 ---------- */
  const openEdit = (item: AdminPageConfigItem) => {
    setEditTarget(item);
    setFormError('');
    const obj = parseContent(item.content);
    if (isHeroSection(item) && obj) {
      // Hero 区：默认可视化编辑（轮播图结构化维护）
      setContentObj(obj);
      const images = Array.isArray(obj.visualImages) ? (obj.visualImages as unknown[]) : [];
      const links = Array.isArray(obj.visualLinks) ? (obj.visualLinks as unknown[]) : [];
      const rows: ImageRow[] = images
        .filter((s): s is string => typeof s === 'string')
        .map((img, i) => ({
          image: img,
          link: typeof links[i] === 'string' ? (links[i] as string) : '',
        }));
      // 无 visualImages 时以 visualImage 单图初始化一行
      if (rows.length === 0 && typeof obj.visualImage === 'string' && obj.visualImage) {
        rows.push({ image: obj.visualImage, link: '' });
      }
      setImageRows(rows.length ? rows : [{ image: '', link: '' }]);
      setJsonText(JSON.stringify(obj, null, 2));
      setEditMode('visual');
    } else {
      setContentObj(obj ?? {});
      setJsonText(obj ? JSON.stringify(obj, null, 2) : item.content);
      setImageRows([]);
      setEditMode('json');
    }
  };

  const switchMode = (mode: 'visual' | 'json') => {
    if (mode === 'json') {
      setJsonText(JSON.stringify(buildHeroContent() ?? contentObj, null, 2));
      setFormError('');
      setEditMode('json');
      return;
    }
    // JSON → 可视化：先校验 JSON 合法
    const obj = parseContent(jsonText);
    if (!obj) {
      setFormError('JSON 格式不合法，无法切换到可视化编辑');
      return;
    }
    setContentObj(obj);
    const images = Array.isArray(obj.visualImages) ? (obj.visualImages as unknown[]) : [];
    const links = Array.isArray(obj.visualLinks) ? (obj.visualLinks as unknown[]) : [];
    const rows: ImageRow[] = images
      .filter((s): s is string => typeof s === 'string')
      .map((img, i) => ({ image: img, link: typeof links[i] === 'string' ? (links[i] as string) : '' }));
    setImageRows(rows.length ? rows : [{ image: '', link: '' }]);
    setFormError('');
    setEditMode('visual');
  };

  /** 由可视化状态合成最终 content 对象（保留未知字段） */
  const buildHeroContent = (): Record<string, unknown> | null => {
    const images = imageRows.map((r) => r.image.trim()).filter(Boolean);
    if (images.length === 0) return null;
    const links = imageRows
      .slice(0, images.length)
      .map((r) => (r.link.trim().startsWith('/') || /^https?:\/\//.test(r.link.trim()) ? r.link.trim() : null));
    return {
      ...contentObj,
      title: typeof contentObj.title === 'string' ? contentObj.title : '',
      subtitle: typeof contentObj.subtitle === 'string' ? contentObj.subtitle : '',
      visualImage: images[0],
      visualAlt: typeof contentObj.visualAlt === 'string' ? contentObj.visualAlt : '',
      visualImages: images,
      visualLinks: links,
    };
  };

  const doSave = async () => {
    if (!editTarget) return;
    let content: string;
    if (editMode === 'visual') {
      const built = buildHeroContent();
      if (!built) {
        setFormError('轮播图至少需要 1 张有效图片');
        return;
      }
      content = JSON.stringify(built);
    } else {
      const obj = parseContent(jsonText);
      if (!obj) {
        setFormError('content 必须是合法 JSON 对象');
        return;
      }
      content = JSON.stringify(obj);
    }
    setSaving(true);
    setFormError('');
    try {
      await updateAdminPageConfig(editTarget.page, editTarget.section, content);
      setEditTarget(null);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- 轮播图行操作 ---------- */
  const moveRow = (idx: number, dir: -1 | 1) => {
    setImageRows((rows) => {
      const next = [...rows];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return rows;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  /* ---------- 历史版本 ---------- */
  const openRevisions = async (item: AdminPageConfigItem) => {
    setRevTarget(item);
    setRevisions([]);
    setRevError('');
    setRevLoading(true);
    try {
      setRevisions(await getPageConfigRevisions(item.page, item.section));
    } catch (e) {
      setRevError(e instanceof Error ? e.message : '历史版本加载失败');
    } finally {
      setRevLoading(false);
    }
  };

  const doRollback = async (rev: PageConfigRevisionItem) => {
    if (!revTarget) return;
    if (!window.confirm(`确定回滚到 ${formatTime(rev.createdAt)} 的版本吗？当前内容将被覆盖（回滚本身也会生成新快照）。`)) {
      return;
    }
    setRollingId(rev.id);
    setRevError('');
    try {
      await rollbackPageConfig(revTarget.page, revTarget.section, rev.id);
      await openRevisions(revTarget);
      await load();
    } catch (e) {
      setRevError(e instanceof Error ? e.message : '回滚失败');
    } finally {
      setRollingId(null);
    }
  };

  const pages = useMemo(
    () => Array.from(new Set(items.map((i) => i.page))).sort(),
    [items],
  );

  return (
    <div>
      {/* 页头 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Home className="h-6 w-6 text-brand" />
          <h1 className="text-xl font-bold text-ink">页面配置</h1>
          <span className="text-sm text-ink-400">共 {items.length} 项</span>
        </div>
        <select
          value={pageFilter}
          onChange={(e) => setPageFilter(e.target.value)}
          className="rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand"
          aria-label="按页面筛选"
        >
          <option value="">全部页面</option>
          {Object.keys(PAGE_LABELS).map((p) => (
            <option key={p} value={p}>
              {PAGE_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {/* 配置列表 */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-ink-100">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-ink-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            加载中…
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-sm text-ink-400">暂无配置项</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-ink-500">
                  <th className="px-4 py-3 font-medium">页面</th>
                  <th className="px-4 py-3 font-medium">配置区</th>
                  <th className="px-4 py-3 font-medium">最近更新</th>
                  <th className="px-4 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {items.map((item) => (
                  <tr key={`${item.page}/${item.section}`} className="hover:bg-ink-50/40">
                    <td className="px-4 py-3 font-medium text-ink">
                      {PAGE_LABELS[item.page] ?? item.page}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-ink-500">{item.section}</span>
                      {isHeroSection(item) && (
                        <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                          轮播
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-500">
                      {formatTime(item.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-ink-500 transition-colors hover:bg-ink-50 hover:text-brand"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          编辑
                        </button>
                        <button
                          type="button"
                          onClick={() => openRevisions(item)}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-ink-500 transition-colors hover:bg-ink-50 hover:text-brand"
                        >
                          <History className="h-3.5 w-3.5" />
                          历史版本
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

      {/* ==================== 编辑弹窗 ==================== */}
      <Modal
        open={!!editTarget}
        title={`编辑配置：${PAGE_LABELS[editTarget?.page ?? ''] ?? editTarget?.page} / ${editTarget?.section}`}
        onClose={() => setEditTarget(null)}
        width="max-w-3xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditTarget(null)}
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
        {editTarget && (
          <div className="space-y-4">
            {formError && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{formError}</div>
            )}

            {/* 模式切换（仅 Hero 区提供可视化） */}
            {isHeroSection(editTarget) && (
              <div className="flex gap-2 rounded-lg bg-ink-50 p-1 text-sm">
                <button
                  type="button"
                  onClick={() => editMode !== 'visual' && switchMode('visual')}
                  className={`flex-1 rounded-md px-3 py-1.5 transition-colors ${
                    editMode === 'visual' ? 'bg-white font-medium text-brand shadow-sm' : 'text-ink-500'
                  }`}
                >
                  可视化编辑
                </button>
                <button
                  type="button"
                  onClick={() => editMode !== 'json' && switchMode('json')}
                  className={`flex-1 rounded-md px-3 py-1.5 transition-colors ${
                    editMode === 'json' ? 'bg-white font-medium text-brand shadow-sm' : 'text-ink-500'
                  }`}
                >
                  JSON 源码
                </button>
              </div>
            )}

            {editMode === 'visual' ? (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-600">标题</label>
                    <input
                      type="text"
                      value={typeof contentObj.title === 'string' ? contentObj.title : ''}
                      onChange={(e) => setContentObj((o) => ({ ...o, title: e.target.value }))}
                      className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-600">图片 alt 描述</label>
                    <input
                      type="text"
                      value={typeof contentObj.visualAlt === 'string' ? contentObj.visualAlt : ''}
                      onChange={(e) => setContentObj((o) => ({ ...o, visualAlt: e.target.value }))}
                      className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-600">副标题</label>
                  <input
                    type="text"
                    value={typeof contentObj.subtitle === 'string' ? contentObj.subtitle : ''}
                    onChange={(e) => setContentObj((o) => ({ ...o, subtitle: e.target.value }))}
                    className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>

                {/* 轮播图列表编辑器 */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-ink-600">
                      轮播图片（{imageRows.length} 张，首张为封面图）
                    </label>
                    <button
                      type="button"
                      onClick={() => setImageRows((r) => [...r, { image: '', link: '' }])}
                      className="flex items-center gap-1 rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs text-ink-600 transition-colors hover:bg-ink-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      添加图片
                    </button>
                  </div>
                  <div className="space-y-2">
                    {imageRows.map((row, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 rounded-lg border border-ink-100 p-2.5"
                      >
                        <span className="mt-2 w-5 text-center text-xs text-ink-300">{idx + 1}</span>
                        {row.image.trim() ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.image}
                            alt=""
                            className="h-12 w-20 shrink-0 rounded object-cover ring-1 ring-ink-100"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.visibility = 'hidden';
                            }}
                          />
                        ) : (
                          <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded bg-ink-50 text-xs text-ink-300">
                            无图
                          </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <input
                            type="text"
                            value={row.image}
                            onChange={(e) =>
                              setImageRows((rows) =>
                                rows.map((r, i) => (i === idx ? { ...r, image: e.target.value } : r)),
                              )
                            }
                            placeholder="图片路径 /images/hero/... 或 /uploads/..."
                            className="w-full rounded-md border border-ink-200 px-2.5 py-1.5 font-mono text-xs outline-none focus:border-brand"
                          />
                          <input
                            type="text"
                            value={row.link}
                            onChange={(e) =>
                              setImageRows((rows) =>
                                rows.map((r, i) => (i === idx ? { ...r, link: e.target.value } : r)),
                              )
                            }
                            placeholder="点击跳转链接（可选，如 /products）"
                            list="hero-link-options"
                            className="w-full rounded-md border border-ink-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand"
                          />
                        </div>
                        <div className="flex shrink-0 flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => moveRow(idx, -1)}
                            disabled={idx === 0}
                            className="rounded p-1 text-ink-400 transition-colors hover:bg-ink-50 disabled:opacity-30"
                            aria-label="上移"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveRow(idx, 1)}
                            disabled={idx === imageRows.length - 1}
                            className="rounded p-1 text-ink-400 transition-colors hover:bg-ink-50 disabled:opacity-30"
                            aria-label="下移"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setImageRows((rows) =>
                                rows.length > 1 ? rows.filter((_, i) => i !== idx) : rows,
                              )
                            }
                            disabled={imageRows.length <= 1}
                            className="rounded p-1 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                            aria-label="删除此图"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <datalist id="hero-link-options">
                    {LINK_OPTIONS.map((l) => (
                      <option key={l} value={l} />
                    ))}
                  </datalist>
                  <p className="mt-2 text-xs text-ink-400">
                    图片建议 ≥1920×1080；可到「媒体库」上传后复制地址。保存时自动将首图同步为封面（visualImage）。
                  </p>
                </div>
              </>
            ) : (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-600">content（JSON）</label>
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  rows={16}
                  spellCheck={false}
                  className="w-full rounded-lg border border-ink-200 px-3 py-2 font-mono text-xs leading-relaxed outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
                <p className="mt-1 text-xs text-ink-400">保存前将校验 JSON 合法性；非法内容无法保存。</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ==================== 历史版本弹窗 ==================== */}
      <Modal
        open={!!revTarget}
        title={`历史版本：${PAGE_LABELS[revTarget?.page ?? ''] ?? revTarget?.page} / ${revTarget?.section}（最近 30 条）`}
        onClose={() => {
          setRevTarget(null);
          setPreviewRev(null);
        }}
        width="max-w-3xl"
      >
        {revError && (
          <div className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{revError}</div>
        )}
        {revLoading ? (
          <div className="flex items-center justify-center py-16 text-ink-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            加载中…
          </div>
        ) : revisions.length === 0 ? (
          <div className="py-16 text-center text-sm text-ink-400">暂无历史快照（每次保存自动生成）</div>
        ) : (
          <div className="space-y-2">
            {revisions.map((rev) => (
              <div
                key={rev.id}
                className="rounded-lg border border-ink-100 p-3 text-sm hover:border-ink-200"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-ink">{formatTime(rev.createdAt)}</div>
                    <div className="mt-0.5 truncate text-xs text-ink-400">{rev.operator}</div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewRev(previewRev?.id === rev.id ? null : rev)}
                      className="flex items-center gap-1 rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs text-ink-600 transition-colors hover:bg-ink-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {previewRev?.id === rev.id ? '收起' : '查看'}
                    </button>
                    <button
                      type="button"
                      onClick={() => doRollback(rev)}
                      disabled={rollingId === rev.id}
                      className="flex items-center gap-1.5 rounded-lg bg-brand px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
                    >
                      {rollingId === rev.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      回滚到此版本
                    </button>
                  </div>
                </div>
                {previewRev?.id === rev.id && (
                  <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-ink-50 p-3 font-mono text-xs leading-relaxed text-ink-600">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(rev.content), null, 2);
                      } catch {
                        return rev.content;
                      }
                    })()}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
