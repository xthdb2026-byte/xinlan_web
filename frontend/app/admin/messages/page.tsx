'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import AdminListPage from '@/components/admin/AdminListPage';
import MessageDetailModal from '@/components/admin/MessageDetailModal';
import { updateMessageStatus } from '@/lib/api';
import type { MessagePayload } from '@/lib/types';

interface MessageItem extends MessagePayload {
  id: number;
  createdAt: string;
  type?: string;
  status?: string;
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: '待处理', cls: 'bg-yellow-100 text-yellow-700' },
  read: { label: '已阅读', cls: 'bg-blue-100 text-blue-700' },
  replied: { label: '已回复', cls: 'bg-green-100 text-green-700' },
  archived: { label: '已归档', cls: 'bg-gray-100 text-gray-600' },
};

const columns = [
  { key: 'id', label: 'ID', className: 'w-16' },
  { key: 'name', label: '姓名', className: 'w-24' },
  { key: 'phone', label: '电话', className: 'w-32' },
  { key: 'email', label: '邮箱', className: 'w-48' },
  { key: 'company', label: '公司' },
  {
    key: 'content',
    label: '留言内容',
    render: (item: MessageItem) => item.content.slice(0, 40) + '...',
  },
  {
    key: 'status',
    label: '状态',
    className: 'w-24',
    render: (item: MessageItem) => {
      const s = STATUS_LABEL[item.status ?? ''] ?? {
        label: item.status ?? '—',
        cls: 'bg-gray-100 text-gray-600',
      };
      return (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>
          {s.label}
        </span>
      );
    },
  },
  {
    key: 'createdAt',
    label: '提交时间',
    className: 'w-44',
    render: (item: MessageItem) => new Date(item.createdAt ?? '').toLocaleString('zh-CN'),
  },
];

export default function AdminMessagesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<MessageItem | null>(null);

  const openDetail = (item: MessageItem) => {
    setDetailItem(item);
    setDetailOpen(true);
  };

  const refresh = () => setRefreshKey((k) => k + 1);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateMessageStatus(id, status);
      setDetailItem((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
      refresh();
    } catch {
      alert('状态更新失败');
    }
  };

  return (
    <>
      <AdminListPage<MessageItem>
        key={refreshKey}
        module="messages"
        title="留言管理"
        columns={columns}
        canCreate={false}
        canEdit={false}
        canDelete
        extraActions={(item) => (
          <button
            type="button"
            onClick={() => openDetail(item)}
            className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-brand-50 hover:text-brand"
            title="查看详情"
          >
            <Eye className="h-4 w-4" />
          </button>
        )}
      />
      <MessageDetailModal
        open={detailOpen}
        data={detailItem}
        onClose={() => {
          setDetailOpen(false);
          refresh();
        }}
        currentStatus={detailItem?.status ?? 'pending'}
        onStatusChange={(status) => detailItem && handleStatusChange(detailItem.id, status)}
      />
    </>
  );
}
