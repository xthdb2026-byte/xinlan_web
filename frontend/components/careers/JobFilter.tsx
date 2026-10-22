'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { formatJobType } from './JobRow';

interface JobFilterProps {
  departments: string[];
  types: string[];
  total: number;
}

export default function JobFilter({ departments, types, total }: JobFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeDepartment = searchParams.get('department') || '';
  const activeType = searchParams.get('type') || '';

  const handleFilter = useCallback(
    (key: 'department' | 'type', value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      const qs = params.toString();
      router.push(qs ? `/careers?${qs}` : '/careers', { scroll: false });
    },
    [router, searchParams],
  );

  const filterButtonClass = (isActive: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
      isActive
        ? 'bg-brand text-white shadow-md shadow-brand-200'
        : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:ring-brand-300 hover:text-brand'
    }`;

  return (
    <div className="mb-8">
      {/* 部门筛选 */}
      <div className="mb-4">
        <div className="mb-2 text-sm font-medium text-ink-600">部门</div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleFilter('department', '')}
            className={filterButtonClass(activeDepartment === '')}
          >
            全部
          </button>
          {departments.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => handleFilter('department', dept)}
              className={filterButtonClass(activeDepartment === dept)}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* 类型筛选 */}
      <div className="mb-4">
        <div className="mb-2 text-sm font-medium text-ink-600">类型</div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleFilter('type', '')}
            className={filterButtonClass(activeType === '')}
          >
            全部
          </button>
          {types.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleFilter('type', t)}
              className={filterButtonClass(activeType === t)}
            >
              {formatJobType(t)}
            </button>
          ))}
        </div>
      </div>

      {/* 结果计数 */}
      <p className="text-sm text-ink-400">
        共 <span className="font-semibold text-ink-600">{total}</span> 个职位
        {activeDepartment && (
          <>
            {' '}
            · 部门: <span className="font-semibold text-brand">{activeDepartment}</span>
          </>
        )}
        {activeType && (
          <>
            {' '}
            · 类型: <span className="font-semibold text-brand">{formatJobType(activeType)}</span>
          </>
        )}
      </p>
    </div>
  );
}
