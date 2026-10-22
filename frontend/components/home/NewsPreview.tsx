import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Calendar, Tag } from 'lucide-react';
import { getLatestNews } from '@/lib/api';
import type { NewsItem } from '@/lib/types';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default async function NewsPreview() {
  let news: NewsItem[] = [];
  let loadError = false;

  try {
    news = await getLatestNews(3);
  } catch {
    loadError = true;
  }

  return (
    <section className="section bg-white">
      <div className="container-page">
        {/* 标题区 */}
        <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="section-title">新闻动态</h2>
            <p className="section-subtitle">了解新蓝恒成最新资讯与行业动态</p>
          </div>
          <Link
            href="/news"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand transition-colors hover:text-brand-700"
          >
            查看全部
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* 内容区 */}
        {loadError ? (
          <div className="rounded-xl border border-ink-100 bg-ink-50 p-8 text-center text-ink-500">
            暂时无法加载新闻数据，请稍后重试
          </div>
        ) : news.length === 0 ? (
          <div className="rounded-xl border border-ink-100 bg-ink-50 p-8 text-center text-ink-500">
            暂无新闻内容
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((item) => (
              <article
                key={item.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                {/* 封面图 */}
                {item.coverImage && (
                  <Link href={`/news/${item.slug}`} className="relative aspect-video overflow-hidden">
                    <Image
                      src={item.coverImage}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </Link>
                )}

                {/* 内容 */}
                <div className="flex flex-1 flex-col p-5">
                  {/* 分类标签 */}
                  <div className="mb-3 flex items-center gap-3 text-xs text-ink-400">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand">
                      <Tag className="h-3 w-3" />
                      {item.category}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(item.publishedAt)}
                    </span>
                  </div>

                  {/* 标题 */}
                  <h3 className="mb-2 text-base font-bold leading-snug text-ink transition-colors group-hover:text-brand lg:text-lg">
                    <Link href={`/news/${item.slug}`}>{item.title}</Link>
                  </h3>

                  {/* 摘要 */}
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-ink-500 line-clamp-2">
                    {item.summary}
                  </p>

                  {/* 阅读链接 */}
                  <Link
                    href={`/news/${item.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-brand transition-colors hover:text-brand-700"
                  >
                    阅读全文
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
