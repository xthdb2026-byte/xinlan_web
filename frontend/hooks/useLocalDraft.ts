'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * 本地暂存 Hook
 * - 在编辑过程中每 500ms 自动保存到 localStorage，防止刷新丢失
 * - 成功保存/取消时清除暂存
 * @param key   本地暂存 key，建议 "admin-draft-{module}-{id?}"
 * @param initial  初始值（新建为默认值，编辑时为后端数据）
 */
export function useLocalDraft<T extends object>(key: string, initial: T) {
  const storageKey = `xinlan-admin-draft:${key}`;

  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return initial;
      return { ...initial, ...JSON.parse(raw) } as T;
    } catch {
      return initial;
    }
  });

  // hasDraft 用 state 维护：防抖写盘/清除发生在渲染周期外，渲染期读 localStorage 会拿到过期值
  const [hasDraft, setHasDraft] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return !!localStorage.getItem(storageKey);
    } catch {
      return false;
    }
  });

  // 自动保存（防抖）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(value));
        setHasDraft(true);
      } catch {
        /* 忽略存储异常 */
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [value, storageKey]);

  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(storageKey);
      setHasDraft(false);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const resetTo = useCallback((v: T) => {
    clearDraft();
    setValue(v);
  }, [clearDraft]);

  // 始终持有最新 initial，reset 引用稳定但取值不陈旧
  const initialRef = useRef(initial);
  useEffect(() => {
    initialRef.current = initial;
  });

  const reset = useCallback(() => resetTo(initialRef.current), [resetTo]);

  return {
    value,
    setValue,
    /** 恢复为初始值并清除暂存 */
    reset,
    /** 清除暂存（在成功保存后调用） */
    clearDraft,
    /** 是否存在暂存草稿 */
    hasDraft,
  };
}

/**
 * 简单表单验证 Hook —— 基于 zod-like 校验函数或对象
 * 这里使用手写 rules 以减少额外依赖
 */
export type ValidationErrors<T> = Partial<Record<keyof T & string, string>>;
export type Validator<T> = (value: T) => ValidationErrors<T>;

export function useFormValidation<T extends object>(
  value: T,
  validator: Validator<T>,
) {
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // value / validator 用 ref 持有，避免内联对象/函数导致 effect 依赖每轮失效：
  // 否则 effect 每次渲染都触发 setErrors（新对象引用）→ 重渲染 → 依赖再失效 → 无限循环
  const valueRef = useRef(value);
  const validatorRef = useRef(validator);
  useEffect(() => {
    valueRef.current = value;
    validatorRef.current = validator;
  });

  // 浅比较错误对象，内容相同时返回 prev 保持引用稳定（避免无谓重渲染）
  const applyErrors = useCallback((next: ValidationErrors<T>) => {
    setErrors((prev) => {
      const prevKeys = Object.keys(prev) as Array<keyof T & string>;
      const nextKeys = Object.keys(next) as Array<keyof T & string>;
      if (
        prevKeys.length === nextKeys.length &&
        nextKeys.every((k) => prev[k] === next[k])
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  // 值变化时，已触碰字段做实时校验（依赖不含 validator，已用 ref 解耦）
  useEffect(() => {
    const all = validatorRef.current(value);
    const filtered: ValidationErrors<T> = {};
    for (const k of Object.keys(all) as Array<keyof T & string>) {
      if (touched[k]) filtered[k] = all[k];
    }
    applyErrors(filtered);
  }, [value, touched, applyErrors]);

  const validateAll = useCallback((): ValidationErrors<T> => {
    const all = validatorRef.current(valueRef.current);
    setErrors(all);
    // 标记所有有错误的字段为 touched
    setTouched((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(all) as Array<keyof T & string>) {
        next[k] = true;
      }
      return next;
    });
    return all;
  }, []);

  const markTouched = useCallback((field: keyof T & string) => {
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }));
  }, []);

  const reset = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  const isValid = Object.keys(errors).length === 0;

  return { errors, touched, markTouched, validateAll, reset, isValid };
}

/**
 * 将 onChange 应用到对象字段（避免每处写 spread）
 */
export function createOnFieldChange<T extends object>(
  setter: React.Dispatch<React.SetStateAction<T>>,
  markTouched?: (field: keyof T & string) => void,
) {
  return <K extends keyof T & string>(
    field: K,
  ) =>
  (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    markTouched?.(field);
    const raw = e.target.value;
    setter((prev) => ({ ...prev, [field]: raw }) as T);
  };
}
