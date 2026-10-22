'use client';

import { useEffect, useMemo } from 'react';
import Modal from '../Modal';
import { FieldInput, FieldTextarea, FieldSelect, FieldImagePicker } from '../FormFields';
import { useLocalDraft, useFormValidation, createOnFieldChange, ValidationErrors } from '@/hooks/useLocalDraft';

export interface NewsFormData {
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  tags: string;
  coverImage: string;
  status: string;
}

export const NEWS_DEFAULTS: NewsFormData = {
  title: '',
  slug: '',
  summary: '',
  content: '',
  category: '公司动态',
  tags: '',
  coverImage: '',
  status: 'published',
};

const CATEGORY_OPTIONS = [
  { value: '公司动态', label: '公司动态' },
  { value: '行业资讯', label: '行业资讯' },
  { value: '产品发布', label: '产品发布' },
];

const STATUS_OPTIONS = [
  { value: 'published', label: '已发布' },
  { value: 'draft', label: '草稿' },
];

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: Partial<NewsFormData> & { id?: number };
  onClose: () => void;
  onSubmit: (data: NewsFormData) => Promise<void>;
}

export default function NewsEditor({ open, mode, initial, onClose, onSubmit }: Props) {
  const startValue = useMemo<NewsFormData>(
    () => ({ ...NEWS_DEFAULTS, ...(initial ?? {}) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initial?.id, open],
  );

  const draftKey = `news-${mode}-${initial?.id ?? 'new'}`;
  const { value, setValue, reset, clearDraft, hasDraft } = useLocalDraft<NewsFormData>(draftKey, startValue);

  const validator = (v: NewsFormData): ValidationErrors<NewsFormData> => {
    const e: ValidationErrors<NewsFormData> = {};
    if (!v.title.trim()) e.title = '标题不能为空';
    else if (v.title.length > 200) e.title = '标题不能超过 200 字符';
    if (!v.slug.trim()) e.slug = 'Slug 不能为空';
    else if (!/^[a-z0-9][a-z0-9-]*$/i.test(v.slug.trim())) e.slug = 'Slug 只能包含字母、数字和连字符';
    else if (v.slug.length > 100) e.slug = 'Slug 不能超过 100 字符';
    if (!v.summary.trim()) e.summary = '摘要不能为空';
    else if (v.summary.length > 500) e.summary = '摘要不能超过 500 字符';
    if (!v.content.trim()) e.content = '内容不能为空';
    return e;
  };

  const { errors, markTouched, validateAll, reset: resetVld } = useFormValidation(value, validator);
  const onField = createOnFieldChange(setValue, markTouched);

  // 自动从标题生成 slug（创建模式且 slug 为空）
  useEffect(() => {
    if (mode !== 'create') return;
    if (value.slug) return;
    const slugged = value.title
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '')
      .replace(/-+/g, '-')
      .slice(0, 80);
    if (slugged) {
      setValue((v) => ({ ...v, slug: slugged }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.title]);

  const handleSubmit = async () => {
    const all = validateAll();
    if (Object.keys(all).length > 0) return;
    try {
      const payload: NewsFormData = {
        ...value,
        tags: value.tags.trim() || null as unknown as string,
        coverImage: value.coverImage.trim() || null as unknown as string,
      };
      await onSubmit(payload);
      clearDraft();
    } catch {
      /* 错误由调用方 toast/alert */
    }
  };

  const handleCancel = () => {
    reset();
    resetVld();
    clearDraft();
    onClose();
  };

  return (
    <Modal
      open={open}
      title={mode === 'create' ? '新建新闻' : '编辑新闻'}
      onClose={handleCancel}
      width="max-w-3xl"
      footer={
        <>
          {hasDraft && (
            <span className="mr-auto text-xs text-amber-600">
              检测到草稿自动暂存，刷新页面也不会丢失
            </span>
          )}
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 transition-colors hover:border-brand-300 hover:text-brand"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            {mode === 'create' ? '创建' : '保存修改'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FieldInput
            label="标题"
            name="title"
            required
            placeholder="请输入新闻标题"
            value={value.title}
            onChange={onField('title')}
            onBlur={() => markTouched('title')}
            error={errors.title}
          />
          <FieldInput
            label="Slug (URL 标识)"
            name="slug"
            required
            placeholder="如：xinlan-wins-award"
            value={value.slug}
            onChange={onField('slug')}
            onBlur={() => markTouched('slug')}
            error={errors.slug}
            help="只能包含字母、数字和连字符，用于生成详情页 URL"
          />
        </div>

        <FieldTextarea
          label="摘要"
          name="summary"
          required
          rows={3}
          placeholder="请输入新闻摘要，将显示在列表卡片上"
          value={value.summary}
          onChange={onField('summary')}
          onBlur={() => markTouched('summary')}
          error={errors.summary}
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <FieldSelect
            label="分类"
            name="category"
            options={CATEGORY_OPTIONS}
            value={value.category}
            onChange={onField('category')}
          />
          <FieldSelect
            label="发布状态"
            name="status"
            options={STATUS_OPTIONS}
            value={value.status}
            onChange={onField('status')}
          />
          <FieldInput
            label="标签"
            name="tags"
            placeholder="用逗号分隔，如：获奖,信息安全"
            value={value.tags}
            onChange={onField('tags')}
          />
        </div>

        <FieldImagePicker
          label="封面图"
          name="coverImage"
          value={value.coverImage}
          onChange={(v) => setValue((prev) => ({ ...prev, coverImage: v }))}
        />

        <FieldTextarea
          label="正文内容"
          name="content"
          required
          rows={12}
          placeholder="请输入新闻正文内容（支持纯文本或 HTML）"
          value={value.content}
          onChange={onField('content')}
          onBlur={() => markTouched('content')}
          error={errors.content}
          help="字段将作为前端详情页渲染的内容，可直接写入 HTML 片段"
        />
      </div>
    </Modal>
  );
}
