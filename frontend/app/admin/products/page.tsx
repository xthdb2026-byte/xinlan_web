'use client';

import { useState } from 'react';
import AdminListPage from '@/components/admin/AdminListPage';
import ProductEditor from '@/components/admin/editors/ProductEditor';
import type { ProductItem, ProductDetail } from '@/lib/types';
import { createAdminItem, updateAdminItem, batchProductAction } from '@/lib/api';

type Row = ProductItem & Partial<ProductDetail> & { summary?: string; createdAt?: string };

const STATUS_META: Record<string, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-ink-100 text-ink-600' },
  active: { label: '已上架', className: 'bg-green-100 text-green-700' },
  archived: { label: '已下架', className: 'bg-orange-100 text-orange-700' },
};

const columns = [
  { key: 'id', label: 'ID', className: 'w-14' },
  { key: 'name', label: '产品名称' },
  {
    key: 'category',
    label: '分类',
    render: (item: Row) => (
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        {item.category}
      </span>
    ),
  },
  {
    key: 'status',
    label: '状态',
    className: 'w-20',
    render: (item: Row) => {
      const meta = STATUS_META[item.status ?? 'active'] ?? STATUS_META.active;
      return (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.className}`}>
          {meta.label}
        </span>
      );
    },
  },
  {
    key: 'viewCount',
    label: '浏览量',
    className: 'w-20 text-center',
    render: (item: Row) => (item.viewCount ?? 0).toLocaleString('zh-CN'),
  },
  {
    key: 'sortOrder',
    label: '排序',
    className: 'w-16 text-center',
  },
  {
    key: 'createdAt',
    label: '创建时间',
    className: 'w-40',
    render: (item: Row) => new Date(item.createdAt ?? '').toLocaleString('zh-CN'),
  },
];

export default function AdminProductsPage() {
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
        module="products"
        title="产品管理"
        columns={columns}
        canCreate
        canEdit
        canDelete
        onCreate={openCreate}
        onEdit={openEdit}
        batchActions={[
          { action: 'publish', label: '批量上架' },
          { action: 'archive', label: '批量下架' },
          { action: 'delete', label: '批量删除', danger: true },
        ]}
        onBatchAction={async (action, ids) => {
          await batchProductAction(action as 'publish' | 'archive' | 'delete', ids);
        }}
      />
      <ProductEditor
        open={editorOpen}
        mode={editorMode}
        initial={
          editingItem
            ? {
                ...editingItem,
                coverImage: (editingItem.coverImage as string | null | undefined) ?? '',
                specs: editingItem.specs ?? '',
                priceInfo: editingItem.priceInfo ?? '',
                scenarios: editingItem.scenarios ?? '',
                status: editingItem.status ?? 'active',
              }
            : undefined
        }
        onClose={() => setEditorOpen(false)}
        onSubmit={async (data) => {
          if (editorMode === 'create') await createAdminItem('products', data);
          else if (editingItem) await updateAdminItem('products', editingItem.id, data);
          setEditorOpen(false);
          refreshList();
        }}
      />
    </>
  );
}
