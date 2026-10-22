'use client';

import { useState } from 'react';
import AdminListPage from '@/components/admin/AdminListPage';
import SolutionEditor from '@/components/admin/editors/SolutionEditor';
import type { SolutionItem, SolutionDetail } from '@/lib/types';
import { createAdminItem, updateAdminItem } from '@/lib/api';

type Row = SolutionItem & Partial<SolutionDetail>;

const columns = [
  { key: 'id', label: 'ID', className: 'w-16' },
  { key: 'title', label: '方案名称' },
  {
    key: 'industry',
    label: '行业',
    render: (item: Row) => (
      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
        {item.industry}
      </span>
    ),
  },
  { key: 'content', label: '简介', render: (item: Row) => item.content.slice(0, 60) + '...' },
  { key: 'sortOrder', label: '排序', className: 'w-20 text-center' },
  {
    key: 'status',
    label: '状态',
    className: 'w-20',
    render: (item: Row) => (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          (item.status ?? 'active') === 'active'
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        {(item.status ?? 'active') === 'active' ? '启用' : '停用'}
      </span>
    ),
  },
];

export default function AdminSolutionsPage() {
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
        module="solutions"
        title="解决方案管理"
        columns={columns}
        canCreate
        canEdit
        canDelete
        onCreate={openCreate}
        onEdit={openEdit}
      />
      <SolutionEditor
        open={editorOpen}
        mode={editorMode}
        initial={
          editingItem
            ? {
                ...editingItem,
                coverImage: (editingItem.coverImage as string | null | undefined) ?? '',
              }
            : undefined
        }
        onClose={() => setEditorOpen(false)}
        onSubmit={async (data) => {
          if (editorMode === 'create') await createAdminItem('solutions', data);
          else if (editingItem) await updateAdminItem('solutions', editingItem.id, data);
          setEditorOpen(false);
          refreshList();
        }}
      />
    </>
  );
}
