'use client';

import { useState, useCallback } from 'react';
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FormData {
  name: string;
  phone: string;
  email: string;
  company: string;
  content: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  content?: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

const initialData: FormData = {
  name: '',
  phone: '',
  email: '',
  company: '',
  content: '',
};

// 前端表单校验
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

  if (!data.content.trim()) {
    errors.content = '留言内容不能为空';
  } else if (data.content.length > 2000) {
    errors.content = '留言内容不能超过 2000 个字符';
  }

  return errors;
}

export default function ContactForm() {
  const [data, setData] = useState<FormData>(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState('');

  const handleChange = useCallback(
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setData((prev) => ({ ...prev, [field]: value }));
      // 清除该字段的错误
      if (errors[field as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
      // 清除服务端错误
      if (serverError) setServerError('');
    },
    [errors, serverError],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 前端校验
    const validationErrors = validate(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setStatus('loading');
    setServerError('');

    try {
      // 使用同源 /api 代理，避免跨域/Mixed Content；由 next.config rewrites 转发到后端
      const contactUrl = process.env.NEXT_PUBLIC_API_BASE
        ? `${process.env.NEXT_PUBLIC_API_BASE.replace(/\/$/, '')}/contact`
        : '/api/contact';
      const res = await fetch(contactUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name.trim(),
          phone: data.phone.trim(),
          email: data.email.trim() || undefined,
          company: data.company.trim() || undefined,
          content: data.content.trim(),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        // 服务端校验错误
        if (result.code === 'VALIDATION_ERROR') {
          setServerError(result.message);
        } else {
          setServerError(result.message || '提交失败，请稍后重试');
        }
        setStatus('error');
        return;
      }

      // 提交成功
      setStatus('success');
      setData(initialData);
    } catch {
      setServerError('网络错误，请检查网络连接后重试');
      setStatus('error');
    }
  };

  // 成功状态显示
  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
        <h3 className="text-xl font-bold text-ink">提交成功</h3>
        <p className="mt-2 text-sm text-ink-500">
          感谢您的咨询，我们会尽快与您联系！
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-6 rounded-lg border border-ink-200 px-6 py-2.5 text-sm font-semibold text-ink-600 transition-colors hover:border-brand-300 hover:text-brand"
        >
          再次提交
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
      {/* 服务端错误提示 */}
      {status === 'error' && serverError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* 姓名 + 电话 */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink-700">
            姓名 <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={data.name}
            onChange={handleChange('name')}
            placeholder="请输入您的姓名"
            className={inputClass('name')}
            disabled={status === 'loading'}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name}</p>
          )}
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-ink-700">
            电话 <span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={handleChange('phone')}
            placeholder="请输入手机号码"
            className={inputClass('phone')}
            disabled={status === 'loading'}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
          )}
        </div>
      </div>

      {/* 邮箱 + 公司 */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-700">
            邮箱
          </label>
          <input
            id="email"
            type="email"
            value={data.email}
            onChange={handleChange('email')}
            placeholder="请输入邮箱（选填）"
            className={inputClass('email')}
            disabled={status === 'loading'}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
          )}
        </div>
        <div>
          <label htmlFor="company" className="mb-1.5 block text-sm font-medium text-ink-700">
            公司
          </label>
          <input
            id="company"
            type="text"
            value={data.company}
            onChange={handleChange('company')}
            placeholder="请输入公司名称（选填）"
            className="w-full rounded-lg border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-700 transition-colors placeholder:text-ink-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            disabled={status === 'loading'}
          />
        </div>
      </div>

      {/* 留言内容 */}
      <div>
        <label htmlFor="content" className="mb-1.5 block text-sm font-medium text-ink-700">
          留言内容 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          value={data.content}
          onChange={handleChange('content')}
          placeholder="请简要描述您的需求或问题..."
          rows={5}
          className={`${inputClass('content')} resize-none`}
          disabled={status === 'loading'}
        />
        <div className="mt-1 flex items-center justify-between">
          {errors.content ? (
            <p className="text-xs text-red-500">{errors.content}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-ink-400">{data.content.length}/2000</span>
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
            提交中...
          </>
        ) : (
          <>
            <Send className="h-5 w-5" />
            提交咨询
          </>
        )}
      </button>

      <p className="text-center text-xs text-ink-400">
        我们会在 1-2 个工作日内回复您的咨询
      </p>
    </form>
  );
}
