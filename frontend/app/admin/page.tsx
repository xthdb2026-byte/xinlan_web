'use client';

import { useEffect, useState } from 'react';
import {
  Newspaper,
  Package,
  Lightbulb,
  Briefcase,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { getDashboardStats } from '@/lib/api';
import type { DashboardStats } from '@/lib/types';
import ProductAnalyticsSection from '@/components/admin/ProductAnalyticsSection';

const statCards = [
  { key: 'news', label: '新闻总数', icon: Newspaper, color: 'bg-blue-500' },
  { key: 'products', label: '产品总数', icon: Package, color: 'bg-green-500' },
  { key: 'solutions', label: '方案总数', icon: Lightbulb, color: 'bg-purple-500' },
  { key: 'jobs', label: '职位总数', icon: Briefcase, color: 'bg-orange-500' },
  { key: 'messages', label: '留言总数', icon: MessageSquare, color: 'bg-pink-500' },
  { key: 'applications', label: '投递总数', icon: FileText, color: 'bg-cyan-500' },
] as const;

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">仪表盘</h1>
        <p className="mt-1 text-sm text-ink-500">欢迎使用新蓝恒成管理后台</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          const count = stats?.counts[card.key] ?? 0;
          return (
            <div
              key={card.key}
              className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-ink-100"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color} text-white`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-ink">
                    {loading ? '—' : count}
                  </div>
                  <div className="text-xs text-ink-500">{card.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 产品数据分析（生命周期/浏览量/趋势） */}
      <ProductAnalyticsSection />

      {/* 最近留言 + 最近投递 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 最近留言 */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-ink-100">
          <h2 className="mb-4 text-lg font-bold text-ink">最近留言</h2>
          {loading || !stats ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-ink-100" />
              ))}
            </div>
          ) : stats.recentMessages.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-400">暂无留言</p>
          ) : (
            <div className="space-y-3">
              {stats.recentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="rounded-lg border border-ink-100 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">{msg.name}</span>
                    <span className="text-xs text-ink-400">
                      {new Date(msg.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-600">
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 最近投递 */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-ink-100">
          <h2 className="mb-4 text-lg font-bold text-ink">最近投递</h2>
          {loading || !stats ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-ink-100" />
              ))}
            </div>
          ) : stats.recentApplications.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-400">暂无投递</p>
          ) : (
            <div className="space-y-3">
              {stats.recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-lg border border-ink-100 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">{app.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        app.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : app.status === 'reviewed'
                          ? 'bg-blue-100 text-blue-700'
                          : app.status === 'accepted'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {app.status === 'pending'
                        ? '待处理'
                        : app.status === 'reviewed'
                        ? '已查看'
                        : app.status === 'accepted'
                        ? '已通过'
                        : '已拒绝'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-500">
                    {app.job.title} · {app.phone}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
