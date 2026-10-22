'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, RefreshCw, AlertCircle } from 'lucide-react';
import { getAdminList, deleteAdminItem } from '@/lib/api';
import type { PaginatedAdminList } from '@/lib/types';

export interface ColumnConfig<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface AdminListPageProps<T> {
  module: string;
  title: string;
  columns: ColumnConfig<T>[];
  idKey?: keyof T;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onCreate?: () => void;
  onEdit?: (item: T) => void;
  extraActions?: (item: T) => React.ReactNode;
  /** 批量操作（可选）：开启后表格首列显示复选框 */
  batchActions?: { action: string; label: string; danger?: boolean }[];
  onBatchAction?: (action: string, ids: number[]) => Promise<void>;
}

export default function AdminListPage<T extends object>({
  module,
  title,
  columns,
  idKey = 'id' as keyof T,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  onCreate,
  onEdit,
  extraActions,
  batchActions,
  onBatchAction,
}: AdminListPageProps<T>) {
  const [data, setData] = useState<PaginatedAdminList<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchRunning, setBatchRunning] = useState(false);
  const [confirmBatch, setConfirmBatch] = useState<{ action: string; label: string; danger?: boolean } | null>(null);

  const selectable = !!batchActions && batchActions.length > 0 && !!onBatchAction;

  const fetchData = async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const result = await getAdminList<T>(module, p, 10);
      setData(result);
      setPage(p);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module]);

  const handleDelete = async (id: number) => {
    try {
      await deleteAdminItem(module, id);
      setConfirmDelete(null);
      fetchData(page);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? '删除失败');
    }
  };

  // ==================== 批量操作 ====================
  const pageIds = data?.items.map((item) => Number(item[idKey])) ?? [];
  const allChecked = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allChecked) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runBatchAction = async () => {
    if (!confirmBatch || !onBatchAction) return;
    setBatchRunning(true);
    setError('');
    try {
      await onBatchAction(confirmBatch.action, Array.from(selectedIds));
      setSelectedIds(new Set());
      setConfirmBatch(null);
      fetchData(page);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? '批量操作失败');
    } finally {
      setBatchRunning(false);
    }
  };

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;
  const colSpan = columns.length + (canEdit || canDelete || extraActions ? 1 : 0) + (selectable ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-ink-500">
            共 {data?.total ?? 0} 条记录
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchData(page)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:border-brand-300 hover:text-brand"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
          {canCreate && onCreate && (
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
            >
              <Plus className="h-4 w-4" />
              新建
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 批量操作工具栏 */}
      {selectable && selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3">
          <span className="text-sm font-medium text-brand">已选 {selectedIds.size} 条</span>
          <div className="flex items-center gap-2">
            {batchActions!.map((ba) => (
              <button
                key={ba.action}
                type="button"
                disabled={batchRunning}
                onClick={() => setConfirmBatch(ba)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                  ba.danger
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-white text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50'
                }`}
              >
                {ba.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-sm text-ink-500 hover:text-brand"
          >
            取消选择
          </button>
        </div>
      )}

      {/* 表格 */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-ink-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-50 text-ink-600">
              <tr>
                {selectable && (
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-ink-300 accent-[#0a5cd7]"
                      aria-label="全选"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={`px-4 py-3 font-medium ${col.className ?? ''}`}
                  >
                    {col.label}
                  </th>
                ))}
                {(canEdit || canDelete || extraActions) && (
                  <th className="px-4 py-3 text-right font-medium">操作</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={colSpan}
                    className="px-4 py-12 text-center text-ink-400"
                  >
                    加载中...
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={colSpan}
                    className="px-4 py-12 text-center text-ink-400"
                  >
                    暂无数据
                  </td>
                </tr>
              ) : (
                data.items.map((item) => {
                  const id = Number(item[idKey]);
                  return (
                    <tr key={id} className={`hover:bg-ink-50 ${selectedIds.has(id) ? 'bg-brand-50/50' : ''}`}>
                      {selectable && (
                        <td className="w-10 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(id)}
                            onChange={() => toggleOne(id)}
                            className="h-4 w-4 rounded border-ink-300 accent-[#0a5cd7]"
                            aria-label={`选择第 ${id} 条`}
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={String(col.key)}
                          className={`px-4 py-3 text-ink-700 ${col.className ?? ''}`}
                        >
                          {col.render ? col.render(item) : String(item[col.key as keyof T] ?? '')}
                        </td>
                      ))}
                      {(canEdit || canDelete || extraActions) && (
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            {extraActions && extraActions(item)}
                            {canEdit && onEdit && (
                              <button
                                type="button"
                                onClick={() => onEdit(item)}
                                className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-brand-50 hover:text-brand"
                                title="编辑"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => setConfirmDelete(id)}
                                className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-red-50 hover:text-red-500"
                                title="删除"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3">
            <span className="text-sm text-ink-500">
              第 {page} / {totalPages} 页
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchData(page - 1)}
                disabled={page <= 1 || loading}
                className="rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-600 transition-colors hover:border-brand-300 hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                上一页
              </button>
              <button
                type="button"
                onClick={() => fetchData(page + 1)}
                disabled={page >= totalPages || loading}
                className="rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-600 transition-colors hover:border-brand-300 hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 删除确认弹窗 */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-ink">确认删除</h3>
            <p className="mt-2 text-sm text-ink-600">
              删除后无法恢复，确定要删除这条记录吗？
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 transition-colors hover:border-brand-300 hover:text-brand"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDelete)}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量操作确认弹窗 */}
      {confirmBatch !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-ink">{confirmBatch.label}</h3>
            <p className="mt-2 text-sm text-ink-600">
              将对已选的 <span className="font-semibold text-brand">{selectedIds.size}</span> 条记录执行「{confirmBatch.label}」操作。
              {confirmBatch.danger && (
                <span className="mt-1 block text-red-500">删除后无法恢复，请谨慎操作。</span>
              )}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmBatch(null)}
                disabled={batchRunning}
                className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 transition-colors hover:border-brand-300 hover:text-brand disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={runBatchAction}
                disabled={batchRunning}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
                  confirmBatch.danger
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-brand hover:bg-brand-600'
                }`}
              >
                {batchRunning ? '执行中...' : '确认执行'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
