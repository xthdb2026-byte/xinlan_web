import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Calendar, Eye } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getNewsBySlug, getNewsList } from '@/lib/api';
import type { NewsDetail, NewsItem } from '@/lib/types';

// 新闻详情页：因后端有 viewCount 自增副作用，采用动态渲染
export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseTags(tags?: string | null): string[] {
  if (!tags) return [];
  return tags.split(',').map((t) => t.trim()).filter(Boolean);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const news = await getNewsBySlug(params.slug);
    const tags = parseTags(news.tags);
    const canonicalUrl = `https://xinlanhengcheng.com/news/${news.slug}`;
    return {
      title: news.title,
      description: news.summary,
      keywords: tags.length > 0 ? tags : undefined,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: news.title,
        description: news.summary,
        type: 'article',
        url: canonicalUrl,
        locale: 'zh_CN',
        publishedTime: news.publishedAt ?? undefined,
        images: news.coverImage
          ? [{ url: news.coverImage, width: 1200, height: 675, alt: news.title }]
          : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: news.title,
        description: news.summary,
        images: news.coverImage ? [news.coverImage] : undefined,
      },
    };
  } catch {
    return { title: '新闻中心' };
  }
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { slug } = params;

  let news: NewsDetail;
  try {
    news = await getNewsBySlug(slug);
  } catch {
    notFound();
  }

  const tags = parseTags(news.tags);

  // 获取同分类其它新闻（排除自身，最多 3 条）
  const relatedData = await getNewsList({ category: news.category, pageSize: 10 });
  const related: NewsItem[] = relatedData.items
    .filter((n) => n.slug !== news.slug)
    .slice(0, 3);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: news.title,
    description: news.summary,
    image: news.coverImage ? [news.coverImage] : undefined,
    datePublished: news.publishedAt ?? undefined,
    dateModified: news.updatedAt ?? undefined,
    author: {
      '@type': 'Organization',
      name: '新蓝恒成',
      url: 'https://xinlanhengcheng.com',
    },
    publisher: {
      '@type': 'Organization',
      name: '湖南新蓝恒成信息技术有限公司',
      logo: {
        '@type': 'ImageObject',
        url: 'https://xinlanhengcheng.com/logo.svg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://xinlanhengcheng.com/news/${news.slug}`,
    },
    keywords: tags.join(', '),
    articleSection: news.category,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      {/* 面包屑导航 */}
      <div className="border-b border-ink-100 bg-white">
        <nav className="container-page flex items-center gap-1 py-4 text-sm text-ink-500">
          <Link href="/" className="transition-colors hover:text-brand">
            首页
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/news" className="transition-colors hover:text-brand">
            新闻中心
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="line-clamp-1 font-medium text-ink">{news.title}</span>
        </nav>
      </div>

      {/* 文章头部 */}
      <section className="section bg-white">
        <div className="container-page">
          <div className="mx-auto max-w-3xl">
            {/* 分类标签 */}
            <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand">
              {news.category}
            </span>

            {/* 标题 */}
            <h1 className="mt-4 text-3xl font-bold leading-tight text-ink lg:text-4xl">
              {news.title}
            </h1>

            {/* 元信息 */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink-400">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(news.publishedAt)}
              </span>
              {news.viewCount != null && (
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  阅读 {news.viewCount}
                </span>
              )}
            </div>

            {/* 标签 */}
            {tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/news?tag=${encodeURIComponent(tag)}`}
                    className="rounded bg-ink-50 px-2.5 py-1 text-xs text-ink-500 transition-colors hover:bg-brand-50 hover:text-brand"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 封面图 */}
      {news.coverImage && (
        <section className="bg-white">
          <div className="container-page">
            <div className="mx-auto max-w-4xl">
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-ink-100">
                <Image
                  src={news.coverImage}
                  alt={news.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1200px) 100vw, 768px"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 正文区 */}
      <section className="bg-ink-50 py-16 lg:py-20">
        <div className="container-page">
          <div className="mx-auto max-w-3xl">
            <article className="prose prose-slate max-w-none">
              <p className="text-lg font-medium leading-relaxed text-ink">
                {news.summary}
              </p>
              <div className="mt-6 text-base leading-relaxed text-ink-700">
                {news.content.split('\n').map((paragraph, i) => (
                  <p key={i} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 相关推荐 */}
      {related.length > 0 && (
        <section className="section bg-white">
          <div className="container-page">
            <h2 className="mb-8 text-2xl font-bold text-ink">相关推荐</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100 transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-brand-200"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-ink-100">
                    {item.coverImage && (
                      <Image
                        src={item.coverImage}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-brand backdrop-blur-sm">
                      {item.category}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="mb-2 text-base font-bold text-ink transition-colors group-hover:text-brand line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-ink-400">{formatDate(item.publishedAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
