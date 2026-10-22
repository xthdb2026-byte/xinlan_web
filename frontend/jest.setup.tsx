import '@testing-library/jest-dom';

// next/navigation 的 usePathname/useRouter 在 jsdom 环境下需要 mock
// 注意：next/jest 可能已自动 mock 部分 API，这里用 requireActual 合并补充
jest.mock('next/navigation', () => {
  const actual = jest.requireActual('next/navigation');
  return {
    ...actual,
    usePathname: jest.fn(() => '/'),
    useRouter: jest.fn(() => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
      forward: jest.fn(),
    })),
    useSearchParams: jest.fn(() => new URLSearchParams()),
    notFound: jest.fn(),
  };
});

// next/image 在 jsdom 环境下渲染为普通 img
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// next/link 渲染为普通 a 标签，便于测试 href
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// 滚动事件 mock
Object.defineProperty(window, 'scrollY', {
  writable: true,
  value: 0,
});

// matchMedia mock（组件可能用到）
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});

// IntersectionObserver mock
class MockIntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn();
  root = null;
  rootMargin = '';
  thresholds = [];
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});
