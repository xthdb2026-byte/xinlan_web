import { renderHook, act } from '@testing-library/react';
import {
  useLocalDraft,
  useFormValidation,
  createOnFieldChange,
  ValidationErrors,
} from '@/hooks/useLocalDraft';

// ============================================================================
// 工具：延迟工具（fakeTimers 配合下使用）
// ============================================================================
const flushTimers = (ms: number) => {
  jest.advanceTimersByTime(ms);
};

// ============================================================================
// useLocalDraft 单元测试
// ============================================================================
describe('useLocalDraft', () => {
  const storageKey = 'xinlan-admin-draft:test-form-1';
  const initialValue = { title: '', summary: '', status: 'draft' };

  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    // 用 act 包裹，避免防抖 timer 内 setState 触发 "not wrapped in act" 警告
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    localStorage.clear();
  });

  // ---------- 1. 初始化：无草稿时返回 initial ----------
  it('1. 无 localStorage 草稿时，初始 value 等于 initial', () => {
    const { result } = renderHook(() => useLocalDraft('test-form-1', initialValue));

    expect(result.current.value).toEqual(initialValue);
    expect(result.current.hasDraft).toBe(false);
  });

  // ---------- 2. 初始化：已有草稿时自动恢复 ----------
  it('2. localStorage 已有草稿时，初始 value 自动合并草稿内容', () => {
    const draft = { title: '已暂存的标题', summary: '已暂存的摘要' };
    localStorage.setItem(storageKey, JSON.stringify(draft));

    const { result } = renderHook(() => useLocalDraft('test-form-1', initialValue));

    expect(result.current.value).toEqual({
      title: '已暂存的标题',
      summary: '已暂存的摘要',
      status: 'draft', // 草稿没有的字段保持 initial
    });
    expect(result.current.hasDraft).toBe(true);
  });

  // ---------- 3. localStorage 数据损坏时兜底 ----------
  it('3. localStorage 数据非 JSON 时，回退到 initial 且不抛错', () => {
    localStorage.setItem(storageKey, 'not-valid-json{{{');

    const { result } = renderHook(() => useLocalDraft('test-form-1', initialValue));

    expect(result.current.value).toEqual(initialValue);
    // 损坏数据仍可读到 → hasDraft 为 true（保守策略）
    expect(result.current.hasDraft).toBe(true);
  });

  // ---------- 4. setValue 触发 500ms 防抖存盘 ----------
  it('4. setValue 后 500ms 自动存盘到 localStorage（防抖）', () => {
    const { result } = renderHook(() => useLocalDraft('test-form-1', initialValue));

    // 第 1 次 setValue
    act(() => {
      result.current.setValue({ title: '新标题', summary: '', status: 'draft' });
    });

    // 100ms 后再 setValue（连续输入场景，应重置 500ms 计时器）
    act(() => {
      jest.advanceTimersByTime(100);
      result.current.setValue({ title: '新标题2', summary: '', status: 'draft' });
    });

    // 再过 500ms（距第 2 次 setValue 满 500ms）→ 防抖触发，写盘
    act(() => {
      jest.advanceTimersByTime(500);
    });

    const stored = JSON.parse(localStorage.getItem(storageKey)!);
    expect(stored).toEqual({ title: '新标题2', summary: '', status: 'draft' });
    expect(result.current.hasDraft).toBe(true);
  });

  // ---------- 5. 500ms 未到时 setValue 不会立刻写盘 ----------
  it('5. setValue 后未达 500ms 时 localStorage 暂不更新', () => {
    const { result } = renderHook(() => useLocalDraft('test-form-1', initialValue));

    act(() => {
      result.current.setValue({ title: 'abc', summary: '', status: 'draft' });
      flushTimers(200); // 只过了 200ms
    });

    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  // ---------- 6. clearDraft 清除 localStorage 与 hasDraft ----------
  it('6. clearDraft 清除 localStorage 并将 hasDraft 置为 false', () => {
    const { result } = renderHook(() => useLocalDraft('test-form-1', initialValue));

    // 先制造一份草稿
    act(() => {
      result.current.setValue({ title: 'temp', summary: '', status: 'draft' });
      flushTimers(600); // 等待写盘
    });
    expect(result.current.hasDraft).toBe(true);

    // 清除
    act(() => {
      result.current.clearDraft();
    });

    expect(localStorage.getItem(storageKey)).toBeNull();
    expect(result.current.hasDraft).toBe(false);
    // clearDraft 不影响当前编辑 value
    expect(result.current.value).toEqual({ title: 'temp', summary: '', status: 'draft' });
  });

  // ---------- 7. reset 恢复 initial 并清除草稿 ----------
  it('7. reset 恢复 value 为 initial 并清除 localStorage 草稿', () => {
    const { result } = renderHook(() => useLocalDraft('test-form-1', initialValue));

    // 修改值并等待写盘
    act(() => {
      result.current.setValue({ title: '修改过的', summary: 'xx', status: 'draft' });
      flushTimers(600);
    });
    expect(result.current.hasDraft).toBe(true);

    // reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.value).toEqual(initialValue);
    expect(result.current.hasDraft).toBe(false);
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  // ---------- 8. reset 始终使用最新 initial（regression：避免闭包陈旧） ----------
  it('8. reset 使用 rerender 后最新的 initial，而非首渲染时的旧 initial', () => {
    let externalInitial = { ...initialValue };
    const { result, rerender } = renderHook(
      ({ initial }) => useLocalDraft('test-form-1', initial),
      { initialProps: { initial: externalInitial } },
    );

    // 模拟父组件把 initial 换成新对象（实际业务中可能因列表重新拉取而变化）
    externalInitial = { title: 'NEW-INIT', summary: '', status: 'published' };
    rerender({ initial: externalInitial });

    // 修改 value
    act(() => {
      result.current.setValue({ title: '用户改的', summary: '', status: 'draft' });
      flushTimers(600);
    });

    // reset 应使用最新 initial（而不是渲染 hook 第一次拿到的 initial）
    act(() => {
      result.current.reset();
    });

    expect(result.current.value).toEqual(externalInitial);
    expect(result.current.value.title).toBe('NEW-INIT');
  });

  // ---------- 9. reset / clearDraft / hasDraft 引用稳定（性能优化回归） ----------
  it('9. reset / clearDraft 引用跨渲染稳定（React.memo 友好）', () => {
    const { result, rerender } = renderHook(
      ({ initial }) => useLocalDraft('test-form-1', initial),
      { initialProps: { initial: initialValue } },
    );

    const firstReset = result.current.reset;
    const firstClear = result.current.clearDraft;

    // 重新渲染（initial 内容相同，但对象引用可以不同）
    rerender({ initial: { ...initialValue } });

    expect(result.current.reset).toBe(firstReset);
    expect(result.current.clearDraft).toBe(firstClear);
  });

  // ---------- 10. key 变化时使用新的 storageKey ----------
  it('10. key 不同时使用独立的 localStorage 项', () => {
    const keyA = 'form-A';
    const keyB = 'form-B';
    const storageKeyA = `xinlan-admin-draft:${keyA}`;
    const storageKeyB = `xinlan-admin-draft:${keyB}`;

    // 单独测试 hook A（在它自己的 renderHook 中）
    const hookA = renderHook(() => useLocalDraft(keyA, initialValue));
    act(() => {
      hookA.result.current.setValue({ title: 'A', summary: '', status: 'draft' });
    });
    act(() => {
      jest.advanceTimersByTime(600);
    });
    expect(JSON.parse(localStorage.getItem(storageKeyA)!).title).toBe('A');
    hookA.unmount();

    // hookB 单独 mount
    const hookB = renderHook(() => useLocalDraft(keyB, initialValue));
    act(() => {
      hookB.result.current.setValue({ title: 'B', summary: '', status: 'draft' });
    });
    act(() => {
      jest.advanceTimersByTime(600);
    });
    expect(JSON.parse(localStorage.getItem(storageKeyB)!).title).toBe('B');

    // 互不影响
    expect(JSON.parse(localStorage.getItem(storageKeyA)!).title).toBe('A');
    expect(JSON.parse(localStorage.getItem(storageKeyB)!).title).toBe('B');
  });
});

// ============================================================================
// useFormValidation 单元测试
// ============================================================================
describe('useFormValidation', () => {
  interface FormData {
    title: string;
    slug: string;
  }

  const validator = (v: FormData): ValidationErrors<FormData> => {
    const e: ValidationErrors<FormData> = {};
    if (!v.title.trim()) e.title = '标题不能为空';
    if (!v.slug.trim()) e.slug = 'Slug 不能为空';
    return e;
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ---------- 1. 初始 errors 为空，未 touched 时不显示错误 ----------
  it('1. 初始 errors 为空（未 touched 字段的错误不显示）', () => {
    const { result } = renderHook(() =>
      useFormValidation<FormData>({ title: '', slug: '' }, validator),
    );

    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isValid).toBe(true);
  });

  // ---------- 2. markTouched 后对应字段错误显示 ----------
  it('2. markTouched("title") 后，title 错误显示，slug 错误仍隐藏', () => {
    const { result } = renderHook(() =>
      useFormValidation<FormData>({ title: '', slug: '' }, validator),
    );

    act(() => {
      result.current.markTouched('title');
    });

    expect(result.current.errors).toEqual({ title: '标题不能为空' });
    expect(result.current.touched).toEqual({ title: true });
  });

  // ---------- 3. value 变化时 touched 字段实时重校验 ----------
  it('3. value 变化后，已 touched 字段的错误实时更新', () => {
    // 用可控的 state 容器模拟 value 变化
    const initial = { title: '', slug: '' };
    const { result, rerender } = renderHook(
      ({ value }) => useFormValidation<FormData>(value, validator),
      { initialProps: { value: initial } },
    );

    act(() => {
      result.current.markTouched('title');
    });
    expect(result.current.errors.title).toBe('标题不能为空');

    // 用户输入标题后错误消失
    rerender({ value: { title: 'ok', slug: '' } });
    expect(result.current.errors).toEqual({}); // title 不再有错误
  });

  // ---------- 4. validateAll 返回所有错误并标记 touched ----------
  it('4. validateAll 返回全部错误对象并标记所有字段 touched', () => {
    const { result } = renderHook(() =>
      useFormValidation<FormData>({ title: '', slug: '' }, validator),
    );

    let all: ValidationErrors<FormData> | undefined;
    act(() => {
      all = result.current.validateAll();
    });

    expect(all).toEqual({ title: '标题不能为空', slug: 'Slug 不能为空' });
    expect(result.current.errors).toEqual(all);
    expect(result.current.touched).toEqual({ title: true, slug: true });
    expect(result.current.isValid).toBe(false);
  });

  // ---------- 5. validateAll 数据合法时返回空对象 ----------
  it('5. validateAll 数据合法时返回空对象', () => {
    const { result } = renderHook(() =>
      useFormValidation<FormData>({ title: 'hello', slug: 'ok-slug' }, validator),
    );

    let all: ValidationErrors<FormData> | undefined;
    act(() => {
      all = result.current.validateAll();
    });

    expect(all).toEqual({});
    expect(result.current.errors).toEqual({});
    expect(result.current.isValid).toBe(true);
  });

  // ---------- 6. reset 清空 errors 与 touched ----------
  it('6. reset 清空 errors 与 touched', () => {
    const { result } = renderHook(() =>
      useFormValidation<FormData>({ title: '', slug: '' }, validator),
    );

    act(() => {
      result.current.markTouched('title');
    });
    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);

    act(() => {
      result.current.reset();
    });

    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isValid).toBe(true);
  });

  // ---------- 7. 重复 markTouched 同字段不触发额外 setState（幂等） ----------
  it('7. 重复 markTouched 同字段时引用稳定，避免多余重渲染', () => {
    const { result } = renderHook(() =>
      useFormValidation<FormData>({ title: '', slug: '' }, validator),
    );

    act(() => {
      result.current.markTouched('title');
    });
    const firstTouched = result.current.touched;

    // 重复 markTouched 同字段 → setTouched 返回原对象
    act(() => {
      result.current.markTouched('title');
    });
    expect(result.current.touched).toBe(firstTouched); // 引用相等
  });

  // ---------- 8. errors 内容相同时不触发额外 setState（性能回归） ----------
  it('8. value 相同字段重复 setValue 时 errors 引用不变化', () => {
    const initial = { title: '', slug: '' };
    const { result, rerender } = renderHook(
      ({ value }) => useFormValidation<FormData>(value, validator),
      { initialProps: { value: initial } },
    );

    act(() => {
      result.current.markTouched('title');
    });
    expect(result.current.errors.title).toBe('标题不能为空');
    const firstErrors = result.current.errors;

    // 重新传同样的 value（对象引用不同，但内容相同）
    rerender({ value: { title: '', slug: '' } });

    // errors 内容没变，应返回 prev（引用相等）
    expect(result.current.errors).toBe(firstErrors);
  });

  // ---------- 9. validator 引用变化时不会触发 useEffect 无限循环 ----------
  it('9. validator 每次 render 重建时，不会引发 useEffect 反复触发 setErrors（无 Maximum update depth 错误）', () => {
    // 模拟 4 个 Editor 的写法：每次 render 都新建 validator
    // 关键回归点：useEffect 的依赖只有 [value, touched]，validator 已用 useRef 解耦，
    // 因此 rerender 不会反复 setErrors → 不会引发无限循环 / Maximum update depth 报错
    let renderCount = 0;
    const spyValidator = jest.fn((v: FormData): ValidationErrors<FormData> => validator(v));

    const { result, rerender } = renderHook(() => {
      renderCount++;
      return useFormValidation<FormData>({ title: '', slug: '' }, spyValidator);
    });

    const renderCountAfterMount = renderCount;
    const validatorCallsAfterMount = spyValidator.mock.calls.length;
    expect(renderCountAfterMount).toBeGreaterThan(0);
    expect(validatorCallsAfterMount).toBeGreaterThan(0);

    // 多次 rerender —— 若 useEffect 反复触发 setErrors，会引发组件 render 次数无限增长
    // 在 Jest 中会立即陷入死循环或抛 Maximum update depth exceeded；这里通过固定 rerender 次数
    // 并断言组件渲染次数没异常暴涨，间接证明 useEffect 没有自循环触发 setState
    for (let i = 0; i < 5; i++) {
      rerender();
    }

    // 5 次 rerender 后组件 render 次数 = 初始 mount + 5 = 6（React 18 默认 +1 StrictMode 双调用可能再多一倍）
    // 关键：render 次数不应随 rerender 次数指数级增长（如果有循环，render 数会呈指数级）
    expect(renderCount).toBeLessThan(20); // 严格上限，远超此值说明出现无限循环

    // markTouched 触发 touched 变化 → useEffect 应触发一次（验证 effect 还能正常工作）
    const validatorCallsBeforeTouch = spyValidator.mock.calls.length;
    act(() => {
      result.current.markTouched('title');
    });
    expect(spyValidator.mock.calls.length).toBeGreaterThan(validatorCallsBeforeTouch);
  });

  // ---------- 10. markTouched / validateAll / reset 引用稳定 ----------
  it('10. markTouched / validateAll / reset 跨渲染引用稳定', () => {
    const { result, rerender } = renderHook(() =>
      useFormValidation<FormData>({ title: '', slug: '' }, validator),
    );

    const first = {
      markTouched: result.current.markTouched,
      validateAll: result.current.validateAll,
      reset: result.current.reset,
    };

    rerender();

    expect(result.current.markTouched).toBe(first.markTouched);
    expect(result.current.validateAll).toBe(first.validateAll);
    expect(result.current.reset).toBe(first.reset);
  });
});

