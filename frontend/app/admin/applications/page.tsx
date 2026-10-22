'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import AdminListPage from '@/components/admin/AdminListPage';
import ApplicationDetailModal from '@/components/admin/ApplicationDetailModal';
import { updateApplicationStatus } from '@/lib/api';

interface ApplicationItem {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  resumeUrl: string | null;
  coverLetter?: string | null;
  status: string;
  createdAt: string;
  job: { title: string };
}

const STATUS_OPTIONS = [
  { value: 'pending', label: '待处理' },
  { value: 'reviewed', label: '已查看' },
  { value: 'interview', label: '面试中' },
  { value: 'accepted', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
];

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-yellow-100 text-yellow-700' },
  reviewed: { label: '已查看', className: 'bg-blue-100 text-blue-700' },
  interview: { label: '面试中', className: 'bg-purple-100 text-purple-700' },
  accepted: { label: '已通过', className: 'bg-green-100 text-green-700' },
  rejected: { label: '已拒绝', className: 'bg-red-100 text-red-700' },
};

const columns = [
  { key: 'id', label: 'ID', className: 'w-16' },
  { key: 'name', label: '姓名', className: 'w-24' },
  { key: 'phone', label: '电话', className: 'w-32' },
  {
    key: 'job',
    label: '应聘职位',
    render: (item: ApplicationItem) => item.job?.title,
  },
  {
    key: 'status',
    label: '状态',
    className: 'w-24',
    render: (item: ApplicationItem) => {
      const s = statusMap[item.status] ?? { label: item.status, className: 'bg-gray-100 text-gray-600' };
      return (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.className}`}>
          {s.label}
        </span>
      );
    },
  },
  {
    key: 'createdAt',
    label: '投递时间',
    className: 'w-44',
    render: (item: ApplicationItem) => new Date(item.createdAt ?? '').toLocaleString('zh-CN'),
  },
];

export default function AdminApplicationsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<ApplicationItem | null>(null);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateApplicationStatus(id, status);
      setRefreshKey((k) => k + 1);
    } catch {
      alert('状态更新失败');
    }
  };

  return (
    <>
      <AdminListPage<ApplicationItem>
        key={refreshKey}
        module="applications"
        title="投递管理"
        columns={columns}
        canCreate={false}
        canEdit={false}
        canDelete
        extraActions={(item) => (
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setDetailItem(item);
                setDetailOpen(true);
              }}
              className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-brand-50 hover:text-brand"
              title="查看详情"
            >
              <Eye className="h-4 w-4" />
            </button>
            <select
              value={item.status}
              onChange={(e) => handleStatusChange(item.id, e.target.value)}
              className="rounded-md border border-ink-200 px-2 py-1 text-xs text-ink-600 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200"
              title="更改状态"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
      />
      <ApplicationDetailModal
        open={detailOpen}
        data={detailItem}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
}
