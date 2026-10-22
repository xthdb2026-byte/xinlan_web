'use client';

import { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, X, Link2 } from 'lucide-react';
import MediaPicker from './MediaPicker';
import { getMediaUrl } from '@/lib/api';
import type { MediaItem } from '@/lib/types';

interface FieldBaseProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  help?: string;
  className?: string;
}

// ---- 通用容器 ----
function FieldWrapper({
  label,
  name,
  required,
  error,
  help,
  children,
  className,
}: FieldBaseProps & { children: ReactNode }) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <label htmlFor={name} className="block text-sm font-medium text-ink-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      ) : help ? (
        <p className="text-xs text-ink-400">{help}</p>
      ) : null}
    </div>
  );
}

// ---- 文本输入框 ----
interface FieldInputProps extends FieldBaseProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'name'> {}

export function FieldInput({
  label,
  name,
  required,
  error,
  help,
  className,
  ...rest
}: FieldInputProps) {
  return (
    <FieldWrapper
      label={label}
      name={name}
      required={required}
      error={error}
      help={help}
      className={className}
    >
      <input
        id={name}
        name={name}
        {...rest}
        className={[
          'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
            : 'border-ink-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
        ].join(' ')}
      />
    </FieldWrapper>
  );
}

// ---- 数字输入框 ----
export function FieldNumber(props: FieldInputProps) {
  return <FieldInput type="number" {...props} />;
}

// ---- 多行文本 ----
interface FieldTextareaProps
  extends FieldBaseProps,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'> {}

export function FieldTextarea({
  label,
  name,
  required,
  error,
  help,
  className,
  rows = 4,
  ...rest
}: FieldTextareaProps) {
  return (
    <FieldWrapper
      label={label}
      name={name}
      required={required}
      error={error}
      help={help}
      className={className}
    >
      <textarea
        id={name}
        name={name}
        rows={rows}
        {...rest}
        className={[
          'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors resize-none',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
            : 'border-ink-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
        ].join(' ')}
      />
    </FieldWrapper>
  );
}

// ---- 下拉选择 ----
interface FieldSelectProps
  extends FieldBaseProps,
    Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name'> {
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
}

export function FieldSelect({
  label,
  name,
  required,
  error,
  help,
  options,
  placeholder,
  className,
  value,
  ...rest
}: FieldSelectProps) {
  return (
    <FieldWrapper
      label={label}
      name={name}
      required={required}
      error={error}
      help={help}
      className={className}
    >
      <select
        id={name}
        name={name}
        value={value}
        {...rest}
        className={[
          'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors bg-white',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
            : 'border-ink-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
        ].join(' ')}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

// ---- 单行显示（只读，用于详情） ----
interface FieldDisplayProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function FieldDisplay({ label, value, className }: FieldDisplayProps) {
  return (
    <div className={`space-y-1 ${className ?? ''}`}>
      <div className="text-sm font-medium text-ink-500">{label}</div>
      <div className="rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm text-ink-800 min-h-[38px] flex items-center whitespace-pre-wrap">
        {value ?? <span className="text-ink-300">—</span>}
      </div>
    </div>
  );
}

// ---- 图片选择器 ----
interface FieldImagePickerProps extends FieldBaseProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
}

export function FieldImagePicker({
  label,
  name,
  required,
  error,
  help,
  className,
  value,
  onChange,
  onBlur,
  placeholder,
}: FieldImagePickerProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  const handleSelect = (item: MediaItem | MediaItem[]) => {
    if (Array.isArray(item)) return;
    onChange(getMediaUrl(item.url));
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <FieldWrapper
      label={label}
      name={name}
      required={required}
      error={error}
      help={help}
      className={className}
    >
      {manualMode ? (
        <div className="space-y-2">
          <input
            id={name}
            name={name}
            type="text"
            value={value}
            placeholder={placeholder ?? '/images/xxx.png 或 https://...'}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            className={[
              'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors',
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                : 'border-ink-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
            ].join(' ')}
          />
          <button
            type="button"
            onClick={() => setManualMode(false)}
            className="text-xs text-brand hover:underline"
          >
            ← 返回媒体库选择
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {value ? (
            <div className="relative inline-block">
              <div className="relative h-28 w-28 overflow-hidden rounded-lg border border-ink-200">
                <Image
                  src={getMediaUrl(value)}
                  alt="预览"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <button
                type="button"
                onClick={handleClear}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600"
                title="清除"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-lg border-2 border-dashed border-ink-200 text-ink-300">
              <span className="text-xs">暂无图片</span>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:border-brand-300 hover:text-brand"
            >
              <ImagePlus className="h-4 w-4" />
              选择图片
            </button>
            <button
              type="button"
              onClick={() => setManualMode(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:border-brand-300 hover:text-brand"
            >
              <Link2 className="h-4 w-4" />
              手动输入
            </button>
          </div>
        </div>
      )}
      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handleSelect} />
    </FieldWrapper>
  );
}
