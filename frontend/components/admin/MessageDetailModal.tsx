'use client';

import Modal from './Modal';
import { FieldDisplay, FieldSelect } from './FormFields';

interface MessageDetail {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  company?: string | null;
  content: string;
  status?: string;
  createdAt: string;
}

interface Props {
  open: boolean;
  data?: MessageDetail | null;
  onClose: () => void;
  currentStatus?: string;
  onStatusChange?: (status: string) => void;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: '待处理' },
  { value: 'read', label: '已阅读' },
  { value: 'replied', label: '已回复' },
  { value: 'archived', label: '已归档' },
];

export default function MessageDetailModal({
  open,
  data,
  onClose,
  currentStatus = 'pending',
  onStatusChange,
}: Props) {
  if (!data) return null;
  return (
    <Modal
      open={open}
      title="留言详情"
      onClose={onClose}
      width="max-w-2xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 transition-colors hover:border-brand-300 hover:text-brand"
          >
            关闭
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FieldDisplay label="姓名" value={data.name} />
          <FieldDisplay label="电话" value={data.phone} />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FieldDisplay label="邮箱" value={data.email} />
          <FieldDisplay label="公司" value={data.company} />
        </div>
        <FieldDisplay label="提交时间" value={new Date(data.createdAt).toLocaleString('zh-CN')} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {onStatusChange ? (
            <FieldSelect
              label="处理状态"
              name="message-status"
              options={STATUS_OPTIONS}
              value={currentStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onStatusChange(e.target.value)}
            />
          ) : (
            <FieldDisplay
              label="状态"
              value={(() => {
                const m: Record<string, string> = {
                  pending: '待处理',
                  read: '已阅读',
                  replied: '已回复',
                  archived: '已归档',
                };
                return m[data.status ?? ''] ?? data.status;
              })()}
            />
          )}
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium text-ink-500">留言内容</div>
          <div className="rounded-lg border border-ink-100 bg-ink-50 px-4 py-3 text-sm text-ink-800 whitespace-pre-wrap leading-relaxed">
            {data.content}
          </div>
        </div>
      </div>
    </Modal>
  );
}
