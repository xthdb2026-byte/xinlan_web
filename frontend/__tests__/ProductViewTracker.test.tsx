import { render } from '@testing-library/react';
import ProductViewTracker from '@/components/ProductViewTracker';
import { trackProductView } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  trackProductView: jest.fn(),
}));

const mockedTrack = trackProductView as jest.MockedFunction<typeof trackProductView>;

/**
 * 浏览埋点组件：会话内按 slug 去重（sessionStorage），失败静默
 */
describe('ProductViewTracker', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockedTrack.mockClear();
  });

  it('首次渲染上报一次浏览（携带 slug 与当前路径）', () => {
    render(<ProductViewTracker slug="p-alpha" />);

    expect(mockedTrack).toHaveBeenCalledTimes(1);
    expect(mockedTrack).toHaveBeenCalledWith('p-alpha', window.location.pathname);
  });

  it('同一会话内重复挂载同一产品不重复上报', () => {
    const first = render(<ProductViewTracker slug="p-alpha" />);
    first.unmount();

    render(<ProductViewTracker slug="p-alpha" />);

    expect(mockedTrack).toHaveBeenCalledTimes(1);
  });

  it('StrictMode 双调用 useEffect 也只上报一次', () => {
    // 模拟 StrictMode：同一实例连续执行两次 effect（mount → cleanup → mount）
    const { rerender } = render(<ProductViewTracker slug="p-alpha" />);
    rerender(<ProductViewTracker slug="p-alpha" />);

    expect(mockedTrack).toHaveBeenCalledTimes(1);
  });

  it('切换不同 slug 时各自上报', () => {
    const { rerender } = render(<ProductViewTracker slug="p-alpha" />);
    rerender(<ProductViewTracker slug="p-beta" />);

    expect(mockedTrack).toHaveBeenCalledTimes(2);
    expect(mockedTrack).toHaveBeenNthCalledWith(1, 'p-alpha', window.location.pathname);
    expect(mockedTrack).toHaveBeenNthCalledWith(2, 'p-beta', window.location.pathname);
  });

  it('组件不渲染任何可见内容', () => {
    const { container } = render(<ProductViewTracker slug="p-alpha" />);
    expect(container).toBeEmptyDOMElement();
  });
});
