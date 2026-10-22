'use client';

import { useMemo } from 'react';
import Modal from '../Modal';
import { FieldInput, FieldTextarea, FieldSelect } from '../FormFields';
import { useLocalDraft, useFormValidation, createOnFieldChange, ValidationErrors } from '@/hooks/useLocalDraft';

export interface JobFormData {
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string;
  status: string;
}

export const JOB_DEFAULTS: JobFormData = {
  title: '',
  department: '研发部',
  location: '长沙',
  type: 'full-time',
  description: '',
  requirements: '',
  status: 'open',
};

const DEPARTMENT_OPTIONS = [
  { value: '研发部', label: '研发部' },
  { value: '安全部', label: '安全部' },
  { value: '市场部', label: '市场部' },
  { value: '销售部', label: '销售部' },
  { value: '人力资源部', label: '人力资源部' },
  { value: '行政部', label: '行政部' },
];

const TYPE_OPTIONS = [
  { value: 'full-time', label: '全职' },
  { value: 'part-time', label: '兼职' },
  { value: 'intern', label: '实习' },
];

const STATUS_OPTIONS = [
  { value: 'open', label: '招聘中' },
  { value: 'closed', label: '已关闭' },
];

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: Partial<JobFormData> & { id?: number };
  onClose: () => void;
  onSubmit: (data: JobFormData) => Promise<void>;
}

export default function JobEditor({ open, mode, initial, onClose, onSubmit }: Props) {
  const startValue = useMemo<JobFormData>(
    () => ({ ...JOB_DEFAULTS, ...(initial ?? {}) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initial?.id, open],
  );

  const draftKey = `job-${mode}-${initial?.id ?? 'new'}`;
  const { value, setValue, reset, clearDraft, hasDraft } = useLocalDraft<JobFormData>(draftKey, startValue);

  const validator = (v: JobFormData): ValidationErrors<JobFormData> => {
    const e: ValidationErrors<JobFormData> = {};
    if (!v.title.trim()) e.title = '职位名称不能为空';
    else if (v.title.length > 100) e.title = '职位名称不能超过 100 字符';
    if (!v.department.trim()) e.department = '部门不能为空';
    if (!v.location.trim()) e.location = '工作地点不能为空';
    if (!v.type) e.type = '职位类型不能为空';
    if (!v.description.trim()) e.description = '职位描述不能为空';
    if (!v.requirements.trim()) e.requirements = '任职要求不能为空';
    return e;
  };

  const { errors, markTouched, validateAll, reset: resetVld } = useFormValidation(value, validator);
  const onField = createOnFieldChange(setValue, markTouched);

  const handleSubmit = async () => {
    const all = validateAll();
    if (Object.keys(all).length > 0) return;
    try {
      await onSubmit(value);
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
      title={mode === 'create' ? '新建职位' : '编辑职位'}
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
            label="职位名称"
            name="title"
            required
            placeholder="如：高级前端工程师"
            value={value.title}
            onChange={onField('title')}
            onBlur={() => markTouched('title')}
            error={errors.title}
          />
          <FieldSelect
            label="部门"
            name="department"
            required
            options={DEPARTMENT_OPTIONS}
            value={value.department}
            onChange={onField('department')}
            onBlur={() => markTouched('department')}
            error={errors.department}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <FieldInput
            label="工作地点"
            name="location"
            required
            placeholder="长沙 / 北京 / 远程"
            value={value.location}
            onChange={onField('location')}
            onBlur={() => markTouched('location')}
            error={errors.location}
          />
          <FieldSelect
            label="职位类型"
            name="type"
            required
            options={TYPE_OPTIONS}
            value={value.type}
            onChange={onField('type')}
            onBlur={() => markTouched('type')}
            error={errors.type}
          />
          <FieldSelect
            label="招聘状态"
            name="status"
            options={STATUS_OPTIONS}
            value={value.status}
            onChange={onField('status')}
          />
        </div>

        <FieldTextarea
          label="职位描述"
          name="description"
          required
          rows={7}
          placeholder="岗位职责、工作内容等"
          value={value.description}
          onChange={onField('description')}
          onBlur={() => markTouched('description')}
          error={errors.description}
        />

        <FieldTextarea
          label="任职要求"
          name="requirements"
          required
          rows={7}
          placeholder="学历、经验、技能等要求（每行一条）"
          value={value.requirements}
          onChange={onField('requirements')}
          onBlur={() => markTouched('requirements')}
          error={errors.requirements}
        />
      </div>
    </Modal>
  );
}
