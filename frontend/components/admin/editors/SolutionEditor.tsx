'use client';

import { useMemo } from 'react';
import Modal from '../Modal';
import { FieldInput, FieldTextarea, FieldSelect, FieldNumber } from '../FormFields';
import { useLocalDraft, useFormValidation, createOnFieldChange, ValidationErrors } from '@/hooks/useLocalDraft';

export interface SolutionFormData {
  title: string;
  slug: string;
  industry: string;
  content: string;
  coverImage: string;
  sortOrder: number;
  status: string;
}

export const SOLUTION_DEFAULTS: SolutionFormData = {
  title: '',
  slug: '',
  industry: '政府机关',
  content: '',
  coverImage: '',
  sortOrder: 0,
  status: 'active',
};

const INDUSTRY_OPTIONS = [
  { value: '政府机关', label: '政府机关' },
  { value: '物流运输', label: '物流运输' },
  { value: '金融服务', label: '金融服务' },
  { value: '交通运输', label: '交通运输' },
  { value: '制造企业', label: '制造企业' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: '启用' },
  { value: 'inactive', label: '停用' },
];

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: Partial<SolutionFormData> & { id?: number };
  onClose: () => void;
  onSubmit: (data: SolutionFormData) => Promise<void>;
}

export default function SolutionEditor({ open, mode, initial, onClose, onSubmit }: Props) {
  const startValue = useMemo<SolutionFormData>(
    () => ({ ...SOLUTION_DEFAULTS, ...(initial ?? {}) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initial?.id, open],
  );

  const draftKey = `solution-${mode}-${initial?.id ?? 'new'}`;
  const { value, setValue, reset, clearDraft, hasDraft } = useLocalDraft<SolutionFormData>(draftKey, startValue);

  const validator = (v: SolutionFormData): ValidationErrors<SolutionFormData> => {
    const e: ValidationErrors<SolutionFormData> = {};
    if (!v.title.trim()) e.title = '标题不能为空';
    else if (v.title.length > 150) e.title = '标题不能超过 150 字符';
    if (!v.slug.trim()) e.slug = 'Slug 不能为空';
    else if (!/^[a-z0-9][a-z0-9-]*$/i.test(v.slug.trim())) e.slug = 'Slug 只能包含字母、数字和连字符';
    else if (v.slug.length > 100) e.slug = 'Slug 不能超过 100 字符';
    if (!v.content.trim()) e.content = '内容不能为空';
    if (v.sortOrder < 0) e.sortOrder = '排序不能小于 0';
    return e;
  };

  const { errors, markTouched, validateAll, reset: resetVld } = useFormValidation(value, validator);
  const onField = createOnFieldChange(setValue, markTouched);

  const handleSubmit = async () => {
    const all = validateAll();
    if (Object.keys(all).length > 0) return;
    try {
      const payload: SolutionFormData = {
        ...value,
        sortOrder: Number(value.sortOrder) || 0,
        coverImage: value.coverImage.trim() || (null as unknown as string),
      };
      await onSubmit(payload);
      clearDraft();
    } catch {
      /* handled by caller */
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
      title={mode === 'create' ? '新建解决方案' : '编辑解决方案'}
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
            label="方案名称"
            name="title"
            required
            placeholder="如：政企车辆管理解决方案"
            value={value.title}
            onChange={onField('title')}
            onBlur={() => markTouched('title')}
            error={errors.title}
          />
          <FieldInput
            label="Slug"
            name="slug"
            required
            placeholder="enterprise-vehicle"
            value={value.slug}
            onChange={onField('slug')}
            onBlur={() => markTouched('slug')}
            error={errors.slug}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <FieldSelect
            label="行业领域"
            name="industry"
            options={INDUSTRY_OPTIONS}
            value={value.industry}
            onChange={onField('industry')}
          />
          <FieldSelect
            label="状态"
            name="status"
            options={STATUS_OPTIONS}
            value={value.status}
            onChange={onField('status')}
          />
          <FieldNumber
            label="排序"
            name="sortOrder"
            min={0}
            value={String(value.sortOrder)}
            onChange={(e) => {
              markTouched('sortOrder');
              setValue((v) => ({ ...v, sortOrder: Number(e.target.value) || 0 }));
            }}
            error={errors.sortOrder}
          />
        </div>

        <FieldInput
          label="封面图 URL"
          name="coverImage"
          placeholder="/images/xxx.png 或 https://..."
          value={value.coverImage}
          onChange={onField('coverImage')}
        />

        <FieldTextarea
          label="方案正文"
          name="content"
          required
          rows={14}
          placeholder="方案介绍、应用场景、技术特性等详细内容"
          value={value.content}
          onChange={onField('content')}
          onBlur={() => markTouched('content')}
          error={errors.content}
        />
      </div>
    </Modal>
  );
}
