'use client';

import { useState } from 'react';
import AdminListPage from '@/components/admin/AdminListPage';
import JobEditor from '@/components/admin/editors/JobEditor';
import type { JobItem } from '@/lib/types';
import { createAdminItem, updateAdminItem } from '@/lib/api';

type Row = JobItem;

const typeMap: Record<string, string> = {
  'full-time': '全职',
  'part-time': '兼职',
  intern: '实习',
};

const columns = [
  { key: 'id', label: 'ID', className: 'w-16' },
  { key: 'title', label: '职位名称' },
  {
    key: 'department',
    label: '部门',
    render: (item: Row) => (
      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
        {item.department}
      </span>
    ),
  },
  { key: 'location', label: '地点', className: 'w-24' },
  {
    key: 'type',
    label: '类型',
    className: 'w-20',
    render: (item: Row) => typeMap[item.type] ?? item.type,
  },
  {
    key: 'status',
    label: '状态',
    className: 'w-20',
    render: (item: Row) => (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          item.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {item.status === 'open' ? '招聘中' : '已关闭'}
      </span>
    ),
  },
  {
    key: 'createdAt',
    label: '创建时间',
    className: 'w-44',
    render: (item: Row) => new Date(item.createdAt ?? '').toLocaleString('zh-CN'),
  },
];

export default function AdminJobsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Row | null>(null);

  const openCreate = () => {
    setEditingItem(null);
    setEditorMode('create');
    setEditorOpen(true);
  };
  const openEdit = (item: Row) => {
    setEditingItem(item);
    setEditorMode('edit');
    setEditorOpen(true);
  };
  const refreshList = () => setRefreshKey((k) => k + 1);

  return (
    <>
      <AdminListPage<Row>
        key={refreshKey}
        module="jobs"
        title="职位管理"
        columns={columns}
        canCreate
        canEdit
        canDelete
        onCreate={openCreate}
        onEdit={openEdit}
      />
      <JobEditor
        open={editorOpen}
        mode={editorMode}
        initial={editingItem ?? undefined}
        onClose={() => setEditorOpen(false)}
        onSubmit={async (data) => {
          if (editorMode === 'create') await createAdminItem('jobs', data);
          else if (editingItem) await updateAdminItem('jobs', editingItem.id, data);
          setEditorOpen(false);
          refreshList();
        }}
      />
    </>
  );
}
