'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface NewsFilterProps {
  categories: string[];
  total: number;
}

export default function NewsFilter({ categories, total }: NewsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category') || '';
  const activeTag = searchParams.get('tag') || '';

  const handleFilter = useCallback(
    (category: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (category) {
        params.set('category', category);
      } else {
        params.delete('category');
      }
      // 切换分类时重置 tag 和 page
      params.delete('tag');
      params.delete('page');
      const qs = params.toString();
      router.push(qs ? `/news?${qs}` : '/news', { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="mb-10">
      {/* 分类筛选按钮 */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => handleFilter('')}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
            activeCategory === ''
              ? 'bg-brand text-white shadow-md shadow-brand-200'
              : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:ring-brand-300 hover:text-brand'
          }`}
        >
          全部
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => handleFilter(cat)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
              activeCategory === cat
                ? 'bg-brand text-white shadow-md shadow-brand-200'
                : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:ring-brand-300 hover:text-brand'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 结果计数 */}
      <p className="mt-4 text-sm text-ink-400">
        共 <span className="font-semibold text-ink-600">{total}</span> 条新闻
        {activeCategory && (
          <>
            {' '}
            · 分类: <span className="font-semibold text-brand">{activeCategory}</span>
          </>
        )}
        {activeTag && (
          <>
            {' '}
            · 标签: <span className="font-semibold text-brand">#{activeTag}</span>
          </>
        )}
      </p>
    </div>
  );
}
