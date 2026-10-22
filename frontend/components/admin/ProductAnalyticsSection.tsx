'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, TrendingUp, AlertTriangle, Package } from 'lucide-react';
import { getProductAnalytics } from '@/lib/api';
import type { ProductAnalytics } from '@/lib/types';

const STATUS_LABEL: Record<string, string> = {
  draft: '草稿',
  active: '已上架',
  archived: '已下架',
};

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-ink-300',
  active: 'bg-green-500',
  archived: 'bg-orange-400',
};

/**
 * 产品数据分析区块（仪表盘）
 * 展示：核心指标、生命周期状态分布、分类分布、近30天浏览趋势、浏览量TOP10
 * 纯 CSS 图表，零依赖
 */
export default function ProductAnalyticsSection() {
  const [data, setData] = useState<ProductAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProductAnalytics()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-ink">产品数据分析</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-ink-100" />
          ))}
        </div>
      </div>
    );
  }
  if (!data) return null;

  const { totals, byStatus, byCategory, topViewed, trend30 } = data;
  const statusTotal = byStatus.reduce((s, r) => s + r.count, 0) || 1;
  const categoryMax = Math.max(...byCategory.map((c) => c.count), 1);
  const trendMax = Math.max(...trend30.map((t) => t.views), 1);
  const topMax = Math.max(...topViewed.map((t) => t.viewCount), 1);

  const metricCards = [
    { label: '产品总数', value: totals.products, icon: Package, color: 'bg-green-500' },
    { label: '累计浏览量', value: totals.totalViews, icon: Eye, color: 'bg-blue-500' },
    { label: '近30天浏览', value: totals.viewsLast30d, icon: TrendingUp, color: 'bg-purple-500' },
    { label: '零浏览上架产品', value: totals.zeroViewActive, icon: AlertTriangle, color: totals.zeroViewActive > 0 ? 'bg-amber-500' : 'bg-ink-300' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">产品数据分析</h2>
        <Link href="/admin/products" className="text-sm text-brand hover:underline">
          进入产品管理 →
        </Link>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-100">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.color} text-white`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xl font-bold text-ink">{card.value.toLocaleString('zh-CN')}</div>
                  <div className="text-xs text-ink-500">{card.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* 生命周期状态分布 */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-ink-100">
          <h3 className="mb-4 text-sm font-bold text-ink">生命周期状态分布</h3>
          {/* 堆叠条 */}
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-ink-100">
            {byStatus.map((s) => (
              <div
                key={s.status}
                className={`${STATUS_COLOR[s.status] ?? 'bg-ink-400'}`}
                style={{ width: `${(s.count / statusTotal) * 100}%` }}
                title={`${STATUS_LABEL[s.status] ?? s.status}: ${s.count}`}
              />
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {byStatus.map((s) => (
              <div key={s.status} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-ink-600">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_COLOR[s.status] ?? 'bg-ink-400'}`} />
                  {STATUS_LABEL[s.status] ?? s.status}
                </span>
                <span className="font-semibold text-ink">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 分类分布 */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-ink-100">
          <h3 className="mb-4 text-sm font-bold text-ink">分类分布</h3>
          <div className="space-y-2.5">
            {byCategory.slice(0, 6).map((c) => (
              <div key={c.category}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="max-w-[70%] truncate text-ink-600">{c.category}</span>
                  <span className="font-semibold text-ink">{c.count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${(c.count / categoryMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 近30天浏览趋势 */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-ink-100">
          <h3 className="mb-4 text-sm font-bold text-ink">近30天浏览趋势</h3>
          <div className="flex h-28 items-end gap-[2px]">
            {trend30.map((t) => (
              <div
                key={t.day}
                className="group relative flex-1 rounded-t bg-brand/70 transition-colors hover:bg-brand"
                style={{ height: `${Math.max((t.views / trendMax) * 100, 2)}%` }}
              >
                <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {t.day.slice(5)} · {t.views}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-ink-400">
            <span>{trend30[0]?.day.slice(5)}</span>
            <span>{trend30[trend30.length - 1]?.day.slice(5)}</span>
          </div>
        </div>
      </div>

      {/* 浏览量 TOP10 */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-ink-100">
        <h3 className="mb-4 text-sm font-bold text-ink">产品浏览量 TOP10</h3>
        {topViewed.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-400">暂无数据</p>
        ) : (
          <div className="space-y-2">
            {topViewed.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[11px] font-bold ${
                    i < 3 ? 'bg-brand text-white' : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-ink-700">{p.name}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'
                }`}>
                  {STATUS_LABEL[p.status] ?? p.status}
                </span>
                <div className="hidden w-40 sm:block">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${(p.viewCount / topMax) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="w-16 text-right text-sm font-semibold text-ink">
                  {p.viewCount.toLocaleString('zh-CN')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
