'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, Trash2, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { getMediaList, uploadMedia, deleteMedia, getMediaUrl } from '@/lib/api';
import type { MediaItem, PaginatedData } from '@/lib/types';

const PAGE_SIZE = 12;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('zh-CN');
  } catch {
    return dateStr;
  }
}

export default function AdminMediaPage() {
  const [data, setData] = useState<PaginatedData<MediaItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MediaItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const result = await getMediaList({ page: p, pageSize: PAGE_SIZE });
      setData(result);
      setPage(p);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');
    try {
      for (const file of Array.from(files)) {
        await uploadMedia(file);
      }
      fetchData(page);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? '上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyUrl = async (item: MediaItem) => {
    const fullUrl = getMediaUrl(item.url);
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setError('复制失败，请手动复制');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteMedia(confirmDelete.id);
      setConfirmDelete(null);
      fetchData(page);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? '删除失败');
    }
  };

  const totalPages = data?.pagination.totalPages ?? 0;

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">媒体库</h1>
          <p className="mt-1 text-sm text-ink-500">
            共 {data?.pagination.total ?? 0} 个文件
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? '上传中...' : '上传图片'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 图片网格 */}
      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-100">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-ink-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            加载中...
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-ink-400">
            <Upload className="mb-3 h-12 w-12 opacity-30" />
            <p>暂无图片，点击上方按钮上传</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {data.items.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-lg border border-ink-100 bg-ink-50 transition-shadow hover:shadow-md"
              >
                <div
                  className="relative aspect-square cursor-pointer overflow-hidden bg-ink-100"
                  onClick={() => handleCopyUrl(item)}
                  title="点击复制图片 URL"
                >
                  <Image
                    src={getMediaUrl(item.url)}
                    alt={item.filename}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-ink/60 opacity-0 transition-opacity group-hover:opacity-100">
                    {copiedId === item.id ? (
                      <div className="flex items-center gap-1 text-sm font-medium text-white">
                        <Check className="h-4 w-4" />
                        已复制
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-sm font-medium text-white">
                        <Copy className="h-4 w-4" />
                        复制链接
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-2">
                  <p className="truncate text-xs font-medium text-ink-700" title={item.filename}>
                    {item.filename}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-ink-400">
                    <span>{formatSize(item.size)}</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(item);
                  }}
                  className="absolute right-2 top-2 rounded-md bg-red-500/90 p-1.5 text-white opacity-0 shadow-md transition-all hover:bg-red-600 group-hover:opacity-100"
                  title="删除"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-ink-100 pt-4">
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
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-ink">确认删除</h3>
            <p className="mt-2 text-sm text-ink-600">
              确定要删除文件「{confirmDelete.filename}」吗？删除后无法恢复。
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
                onClick={handleDelete}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
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
