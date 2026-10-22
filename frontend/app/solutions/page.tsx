import type { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getSolutions } from '@/lib/api';
import SolutionCard from '@/components/solutions/SolutionCard';
import SolutionFilter from '@/components/solutions/SolutionFilter';
import PageHero from '@/components/common/PageHero';

export const metadata: Metadata = {
  title: '解决方案',
  description: '新蓝恒成行业定制化解决方案 — 政企车辆管理、物流运输安全等信息技术解决方案，助力企业数字化转型。',
  keywords: ['解决方案', '政企车辆管理', '物流运输安全', '行业定制', '数字化转型'],
  alternates: {
    canonical: 'https://xinlanhengcheng.com/solutions',
  },
  openGraph: {
    title: '解决方案 | 新蓝恒成',
    description: '新蓝恒成行业定制化解决方案 — 政企车辆管理、物流运输安全等信息技术解决方案，助力企业数字化转型。',
    type: 'website',
    url: 'https://xinlanhengcheng.com/solutions',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '解决方案 | 新蓝恒成',
    description: '行业定制化解决方案，助力企业数字化转型',
  },
};

interface SearchParams {
  industry?: string;
}

export default async function SolutionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const industry = searchParams?.industry;

  // 获取全部解决方案（用于提取行业列表 + 当前筛选结果）
  const allSolutions = await getSolutions();

  // 客户端提取去重行业列表
  const industries = Array.from(
    new Set(allSolutions.map((s) => s.industry).filter(Boolean)),
  );

  // 按 industry 筛选
  const solutions = industry
    ? allSolutions.filter((s) => s.industry === industry)
    : allSolutions;

  return (
    <>
      {/* 页面 Banner（全屏背景图 + 渐变蒙版） */}
      <PageHero
        page="solutions"
        title="解决方案"
        subtitle="行业定制化解决方案，助力企业数字化转型"
        visualImage="/images/hero/hero_solutions.jpg"
        visualAlt="安全运营中心多屏数据监控场景"
      />

      {/* 解决方案列表 */}
      <section className="section bg-ink-50">
        <div className="container-page">
          {/* 筛选器 */}
          <Suspense fallback={<div className="mb-10 h-10 animate-pulse rounded-full bg-ink-100" />}>
            <SolutionFilter industries={industries} total={solutions.length} />
          </Suspense>

          {/* 方案网格 */}
          {solutions.length === 0 ? (
            <div className="rounded-2xl border border-ink-100 bg-white p-12 text-center">
              <p className="text-lg font-medium text-ink-600">暂无该行业下的解决方案</p>
              <p className="mt-2 text-sm text-ink-400">请尝试选择其他行业或查看全部方案</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {solutions.map((solution) => (
                <SolutionCard key={solution.id} solution={solution} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA 引导区 */}
      <section className="bg-white py-16 lg:py-20">
        <div className="container-page">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-12 text-center lg:px-12 lg:py-16">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              需要定制解决方案？
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-white/75 sm:text-base">
              我们的专业团队将根据您的行业需求，提供量身定制的技术方案
            </p>
            <Link
              href="/contact"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-brand transition-colors hover:bg-ink-50 sm:text-base"
            >
              合作咨询
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
