'use client';

import { useState, useCallback } from 'react';
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FormData {
  name: string;
  phone: string;
  email: string;
  resumeUrl: string;
  coverLetter: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  resumeUrl?: string;
  coverLetter?: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

const initialData: FormData = {
  name: '',
  phone: '',
  email: '',
  resumeUrl: '',
  coverLetter: '',
};

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.name.trim()) {
    errors.name = '姓名不能为空';
  } else if (data.name.length > 50) {
    errors.name = '姓名不能超过 50 个字符';
  }

  if (!data.phone.trim()) {
    errors.phone = '电话不能为空';
  } else if (!/^1[3-9]\d{9}$/.test(data.phone.replace(/[\s-]/g, ''))) {
    errors.phone = '请输入有效的手机号码';
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = '邮箱格式不正确';
  }

  if (data.resumeUrl && !/^https?:\/\/.+/.test(data.resumeUrl)) {
    errors.resumeUrl = '请输入有效的链接（以 http:// 或 https:// 开头）';
  }

  if (data.coverLetter.length > 2000) {
    errors.coverLetter = '求职说明不能超过 2000 个字符';
  }

  return errors;
}

export default function ApplicationForm({ jobId }: { jobId: number }) {
  const [data, setData] = useState<FormData>(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState('');

  const handleChange = useCallback(
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
      if (serverError) setServerError('');
    },
    [errors, serverError],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setStatus('loading');
    setServerError('');

    try {
      // 使用同源 /api 代理，避免跨域/Mixed Content；由 next.config rewrites 转发到后端
      const applyUrl = process.env.NEXT_PUBLIC_API_BASE
        ? `${process.env.NEXT_PUBLIC_API_BASE.replace(/\/$/, '')}/applications`
        : '/api/applications';
      const res = await fetch(applyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          name: data.name.trim(),
          phone: data.phone.trim(),
          email: data.email.trim() || undefined,
          resumeUrl: data.resumeUrl.trim() || undefined,
          coverLetter: data.coverLetter.trim() || undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        if (result.code === 'VALIDATION_ERROR') {
          setServerError(result.message);
        } else {
          setServerError(result.message || '投递失败，请稍后重试');
        }
        setStatus('error');
        return;
      }

      setStatus('success');
      setData(initialData);
    } catch {
      setServerError('网络错误，请检查网络连接后重试');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
        <h3 className="text-xl font-bold text-ink">投递成功</h3>
        <p className="mt-2 text-sm text-ink-500">
          感谢您的投递，我们会在 3-5 个工作日内与您联系！
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-6 rounded-lg border border-ink-200 px-6 py-2.5 text-sm font-semibold text-ink-600 transition-colors hover:border-brand-300 hover:text-brand"
        >
          再次投递
        </button>
      </div>
    );
  }

  const inputClass = (field: keyof FormErrors) =>
    `w-full rounded-lg border px-4 py-2.5 text-sm text-ink-700 transition-colors placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-200 ${
      errors[field]
        ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200'
        : 'border-ink-200 bg-white focus:border-brand-400'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <h3 className="text-xl font-bold text-ink">投递简历</h3>

      {status === 'error' && serverError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* 姓名 + 电话 */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="app-name" className="mb-1.5 block text-sm font-medium text-ink-700">
            姓名 <span className="text-red-500">*</span>
          </label>
          <input
            id="app-name"
            type="text"
            value={data.name}
            onChange={handleChange('name')}
            placeholder="请输入您的姓名"
            className={inputClass('name')}
            disabled={status === 'loading'}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="app-phone" className="mb-1.5 block text-sm font-medium text-ink-700">
            电话 <span className="text-red-500">*</span>
          </label>
          <input
            id="app-phone"
            type="tel"
            value={data.phone}
            onChange={handleChange('phone')}
            placeholder="请输入手机号码"
            className={inputClass('phone')}
            disabled={status === 'loading'}
          />
          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
        </div>
      </div>

      {/* 邮箱 */}
      <div>
        <label htmlFor="app-email" className="mb-1.5 block text-sm font-medium text-ink-700">
          邮箱
        </label>
        <input
          id="app-email"
          type="email"
          value={data.email}
          onChange={handleChange('email')}
          placeholder="请输入邮箱（选填）"
          className={inputClass('email')}
          disabled={status === 'loading'}
        />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
      </div>

      {/* 简历链接 */}
      <div>
        <label htmlFor="app-resume" className="mb-1.5 block text-sm font-medium text-ink-700">
          简历链接
        </label>
        <input
          id="app-resume"
          type="url"
          value={data.resumeUrl}
          onChange={handleChange('resumeUrl')}
          placeholder="请粘贴在线简历链接（选填）"
          className={inputClass('resumeUrl')}
          disabled={status === 'loading'}
        />
        {errors.resumeUrl && <p className="mt-1 text-xs text-red-500">{errors.resumeUrl}</p>}
      </div>

      {/* 求职说明 */}
      <div>
        <label htmlFor="app-cover" className="mb-1.5 block text-sm font-medium text-ink-700">
          求职说明
        </label>
        <textarea
          id="app-cover"
          value={data.coverLetter}
          onChange={handleChange('coverLetter')}
          placeholder="请简要介绍您的经历和优势..."
          rows={4}
          className={`${inputClass('coverLetter')} resize-none`}
          disabled={status === 'loading'}
        />
        <div className="mt-1 flex items-center justify-between">
          {errors.coverLetter ? (
            <p className="text-xs text-red-500">{errors.coverLetter}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-ink-400">{data.coverLetter.length}/2000</span>
        </div>
      </div>

      {/* 提交按钮 */}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-200 transition-all hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            投递中...
          </>
        ) : (
          <>
            <Send className="h-5 w-5" />
            提交投递
          </>
        )}
      </button>

      <p className="text-center text-xs text-ink-400">
        我们会在 3-5 个工作日内回复您的投递
      </p>
    </form>
  );
}
