'use client';

import { useMemo } from 'react';
import Modal from '../Modal';
import { FieldInput, FieldTextarea, FieldSelect, FieldNumber } from '../FormFields';
import { useLocalDraft, useFormValidation, createOnFieldChange, ValidationErrors } from '@/hooks/useLocalDraft';

export interface ProductFormData {
  name: string;
  slug: string;
  category: string;
  description: string;
  features: string;   // JSON string: [{title,detail}]
  specs: string;      // JSON string: [{group, items:[{label,value}]}]
  priceInfo: string;  // JSON string: {min,max,unit,note,updatedAt}
  scenarios: string;  // JSON string: ["场景1","场景2"]
  images: string;     // JSON string: ["url1","url2"]
  coverImage: string;
  sortOrder: number;
  status: string;     // draft 草稿 | active 上架 | archived 下架归档
}

export const PRODUCT_DEFAULTS: ProductFormData = {
  name: '',
  slug: '',
  category: '华为网络产品系列',
  description: '',
  features: '[]',
  specs: '',
  priceInfo: '',
  scenarios: '',
  images: '[]',
  coverImage: '',
  sortOrder: 0,
  status: 'active',
};

const CATEGORY_OPTIONS = [
  { value: '华为网络产品系列', label: '华为网络产品系列' },
  { value: '服务器及AI算力服务器系列', label: '服务器及AI算力服务器系列' },
  { value: '电脑设备系列', label: '电脑设备系列' },
  { value: '海康威视监控解决方案系列', label: '海康威视监控解决方案系列' },
  { value: '科大讯飞智能产品系列', label: '科大讯飞智能产品系列' },
  { value: '希沃教育信息化产品系列', label: '希沃教育信息化产品系列' },
];

// 生命周期状态选项
const STATUS_OPTIONS = [
  { value: 'draft', label: '草稿（前台不可见）' },
  { value: 'active', label: '上架（前台展示）' },
  { value: 'archived', label: '下架归档（前台隐藏）' },
];

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: Partial<ProductFormData> & { id?: number };
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
}

