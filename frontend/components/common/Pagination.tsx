'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  basePath,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages || page === currentPage) return;
      const params = new URLSearchParams(searchParams.toString());
      if (page > 1) {
        params.set('page', String(page));
      } else {
        params.delete('page');
      }
      const qs = params.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
    },
    [router, searchParams, totalPages, currentPage, basePath],
  );

  if (totalPages <= 1) return null;

  // 生成页码列表（最多显示 5 个）
  const pages: (number | string)[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
  }

  return (
    <nav className="mt-12 flex items-center justify-center gap-2" aria-label="分页导航">
      {/* 上一页 */}
      <button
        type="button"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-ink-600 ring-1 ring-ink-200 transition-all hover:ring-brand-300 hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:ring-ink-200 disabled:hover:text-ink-600"
        aria-label="上一页"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* 页码 */}
      {pages.map((p, i) =>
        typeof p === 'string' ? (
          <span
            key={`ellipsis-${i}`}
            className="inline-flex h-10 w-10 items-center justify-center text-sm text-ink-400"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => goToPage(p)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-all ${
              p === currentPage
                ? 'bg-brand text-white shadow-md shadow-brand-200'
                : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:ring-brand-300 hover:text-brand'
            }`}
            aria-label={`第 ${p} 页`}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </button>
        ),
      )}

      {/* 下一页 */}
      <button
        type="button"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-ink-600 ring-1 ring-ink-200 transition-all hover:ring-brand-300 hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:ring-ink-200 disabled:hover:text-ink-600"
        aria-label="下一页"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
