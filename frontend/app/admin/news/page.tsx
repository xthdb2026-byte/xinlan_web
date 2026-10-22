'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import AdminListPage from '@/components/admin/AdminListPage';
import NewsEditor from '@/components/admin/editors/NewsEditor';
import type { NewsItem, NewsDetail } from '@/lib/types';
import { createAdminItem, updateAdminItem } from '@/lib/api';

type Row = NewsItem & Partial<NewsDetail> & { published?: boolean };

const columns = [
  { key: 'id', label: 'ID', className: 'w-16' },
  { key: 'title', label: '标题' },
  {
    key: 'category',
    label: '分类',
    render: (item: Row) => (
      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
        {item.category}
      </span>
    ),
  },
  {
    key: 'status',
    label: '状态',
    render: (item: Row) => {
      const published = item.status === 'published' || item.published === true;
      return (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {published ? '已发布' : '草稿'}
        </span>
      );
    },
  },
  {
    key: 'viewCount',
    label: '阅读量',
    className: 'w-24 text-center',
    render: (item: Row) => item.viewCount ?? 0,
  },
  {
    key: 'createdAt',
    label: '创建时间',
    className: 'w-44',
    render: (item: Row) =>
      new Date(item.publishedAt ?? item.createdAt ?? '').toLocaleString('zh-CN'),
  },
];

export default function AdminNewsPage() {
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
        module="news"
        title="新闻管理"
        columns={columns}
        canCreate
        canEdit
        canDelete
        onCreate={openCreate}
        onEdit={openEdit}
      />
      <NewsEditor
        open={editorOpen}
        mode={editorMode}
        initial={
          editingItem
            ? {
                ...editingItem,
                tags: (editingItem.tags as string | null | undefined) ?? '',
                coverImage: (editingItem.coverImage as string | null | undefined) ?? '',
              }
            : undefined
        }
        onClose={() => setEditorOpen(false)}
        onSubmit={async (data) => {
          if (editorMode === 'create') {
            await createAdminItem('news', data);
          } else if (editingItem) {
            await updateAdminItem('news', editingItem.id, data);
          }
          setEditorOpen(false);
          refreshList();
        }}
      />
    </>
  );
}
