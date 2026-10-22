import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getSolutions, getSolutionBySlug } from '@/lib/api';
import SolutionCard from '@/components/solutions/SolutionCard';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const solution = await getSolutionBySlug(params.slug);
    const description = solution.content.slice(0, 160);
    const canonicalUrl = `https://xinlanhengcheng.com/solutions/${solution.slug}`;
    return {
      title: solution.title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: solution.title,
        description,
        type: 'article',
        url: canonicalUrl,
        locale: 'zh_CN',
        images: solution.coverImage
          ? [{ url: solution.coverImage, width: 1200, height: 675, alt: solution.title }]
          : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: solution.title,
        description,
        images: solution.coverImage ? [solution.coverImage] : undefined,
      },
    };
  } catch {
    return { title: '解决方案' };
  }
}

export default async function SolutionDetailPage({ params }: PageProps) {
  const { slug } = params;

  let solution;
  try {
    solution = await getSolutionBySlug(slug);
  } catch {
    notFound();
  }

  // 获取同行业其它方案（排除自身，最多 2 个）
  const allSolutions = await getSolutions(solution.industry);
  const related = allSolutions.filter((s) => s.slug !== solution.slug).slice(0, 2);

  return (
    <>
      {/* 面包屑导航 */}
      <div className="border-b border-ink-100 bg-white">
        <nav className="container-page flex items-center gap-1 py-4 text-sm text-ink-500">
          <Link href="/" className="transition-colors hover:text-brand">
            首页
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/solutions" className="transition-colors hover:text-brand">
            解决方案
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-ink">{solution.title}</span>
        </nav>
      </div>

      {/* 方案头部 */}
      <section className="section bg-white">
        <div className="container-page">
          <div className="mx-auto max-w-4xl">
            {/* 封面图 */}
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-ink-100">
              {solution.coverImage && (
                <Image
                  src={solution.coverImage}
                  alt={solution.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1200px) 100vw, 1024px"
                />
              )}
            </div>

            {/* 标题与标签 */}
            <div className="mt-8">
              <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand">
                {solution.industry}
              </span>
              <h1 className="mt-4 text-3xl font-bold text-ink lg:text-4xl">
                {solution.title}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-ink-500">
                {solution.content}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 正文内容区 */}
      <section className="bg-ink-50 py-16 lg:py-20">
        <div className="container-page">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-ink-100 lg:p-12">
              <h2 className="mb-6 text-xl font-bold text-ink">方案详情</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-base leading-relaxed text-ink-700">
                  {solution.content}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 相关推荐 */}
      {related.length > 0 && (
        <section className="section bg-white">
          <div className="container-page">
            <h2 className="mb-8 text-2xl font-bold text-ink">相关推荐</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
              {related.map((item) => (
                <SolutionCard key={item.id} solution={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA 引导 */}
      <section className="bg-white pb-16 lg:pb-20">
        <div className="container-page">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-12 text-center lg:px-12 lg:py-16">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              对这个方案感兴趣？
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-white/75 sm:text-base">
              联系我们，获取详细的方案介绍和报价
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
