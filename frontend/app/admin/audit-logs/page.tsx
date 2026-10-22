'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Search, ScrollText, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import {
  getAuditLogs,
  getAuditLogFacets,
  type AuditLogFacets,
} from '@/lib/api';
import type { AuditLogItem, PaginatedAdminList } from '@/lib/types';

/** 操作类型中文映射（未知类型原样展示） */
const ACTION_LABELS: Record<string, string> = {
  create: '新建',
  update: '更新',
  delete: '删除',
  upload: '上传',
  set_default: '设为默认',
  switch: '切换',
  login: '登录',
  logout: '登出',
  reset_password: '重置密码',
  disable: '禁用',
  enable: '启用',
  role_change: '角色变更',
  reply: '回复',
  status_update: '状态更新',
  rollback: '回滚',
  backup: '备份导出',
  restore: '备份恢复',
};

/** 对象类型中文映射 */
const TARGET_LABELS: Record<string, string> = {
  user: '用户',
  news: '新闻',
  product: '产品',
  product_document: '产品资料',
  solution: '解决方案',
  job: '职位',
  message: '留言',
  application: '投递',
  media: '媒体',
  logo: 'Logo',
  footer_contact: '底部联系信息',
  footer_link: '底部链接',
  friend_link: '友情链接',
  banner: '轮播 Banner',
  page_config: '页面配置',
  backup: '数据备份',
  rate_limit: '限流配置',
};

const PAGE_SIZE = 20;

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false });
  } catch {
    return iso;
  }
}

/** detail 是 JSON 字符串，表格中压缩展示关键片段 */
function summarizeDetail(detail: string | null): string {
  if (!detail) return '-';
  const s = detail.length > 80 ? `${detail.slice(0, 80)}…` : detail;
  return s;
}

export default function AdminAuditLogsPage() {
  const [data, setData] = useState<PaginatedAdminList<AuditLogItem> | null>(null);
  const [facets, setFacets] = useState<AuditLogFacets>({ actions: [], targetTypes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* 筛选条件（keywordInput 为输入中状态，keyword 为生效状态） */
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAuditLogs({
        page,
        pageSize: PAGE_SIZE,
        keyword: keyword || undefined,
        action: action || undefined,
        targetType: targetType || undefined,
      });
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [page, keyword, action, targetType]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getAuditLogFacets()
      .then(setFacets)
      .catch(() => {
        /* facets 加载失败不阻断主列表 */
      });
  }, []);

  const applySearch = () => {
    setPage(1);
    setKeyword(keywordInput.trim());
  };

  const resetFilters = () => {
    setKeywordInput('');
    setKeyword('');
    setAction('');
    setTargetType('');
    setPage(1);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div>
      {/* 页头 */}
      <div className="mb-6 flex items-center gap-3">
        <ScrollText className="h-6 w-6 text-brand" />
        <h1 className="text-xl font-bold text-ink">操作日志</h1>
        {data && <span className="text-sm text-ink-400">共 {data.total} 条</span>}
      </div>

      {/* 筛选栏 */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-100">
        <div className="flex min-w-[220px] flex-1 items-center gap-2">
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            placeholder="搜索操作人 / 详情关键词…"
            className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <button
            type="button"
            onClick={applySearch}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            <Search className="h-4 w-4" />
            搜索
          </button>
        </div>
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand"
          aria-label="按操作类型筛选"
        >
          <option value="">全部操作</option>
          {facets.actions.map((a) => (
            <option key={a} value={a}>
              {ACTION_LABELS[a] ?? a}
            </option>
          ))}
        </select>
        <select
          value={targetType}
          onChange={(e) => {
            setTargetType(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand"
          aria-label="按对象类型筛选"
        >
          <option value="">全部对象</option>
          {facets.targetTypes.map((t) => (
            <option key={t} value={t}>
              {TARGET_LABELS[t] ?? t}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={resetFilters}
          className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-500 transition-colors hover:bg-ink-50"
        >
          <RotateCcw className="h-4 w-4" />
          重置
        </button>
      </div>

      {/* 列表 */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-ink-100">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-ink-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            加载中…
          </div>
        ) : error ? (
          <div className="py-20 text-center text-sm text-red-500">{error}</div>
        ) : !data || data.items.length === 0 ? (
          <div className="py-20 text-center text-sm text-ink-400">暂无匹配的操作日志</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-ink-500">
                  <th className="px-4 py-3 font-medium">时间</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                  <th className="px-4 py-3 font-medium">对象</th>
                  <th className="px-4 py-3 font-medium">操作人</th>
                  <th className="px-4 py-3 font-medium">详情</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {data.items.map((item) => (
                  <tr key={item.id} className="hover:bg-ink-50/40">
                    <td className="whitespace-nowrap px-4 py-3 text-ink-500">
                      {formatTime(item.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
                        {ACTION_LABELS[item.action] ?? item.action}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-600">
                      {TARGET_LABELS[item.targetType] ?? item.targetType}
                      <span className="ml-1 text-ink-300">#{item.targetId}</span>
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-ink-500" title={item.operator}>
                      {item.operator}
                    </td>
                    <td
                      className="max-w-[280px] truncate px-4 py-3 font-mono text-xs text-ink-400"
                      title={item.detail ?? ''}
                    >
                      {summarizeDetail(item.detail)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 分页 */}
      {data && data.total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm text-ink-500">
          <span>
            第 {data.page} / {totalPages} 页
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 rounded-lg border border-ink-200 px-3 py-1.5 transition-colors hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              上一页
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 rounded-lg border border-ink-200 px-3 py-1.5 transition-colors hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              下一页
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
