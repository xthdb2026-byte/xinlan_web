import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Calendar, Eye } from 'lucide-react';
import type { NewsItem } from '@/lib/types';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseTags(tags?: string | null): string[] {
  if (!tags) return [];
  return tags.split(',').map((t) => t.trim()).filter(Boolean);
}

export default function NewsCard({ news }: { news: NewsItem }) {
  const tags = parseTags(news.tags);

  return (
    <Link
      href={`/news/${news.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100 transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-brand-200 sm:flex-row"
    >
      {/* 封面图 */}
      <div className="relative aspect-[16/9] overflow-hidden bg-ink-100 sm:aspect-square sm:w-64 sm:flex-shrink-0">
        {news.coverImage && (
          <Image
            src={news.coverImage}
            alt={news.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 256px"
          />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand backdrop-blur-sm">
          {news.category}
        </span>
      </div>

      {/* 新闻信息 */}
      <div className="flex flex-1 flex-col p-5 lg:p-6">
        {/* 元信息 */}
        <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-ink-400">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(news.publishedAt)}
          </span>
          {news.viewCount != null && (
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              阅读 {news.viewCount}
            </span>
          )}
        </div>

        {/* 标题 */}
        <h3 className="mb-2 text-lg font-bold text-ink transition-colors group-hover:text-brand">
          {news.title}
        </h3>

        {/* 摘要 */}
        <p className="mb-4 flex-1 text-sm leading-relaxed text-ink-500 line-clamp-2">
          {news.summary}
        </p>

        {/* 标签 + 操作 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-ink-50 px-2 py-0.5 text-xs text-ink-500"
              >
                #{tag}
              </span>
            ))}
          </div>
          <span className="inline-flex flex-shrink-0 items-center gap-1 text-sm font-semibold text-brand transition-colors group-hover:gap-2">
            阅读全文
            <ArrowRight className="h-3.5 w-3.5 transition-all" />
          </span>
        </div>
      </div>
    </Link>
  );
}
