'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, Loader2, Check } from 'lucide-react';
import Modal from './Modal';
import { getMediaList, uploadMedia, getMediaUrl } from '@/lib/api';
import type { MediaItem, PaginatedData } from '@/lib/types';

const PAGE_SIZE = 12;

interface MediaPickerProps {
  open: boolean;
  multiple?: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem | MediaItem[]) => void;
}

export default function MediaPicker({ open, multiple = false, onClose, onSelect }: MediaPickerProps) {
  const [data, setData] = useState<PaginatedData<MediaItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
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
    if (open) {
      setSelectedId(null);
      setSelectedIds([]);
      fetchData(1);
    }
  }, [open, fetchData]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');
    try {
      const uploaded: MediaItem[] = [];
      for (const file of Array.from(files)) {
        const item = await uploadMedia(file);
        uploaded.push(item);
      }
      await fetchData(1);
      if (multiple) {
        setSelectedIds((prev) => {
          const ids = new Set(prev);
          uploaded.forEach((u) => ids.add(u.id));
          return Array.from(ids);
        });
      } else if (uploaded.length > 0) {
        setSelectedId(uploaded[uploaded.length - 1].id);
      }
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? '上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelect = (item: MediaItem) => {
    if (multiple) {
      setSelectedIds((prev) => {
        if (prev.includes(item.id)) {
          return prev.filter((id) => id !== item.id);
        }
        return [...prev, item.id];
      });
    } else {
      setSelectedId(item.id);
    }
  };

  const handleConfirm = () => {
    if (!data) return;
    if (multiple) {
      if (selectedIds.length === 0) return;
      const items = data.items.filter((i) => selectedIds.includes(i.id));
      if (items.length > 0) {
        onSelect(items);
        onClose();
      }
    } else {
      if (selectedId === null) return;
      const item = data.items.find((i) => i.id === selectedId);
      if (item) {
        onSelect(item);
        onClose();
      }
    }
  };

  const totalPages = data?.pagination.totalPages ?? 0;
  const hasSelection = multiple ? selectedIds.length > 0 : selectedId !== null;

  return (
    <Modal
      open={open}
      title={multiple ? '选择图片（可多选）' : '选择图片'}
      onClose={onClose}
      width="max-w-4xl"
      footer={
        <>
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={uploading}
            className="mr-auto inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:border-brand-300 hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
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
          {multiple && (
            <span className="text-sm text-ink-500">
              已选 <span className="font-semibold text-brand">{selectedIds.length}</span> 张
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 transition-colors hover:border-brand-300 hover:text-brand"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!hasSelection}
            className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            确认选择
          </button>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-ink-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          加载中...
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-ink-400">
          <Upload className="mb-3 h-10 w-10 opacity-30" />
          <p>暂无图片，点击下方按钮上传</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {data.items.map((item) => {
              const selected = multiple ? selectedIds.includes(item.id) : selectedId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                    selected
                      ? 'border-brand shadow-md'
                      : 'border-transparent hover:border-ink-200'
                  }`}
                >
                  <div className="relative aspect-square overflow-hidden bg-ink-100">
                    <Image
                      src={getMediaUrl(item.url)}
                      alt={item.filename}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  {selected && (
                    <div className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white shadow">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                  <div className="px-2 py-1">
                    <p className="truncate text-[11px] text-ink-600" title={item.filename}>
                      {item.filename}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4">
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
        </>
      )}
    </Modal>
  );
}
