'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface SolutionFilterProps {
  industries: string[];
  total: number;
}

export default function SolutionFilter({ industries, total }: SolutionFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeIndustry = searchParams.get('industry') || '';

  const handleFilter = useCallback(
    (industry: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (industry) {
        params.set('industry', industry);
      } else {
        params.delete('industry');
      }
      const qs = params.toString();
      router.push(qs ? `/solutions?${qs}` : '/solutions', { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="mb-10">
      {/* 行业筛选按钮 */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => handleFilter('')}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
            activeIndustry === ''
              ? 'bg-brand text-white shadow-md shadow-brand-200'
              : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:ring-brand-300 hover:text-brand'
          }`}
        >
          全部方案
        </button>
        {industries.map((ind) => (
          <button
            key={ind}
            type="button"
            onClick={() => handleFilter(ind)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
              activeIndustry === ind
                ? 'bg-brand text-white shadow-md shadow-brand-200'
                : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:ring-brand-300 hover:text-brand'
            }`}
          >
            {ind}
          </button>
        ))}
      </div>

      {/* 结果计数 */}
      <p className="mt-4 text-sm text-ink-400">
        共 <span className="font-semibold text-ink-600">{total}</span> 个解决方案
        {activeIndustry && (
          <>
            {' '}
            · 行业: <span className="font-semibold text-brand">{activeIndustry}</span>
          </>
        )}
      </p>
    </div>
  );
}