// ============================================================================
// createOnFieldChange 单元测试
// ============================================================================
describe('createOnFieldChange', () => {
  interface FormData {
    title: string;
    count: number;
  }

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('1. 触发 onChange 后调用 setter 更新对应字段', () => {
    const setValue = jest.fn((updater: React.SetStateAction<FormData>) => {
      const updated = typeof updater === 'function' ? updater({ title: '', count: 0 }) : updater;
      expect(updated).toEqual({ title: 'new-title', count: 0 });
    });
    const markTouched = jest.fn();

    const onField = createOnFieldChange<FormData>(setValue, markTouched);
    const handler = onField('title');

    handler({
      target: { value: 'new-title' },
    } as React.ChangeEvent<HTMLInputElement>);

    expect(setValue).toHaveBeenCalledTimes(1);
    expect(markTouched).toHaveBeenCalledWith('title');
  });

  it('2. 未传 markTouched 时不报错', () => {
    const setValue = jest.fn();
    const onField = createOnFieldChange<FormData>(setValue);
    const handler = onField('title');

    expect(() =>
      handler({ target: { value: 'x' } } as React.ChangeEvent<HTMLInputElement>),
    ).not.toThrow();
    expect(setValue).toHaveBeenCalledTimes(1);
  });

  it('3. 保留 prev 其他字段（spread）', () => {
    let captured: FormData | null = null;
    const setValue = jest.fn((updater: React.SetStateAction<FormData>) => {
      captured = typeof updater === 'function' ? updater({ title: 'old', count: 42 }) : updater;
    });
    const onField = createOnFieldChange<FormData>(setValue);
    onField('title')({ target: { value: 'new' } } as React.ChangeEvent<HTMLInputElement>);

    expect(captured).toEqual({ title: 'new', count: 42 });
  });
});
