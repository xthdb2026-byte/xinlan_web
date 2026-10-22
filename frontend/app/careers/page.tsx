import type { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getJobs } from '@/lib/api';
import CultureSection from '@/components/careers/CultureSection';
import JobRow from '@/components/careers/JobRow';
import JobFilter from '@/components/careers/JobFilter';
import PageHero from '@/components/common/PageHero';

export const metadata: Metadata = {
  title: '加入我们',
  description: '与新蓝恒成一起，共创智能出行新未来 — 查看最新招聘职位，加入专业团队，共同成长。',
  keywords: ['新蓝恒成招聘', '加入我们', '信息技术招聘', '智能出行', '长沙招聘'],
  alternates: {
    canonical: 'https://xinlanhengcheng.com/careers',
  },
  openGraph: {
    title: '加入我们 | 新蓝恒成',
    description: '与新蓝恒成一起，共创智能出行新未来 — 查看最新招聘职位，加入专业团队，共同成长。',
    type: 'website',
    url: 'https://xinlanhengcheng.com/careers',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '加入我们 | 新蓝恒成',
    description: '与新蓝恒成一起，共创智能出行新未来',
  },
};

interface SearchParams {
  department?: string;
  type?: string;
}

export default async function CareersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const department = searchParams?.department;
  const type = searchParams?.type;

  // 获取全部职位（用于提取部门/类型列表）
  const allJobs = await getJobs();

  // 客户端提取去重部门和类型列表
  const departments = Array.from(
    new Set(allJobs.map((j) => j.department).filter(Boolean)),
  );
  const types = Array.from(
    new Set(allJobs.map((j) => j.type).filter(Boolean)),
  );

  // 按 department/type 筛选
  const jobs = allJobs.filter((j) => {
    if (department && j.department !== department) return false;
    if (type && j.type !== type) return false;
    return true;
  });

  return (
    <>
      {/* 页面 Banner（全屏背景图 + 渐变蒙版） */}
      <PageHero
        page="careers"
        title="加入我们"
        subtitle="与新蓝恒成一起，共创智能出行新未来"
        visualImage="/images/hero/hero_careers.jpg"
        visualAlt="青年人才团队协作研讨场景"
      />

      {/* 企业文化 */}
      <CultureSection />

      {/* 职位列表 */}
      <section className="section bg-ink-50">
        <div className="container-page">
          <h2 className="mb-8 text-2xl font-bold text-ink">招聘职位</h2>

          {/* 筛选器 */}
          <Suspense fallback={<div className="mb-8 h-20 animate-pulse rounded-lg bg-ink-100" />}>
            <JobFilter
              departments={departments}
              types={types}
              total={jobs.length}
            />
          </Suspense>

          {/* 职位列表 */}
          {jobs.length === 0 ? (
            <div className="rounded-2xl border border-ink-100 bg-white p-12 text-center">
              <p className="text-lg font-medium text-ink-600">暂无符合条件的职位</p>
              <p className="mt-2 text-sm text-ink-400">请尝试调整筛选条件或查看全部职位</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
              {jobs.map((job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA 引导 */}
      <section className="bg-white py-16 lg:py-20">
        <div className="container-page">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-12 text-center lg:px-12 lg:py-16">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              没有找到合适的岗位？
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-white/75 sm:text-base">
              我们随时欢迎优秀人才加入，欢迎联系我们了解机会
            </p>
            <Link
              href="/contact"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-brand transition-colors hover:bg-ink-50 sm:text-base"
            >
              联系我们
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