export default function ProductEditor({ open, mode, initial, onClose, onSubmit }: Props) {
  const startValue = useMemo<ProductFormData>(
    () => ({ ...PRODUCT_DEFAULTS, ...(initial ?? {}) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initial?.id, open],
  );

  const draftKey = `product-${mode}-${initial?.id ?? 'new'}`;
  const { value, setValue, reset, clearDraft, hasDraft } = useLocalDraft<ProductFormData>(draftKey, startValue);

  const validator = (v: ProductFormData): ValidationErrors<ProductFormData> => {
    const e: ValidationErrors<ProductFormData> = {};
    if (!v.name.trim()) e.name = '名称不能为空';
    else if (v.name.length > 100) e.name = '名称不能超过 100 字符';
    if (!v.slug.trim()) e.slug = 'Slug 不能为空';
    else if (!/^[a-z0-9][a-z0-9-]*$/i.test(v.slug.trim())) e.slug = 'Slug 只能包含字母、数字和连字符';
    else if (v.slug.length > 100) e.slug = 'Slug 不能超过 100 字符';
    if (!v.description.trim()) e.description = '描述不能为空';
    else if (v.description.length > 2000) e.description = '描述不能超过 2000 字符';
    if (v.features) {
      try {
        const arr = JSON.parse(v.features);
        if (!Array.isArray(arr)) throw new Error();
        for (const it of arr) {
          if (typeof it !== 'object' || !it?.title) throw new Error();
        }
      } catch {
        e.features = 'features 必须是合法 JSON 数组，元素为 {title, detail}';
      }
    }
    if (v.images) {
      try {
        const arr = JSON.parse(v.images);
        if (!Array.isArray(arr) || !arr.every((x) => typeof x === 'string')) throw new Error();
      } catch {
        e.images = 'images 必须是合法 JSON 字符串数组';
      }
    }
    if (v.specs) {
      try {
        const arr = JSON.parse(v.specs);
        if (!Array.isArray(arr)) throw new Error();
        for (const g of arr) {
          if (typeof g !== 'object' || !g?.group || !Array.isArray(g?.items)) throw new Error();
        }
      } catch {
        e.specs = 'specs 必须是合法 JSON 数组，元素为 {group, items:[{label,value}]}';
      }
    }
    if (v.priceInfo) {
      try {
        const obj = JSON.parse(v.priceInfo);
        if (typeof obj !== 'object' || typeof obj?.min !== 'number' || typeof obj?.max !== 'number') {
          throw new Error();
        }
      } catch {
        e.priceInfo = 'priceInfo 必须是合法 JSON 对象，包含数值型 min/max 与 unit';
      }
    }
    if (v.scenarios) {
      try {
        const arr = JSON.parse(v.scenarios);
        if (!Array.isArray(arr) || !arr.every((x) => typeof x === 'string')) throw new Error();
      } catch {
        e.scenarios = 'scenarios 必须是合法 JSON 字符串数组';
      }
    }
    if (v.sortOrder < 0) e.sortOrder = '排序不能小于 0';
    return e;
  };

  const { errors, markTouched, validateAll, reset: resetVld } = useFormValidation(value, validator);
  const onField = createOnFieldChange(setValue, markTouched);

  const handleSubmit = async () => {
    const all = validateAll();
    if (Object.keys(all).length > 0) return;
    try {
      const payload: ProductFormData = {
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
      title={mode === 'create' ? '新建产品' : '编辑产品'}
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
            label="产品名称"
            name="name"
            required
            placeholder="请输入产品名称"
            value={value.name}
            onChange={onField('name')}
            onBlur={() => markTouched('name')}
            error={errors.name}
          />
          <FieldInput
            label="Slug"
            name="slug"
            required
            placeholder="URL 标识，如 smart-vehicle"
            value={value.slug}
            onChange={onField('slug')}
            onBlur={() => markTouched('slug')}
            error={errors.slug}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <FieldSelect
            label="分类"
            name="category"
            options={CATEGORY_OPTIONS}
            value={value.category}
            onChange={onField('category')}
          />
          <FieldSelect
            label="生命周期状态"
            name="status"
            options={STATUS_OPTIONS}
            value={value.status}
            onChange={onField('status')}
          />
          <FieldNumber
            label="排序（越小越靠前）"
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

        <FieldTextarea
          label="产品描述"
          name="description"
          required
          rows={4}
          placeholder="用于产品列表和详情页的简要描述"
          value={value.description}
          onChange={onField('description')}
          onBlur={() => markTouched('description')}
          error={errors.description}
        />

        <FieldInput
          label="封面图 URL"
          name="coverImage"
          placeholder="/images/xxx.png 或 https://..."
          value={value.coverImage}
          onChange={onField('coverImage')}
        />

        <FieldTextarea
          label="产品特性 (JSON)"
          name="features"
          rows={6}
          placeholder={`[{"title":"功能名","detail":"详细说明"}]`}
          value={value.features}
          onChange={onField('features')}
          onBlur={() => markTouched('features')}
          error={errors.features}
          help="必须是合法 JSON 数组，每个元素包含 title 和 detail"
        />

        <FieldTextarea
          label="技术参数 (JSON，可选)"
          name="specs"
          rows={5}
          placeholder={`[{"group":"核心配置","items":[{"label":"处理器","value":"..."}]}]`}
          value={value.specs}
          onChange={onField('specs')}
          onBlur={() => markTouched('specs')}
          error={errors.specs}
          help="必须是合法 JSON 数组，元素为 {group, items:[{label, value}]}"
        />

        <FieldTextarea
          label="价格信息 (JSON，可选)"
          name="priceInfo"
          rows={3}
          placeholder={`{"min":3200,"max":4500,"unit":"元/台","note":"含税市场参考价","updatedAt":"2026-08-29"}`}
          value={value.priceInfo}
          onChange={onField('priceInfo')}
          onBlur={() => markTouched('priceInfo')}
          error={errors.priceInfo}
          help="必须是合法 JSON 对象，包含数值型 min/max、unit、note、updatedAt"
        />

        <FieldTextarea
          label="适用场景 (JSON，可选)"
          name="scenarios"
          rows={3}
          placeholder={`["中小企业办公网接入","校园网楼栋接入"]`}
          value={value.scenarios}
          onChange={onField('scenarios')}
          onBlur={() => markTouched('scenarios')}
          error={errors.scenarios}
          help="必须是合法 JSON 字符串数组"
        />

        <FieldTextarea
          label="图集 (JSON)"
          name="images"
          rows={4}
          placeholder='["/images/a.png", "/images/b.png"]'
          value={value.images}
          onChange={onField('images')}
          onBlur={() => markTouched('images')}
          error={errors.images}
          help="必须是合法 JSON 字符串数组，元素为图片 URL"
        />
      </div>
    </Modal>
  );
}
