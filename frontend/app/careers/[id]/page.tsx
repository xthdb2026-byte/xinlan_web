import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ChevronRight, MapPin, Briefcase, Building2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getJobById, getJobs } from '@/lib/api';
import type { JobItem } from '@/lib/types';
import { formatJobType } from '@/components/careers/JobRow';
import ApplicationForm from '@/components/careers/ApplicationForm';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return { title: '职位详情' };
  try {
    const job = await getJobById(id);
    const description = job.description.slice(0, 160);
    const canonicalUrl = `https://xinlanhengcheng.com/careers/${job.id}`;
    return {
      title: job.title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: job.title,
        description,
        type: 'article',
        url: canonicalUrl,
        locale: 'zh_CN',
      },
      twitter: {
        card: 'summary',
        title: job.title,
        description,
      },
    };
  } catch {
    return { title: '职位详情' };
  }
}

export default async function JobDetailPage({ params }: PageProps) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) notFound();

  let job: JobItem;
  try {
    job = await getJobById(id);
  } catch {
    notFound();
  }

  // 获取同部门其它职位（排除自身，最多 2 个）
  const allJobs = await getJobs({ department: job.department });
  const related = allJobs.filter((j) => j.id !== job.id).slice(0, 2);

  // 将 requirements 按换行符分割为列表项
  const requirementLines = job.requirements
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <>
      {/* 面包屑导航 */}
      <div className="border-b border-ink-100 bg-white">
        <nav className="container-page flex items-center gap-1 py-4 text-sm text-ink-500">
          <Link href="/" className="transition-colors hover:text-brand">
            首页
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/careers" className="transition-colors hover:text-brand">
            加入我们
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-ink">{job.title}</span>
        </nav>
      </div>

      {/* 职位头部 */}
      <section className="section bg-white">
        <div className="container-page">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-3xl font-bold text-ink lg:text-4xl">{job.title}</h1>

            {/* 元信息标签 */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink-500">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                {job.department}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                {formatJobType(job.type)}
              </span>
            </div>

            {/* 标签 pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand">
                {job.department}
              </span>
              <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-600">
                {formatJobType(job.type)}
              </span>
              <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-600">
                {job.location}
              </span>
            </div>

            {/* 投递按钮（锚点跳转到底部表单） */}
            <div className="mt-8">
              <a
                href="#apply"
                className="inline-flex items-center gap-2 rounded-md bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600 sm:text-base"
              >
                立即投递
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 职位描述 */}
      <section className="bg-ink-50 py-16 lg:py-20">
        <div className="container-page">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-ink-100 lg:p-12">
              <h2 className="mb-4 text-xl font-bold text-ink">职位描述</h2>
              <p className="text-base leading-relaxed text-ink-700">
                {job.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 任职要求 */}
      <section className="bg-ink-50 pb-16 lg:pb-20">
        <div className="container-page">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-ink-100 lg:p-12">
              <h2 className="mb-4 text-xl font-bold text-ink">任职要求</h2>
              <ul className="space-y-3">
                {requirementLines.map((line, i) => (
                  <li key={i} className="flex items-start gap-3 text-base leading-relaxed text-ink-700">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand" />
                    <span>{line.replace(/^\d+\.\s*/, '')}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 相关职位 */}
      {related.length > 0 && (
        <section className="section bg-white">
          <div className="container-page">
            <h2 className="mb-8 text-2xl font-bold text-ink">相关职位</h2>
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/careers/${item.id}`}
                  className="group block border-b border-ink-100 transition-colors last:border-b-0 hover:bg-ink-50"
                >
                  <div className="hidden items-center justify-between px-4 py-5 sm:flex lg:px-6">
                    <div className="flex items-center gap-6">
                      <span className="text-base font-semibold text-ink transition-colors group-hover:text-brand">
                        {item.title}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm text-ink-500">
                        <Building2 className="h-4 w-4" />
                        {item.department}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm text-ink-500">
                        <MapPin className="h-4 w-4" />
                        {item.location}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm text-ink-500">
                        <Briefcase className="h-4 w-4" />
                        {formatJobType(item.type)}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand transition-all group-hover:gap-2">
                      查看详情
                      <ArrowRight className="h-3.5 w-3.5 transition-all" />
                    </span>
                  </div>
                  <div className="px-4 py-5 sm:hidden">
                    <h3 className="text-base font-semibold text-ink group-hover:text-brand">
                      {item.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-500">
                      <span>{item.department}</span>
                      <span>{item.location}</span>
                      <span>{formatJobType(item.type)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 投递表单 */}
      <section id="apply" className="bg-ink-50 py-16 lg:py-20 scroll-mt-20">
        <div className="container-page">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-ink-100 lg:p-12">
              <ApplicationForm jobId={job.id} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
