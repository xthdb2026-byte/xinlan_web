import Link from 'next/link';
import { ArrowRight, MapPin, Briefcase, Building2 } from 'lucide-react';
import type { JobItem } from '@/lib/types';

const typeMap: Record<string, string> = {
  'full-time': '全职',
  'part-time': '兼职',
  intern: '实习',
};

export function formatJobType(type: string): string {
  return typeMap[type] || type;
}

export default function JobRow({ job }: { job: JobItem }) {
  return (
    <Link
      href={`/careers/${job.id}`}
      className="group block border-b border-ink-100 transition-colors hover:bg-ink-50"
    >
      {/* 桌面端：表格行布局 */}
      <div className="hidden items-center justify-between px-4 py-5 sm:flex lg:px-6">
        <div className="flex items-center gap-6">
          <span className="text-base font-semibold text-ink transition-colors group-hover:text-brand">
            {job.title}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-ink-500">
            <Building2 className="h-4 w-4" />
            {job.department}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-ink-500">
            <MapPin className="h-4 w-4" />
            {job.location}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-ink-500">
            <Briefcase className="h-4 w-4" />
            {formatJobType(job.type)}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand transition-all group-hover:gap-2">
          查看详情
          <ArrowRight className="h-3.5 w-3.5 transition-all" />
        </span>
      </div>

      {/* 移动端：卡片布局 */}
      <div className="px-4 py-5 sm:hidden">
        <h3 className="text-base font-semibold text-ink transition-colors group-hover:text-brand">
          {job.title}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-500">
          <span className="flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" />
            {job.department}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {job.location}
          </span>
          <span className="flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5" />
            {formatJobType(job.type)}
          </span>
        </div>
        <div className="mt-3 flex justify-end">
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
            查看详情
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
