'use client';

import Modal from './Modal';
import { FieldDisplay } from './FormFields';

interface ApplicationDetail {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  resumeUrl?: string | null;
  coverLetter?: string | null;
  status: string;
  createdAt: string;
  job?: { title: string } | null;
}

interface Props {
  open: boolean;
  data?: ApplicationDetail | null;
  onClose: () => void;
}

export default function ApplicationDetailModal({ open, data, onClose }: Props) {
  if (!data) return null;

  const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
    pending: { label: '待处理', cls: 'bg-yellow-100 text-yellow-700' },
    reviewed: { label: '已查看', cls: 'bg-blue-100 text-blue-700' },
    interview: { label: '面试中', cls: 'bg-purple-100 text-purple-700' },
    accepted: { label: '已通过', cls: 'bg-green-100 text-green-700' },
    rejected: { label: '已拒绝', cls: 'bg-red-100 text-red-700' },
  };
  const s = STATUS_LABEL[data.status] ?? { label: data.status, cls: 'bg-gray-100 text-gray-600' };

  return (
    <Modal
      open={open}
      title="投递详情"
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
          <FieldDisplay
            label="邮箱"
            value={
              data.email ? (
                <a href={`mailto:${data.email}`} className="text-brand hover:underline">
                  {data.email}
                </a>
              ) : null
            }
          />
          <FieldDisplay
            label="简历链接"
            value={
              data.resumeUrl ? (
                <a
                  href={data.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand hover:underline"
                >
                  打开简历 ↗
                </a>
              ) : null
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FieldDisplay label="应聘职位" value={data.job?.title} />
          <FieldDisplay
            label="处理状态"
            value={
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>
                {s.label}
              </span>
            }
          />
        </div>

        <FieldDisplay label="投递时间" value={new Date(data.createdAt).toLocaleString('zh-CN')} />

        <div className="space-y-1">
          <div className="text-sm font-medium text-ink-500">求职说明 / 附言</div>
          <div className="rounded-lg border border-ink-100 bg-ink-50 px-4 py-3 text-sm text-ink-800 whitespace-pre-wrap leading-relaxed min-h-[100px]">
            {data.coverLetter ?? <span className="text-ink-300">未填写</span>}
          </div>
        </div>
      </div>
    </Modal>
  );
}
