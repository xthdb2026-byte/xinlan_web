'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Upload,
  Trash2,
  Star,
  StarOff,
  AlertCircle,
  Loader2,
  Eye,
  History,
  X,
  Shield,
} from 'lucide-react';
import {
  getLogoList,
  uploadLogo,
  setDefaultLogo,
  deleteLogo,
  getLogoAuditLogs,
  getCurrentLogo,
  getMediaUrl,
} from '@/lib/api';
import type { LogoItem, AuditLogItem, CurrentLogo } from '@/lib/types';

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

function formatAction(action: string): string {
  const map: Record<string, string> = {
    upload: '上传',
    delete: '删除',
    set_default: '设为默认',
    switch: '切换',
  };
  return map[action] || action;
}

export default function AdminLogoPage() {
  const [logos, setLogos] = useState<LogoItem[]>([]);
  const [currentLogo, setCurrentLogo] = useState<CurrentLogo | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<LogoItem | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<LogoItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [logoList, current, logs] = await Promise.all([
        getLogoList(),
        getCurrentLogo(),
        getLogoAuditLogs(),
      ]);
      setLogos(logoList);
      setCurrentLogo(current);
      setAuditLogs(logs);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');
    try {
      for (const file of Array.from(files)) {
        // 验证文件类型
        const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
          setError(`文件 "${file.name}" 格式不支持，仅支持 png/jpg/svg/webp/gif`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          setError(`文件 "${file.name}" 超过 5MB 限制`);
          continue;
        }
        await uploadLogo(file);
      }
      fetchData();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? '上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    await handleFileChange(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleSetDefault = async (logo: LogoItem) => {
    setError('');
    try {
      await setDefaultLogo(logo.id);
      fetchData();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? '设置失败');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const result = await deleteLogo(confirmDelete.id);
      setConfirmDelete(null);
      if (result.wasDefault) {
        setCurrentLogo({ url: null, isDefault: false, fallbackIcon: '/icon.svg' });
      }
      fetchData();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? '删除失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
            <Shield className="h-7 w-7 text-brand" />
            网站 Logo 管理
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            管理网站顶部左侧显示的图标，支持上传、切换和删除
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLogs(!showLogs)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              showLogs
                ? 'border-brand-300 bg-brand-50 text-brand'
                : 'border-ink-200 text-ink-600 hover:border-brand-300 hover:text-brand'
            }`}
          >
            <History className="h-4 w-4" />
            操作日志
            {auditLogs.length > 0 && (
              <span className="rounded-full bg-brand px-1.5 py-0.5 text-xs text-white">
                {auditLogs.length}
              </span>
            )}
          </button>
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
            {uploading ? '上传中...' : '上传 Logo'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg,.webp,.gif,image/*"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files)}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 当前 Logo 预览 */}
      <div className="rounded-xl bg-gradient-to-r from-brand-50 to-white p-6 shadow-sm ring-1 ring-brand-100">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-brand">当前启用的 Logo</h2>
            <p className="mt-1 text-xs text-ink-500">此 Logo 将显示在网站顶部左侧</p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600">
            <Star className="h-3 w-3 fill-green-500 text-green-500" />
            启用中
          </div>
        </div>
        <div className="mt-4 flex items-center gap-6">
          <div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-ink-100">
            <div className="relative h-12 w-12">
              {currentLogo?.url ? (
                <Image
                  src={getMediaUrl(currentLogo.url)}
                  alt="Current Logo"
                  fill
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <Image
                  src="/icon.svg"
                  alt="Default Logo"
                  fill
                  className="object-contain"
                />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">
                {currentLogo?.filename || '默认 Logo'}
              </p>
              <p className="text-xs text-ink-500">
                {currentLogo?.mimeType || '内置图标'}
              </p>
            </div>
          </div>
          <div className="text-xs text-ink-500">
            {currentLogo?.url && (
              <p>URL: {currentLogo.url}</p>
            )}
            {!currentLogo?.url && (
              <p>使用系统默认图标 /icon.svg</p>
            )}
          </div>
        </div>
      </div>

      {/* 操作日志面板 */}
      {showLogs && (
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-100">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <History className="h-4 w-4 text-brand" />
            操作日志
          </h3>
          {auditLogs.length === 0 ? (
            <p className="mt-4 text-center text-sm text-ink-400">暂无日志记录</p>
          ) : (
            <div className="mt-4 max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-ink-100 text-ink-500">
                  <tr>
                    <th className="px-2 py-2 font-medium">操作</th>
                    <th className="px-2 py-2 font-medium">目标</th>
                    <th className="px-2 py-2 font-medium">操作人</th>
                    <th className="px-2 py-2 font-medium">详情</th>
                    <th className="px-2 py-2 font-medium">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-ink-50">
                      <td className="px-2 py-2">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                            log.action === 'upload'
                              ? 'bg-blue-50 text-blue-600'
                              : log.action === 'delete'
                                ? 'bg-red-50 text-red-600'
                                : log.action === 'set_default'
                                  ? 'bg-green-50 text-green-600'
                                  : 'bg-ink-50 text-ink-600'
                          }`}
                        >
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-ink-600">Logo #{log.targetId}</td>
                      <td className="px-2 py-2 text-ink-600">{log.operator}</td>
                      <td className="px-2 py-2 text-ink-500">
                        {log.detail ? (
                          <code className="rounded bg-ink-50 px-1 py-0.5 text-[10px]">
                            {log.detail.length > 60 ? log.detail.slice(0, 60) + '...' : log.detail}
                          </code>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-2 py-2 text-ink-400">
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 上传区域 + Logo 列表 */}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* 左侧：上传区 */}
        <div className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleUploadClick}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${
              dragOver
                ? 'border-brand bg-brand-50'
                : 'border-ink-200 bg-white hover:border-brand-300 hover:bg-brand-50/30'
            }`}
          >
            <Upload
              className={`mb-3 h-10 w-10 ${
                dragOver ? 'text-brand' : 'text-ink-300'
              }`}
            />
            <p className="text-sm font-medium text-ink-700">
              {dragOver ? '释放以上传' : '点击或拖拽上传'}
            </p>
            <p className="mt-1 text-xs text-ink-400">
              支持 PNG / JPG / SVG / WEBP / GIF
            </p>
            <p className="mt-1 text-xs text-ink-400">最大 5MB</p>
          </div>

          <div className="rounded-lg bg-ink-50 p-3 text-xs text-ink-500">
            <p className="mb-1 font-medium text-ink-700">📌 小贴士</p>
            <ul className="space-y-0.5 list-inside list-disc">
              <li>建议使用透明背景的 PNG</li>
              <li>建议尺寸 200x200 像素以上</li>
              <li>SVG 格式支持无损缩放</li>
            </ul>
          </div>
        </div>

        {/* 右侧：Logo 列表 */}
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-100">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Logo 库</h3>
            <span className="text-xs text-ink-400">
              共 {logos.length} 个
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-ink-400">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              加载中...
            </div>
          ) : logos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-ink-400">
              <Upload className="mb-3 h-12 w-12 opacity-30" />
              <p>暂无 Logo，上传第一个</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {logos.map((logo) => (
                <div
                  key={logo.id}
                  className={`group relative overflow-hidden rounded-lg border transition-shadow hover:shadow-md ${
                    logo.isDefault
                      ? 'border-brand bg-brand-50/30 ring-2 ring-brand-200'
                      : 'border-ink-100 bg-ink-50'
                  }`}
                >
                  {/* 预览图 */}
                  <div className="relative aspect-square cursor-pointer overflow-hidden bg-white p-2">
                    <Image
                      src={getMediaUrl(logo.url)}
                      alt={logo.filename}
                      fill
                      className="object-contain p-2 transition-transform duration-200 group-hover:scale-105"
                      unoptimized
                      onClick={() => setPreviewLogo(logo)}
                    />
                    {/* 悬停遮罩 */}
                    <div className="absolute inset-0 flex items-center justify-center bg-ink/60 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewLogo(logo);
                          }}
                          className="flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50"
                        >
                          <Eye className="h-3 w-3" />
                          预览
                        </button>
                        {!logo.isDefault && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetDefault(logo);
                            }}
                            className="flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
                          >
                            <Star className="h-3 w-3" />
                            设为默认
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete(logo);
                          }}
                          className="flex items-center gap-1 rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                          删除
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 信息 */}
                  <div className="p-2">
                    <p
                      className="truncate text-xs font-medium text-ink-700"
                      title={logo.filename}
                    >
                      {logo.filename}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-ink-400">
                      <span>{formatSize(logo.size ?? 0)}</span>
                      {logo.isDefault ? (
                        <span className="flex items-center gap-0.5 text-brand">
                          <Star className="h-3 w-3 fill-brand" />
                          默认
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(logo)}
                          className="flex items-center gap-0.5 text-ink-400 hover:text-brand"
                          title="设为默认"
                        >
                          <StarOff className="h-3 w-3" />
                          设为默认
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 快速操作按钮 */}
                  {!logo.isDefault && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(logo);
                      }}
                      className="absolute right-2 top-2 rounded-md bg-red-500/90 p-1.5 text-white opacity-0 shadow-md transition-all hover:bg-red-600 group-hover:opacity-100"
                      title="删除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {logo.isDefault && (
                    <div className="absolute right-2 top-2 rounded-md bg-brand p-1 text-white shadow-md">
                      <Star className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 预览弹窗 */}
      {previewLogo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
          onClick={() => setPreviewLogo(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink">Logo 预览</h3>
              <button
                type="button"
                onClick={() => setPreviewLogo(null)}
                className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 大图预览 */}
            <div className="my-6 flex items-center justify-center rounded-lg bg-ink-50 p-8">
              <div className="relative h-40 w-40">
                <Image
                  src={getMediaUrl(previewLogo.url)}
                  alt={previewLogo.filename}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>

            {/* 网站顶部模拟预览 */}
            <div className="rounded-lg border border-ink-100 p-4">
              <p className="mb-3 text-xs font-medium text-ink-500">网站顶部效果预览</p>
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 flex-shrink-0">
                  <Image
                    src={getMediaUrl(previewLogo.url)}
                    alt=""
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-lg font-bold text-ink">新蓝恒成</span>
                  <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.2em] text-brand">
                    XINLAN HENGCHENG
                  </span>
                </div>
              </div>
            </div>

            {/* Logo 信息 */}
            <div className="mt-4 rounded-lg bg-ink-50 p-3 text-xs">
              <div className="grid grid-cols-2 gap-2 text-ink-500">
                <span>文件名: {previewLogo.filename}</span>
                <span>大小: {formatSize(previewLogo.size ?? 0)}</span>
                <span>类型: {previewLogo.mimeType}</span>
                <span>尺寸: {previewLogo.width} × {previewLogo.height}px</span>
                <span className="col-span-2">上传时间: {formatDate(previewLogo.createdAt ?? '')}</span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="mt-6 flex justify-end gap-3">
              {!previewLogo.isDefault && (
                <button
                  type="button"
                  onClick={() => {
                    handleSetDefault(previewLogo);
                    setPreviewLogo(null);
                  }}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
                >
                  设为默认
                </button>
              )}
              <button
                type="button"
                onClick={() => setPreviewLogo(null)}
                className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 transition-colors hover:border-brand-300 hover:text-brand"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-ink">确认删除</h3>
            <p className="mt-2 text-sm text-ink-600">
              确定要删除 Logo 「{confirmDelete.filename}」吗？
              {confirmDelete.isDefault && (
                <span className="mt-2 block text-amber-600">
                  ⚠️ 这是当前启用的 Logo，删除后网站将使用默认图标。
                </span>
              )}
              删除后无法恢复。
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
