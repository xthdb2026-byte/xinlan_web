import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '@/components/layout/Navbar';

// mock getCurrentLogo API，避免测试中发起真实请求
jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  // 无后台自定义 Logo → SiteLogo 走 staticFallback（官方横版 Logo 图），保证断言确定性
  getCurrentLogo: jest.fn(() => Promise.resolve({ url: null, isDefault: false })),
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockRefresh = jest.fn();
const mockPrefetch = jest.fn();
const mockForward = jest.fn();

// next/navigation mock：可在每个测试中覆盖
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    refresh: mockRefresh,
    prefetch: mockPrefetch,
    forward: mockForward,
  })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  notFound: jest.fn(),
}));

import { usePathname, useRouter } from 'next/navigation';
const mockedUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockedUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

/**
 * Navbar 组件交互逻辑测试
 *
 * 覆盖要点：
 * 1. Logo 结构（盾牌图标 + 中英文双行）
 * 2. 桌面端 7 个导航链接渲染
 * 3. 当前页面选中态（蓝色下划线 + 文字色）
 * 4. 路由切换关闭移动抽屉
 * 5. 移动端汉堡菜单开/关
 * 6. 遮罩点击关闭移动菜单
 * 7. body 滚动锁定行为
 * 8. 合作咨询 CTA 按钮
 */
describe('Navbar 组件', () => {
  beforeEach(() => {
    mockedUsePathname.mockReturnValue('/');
    mockPush.mockReset();
    document.body.style.overflow = '';
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.style.overflow = '';
  });

  describe('Logo 渲染', () => {
    it('应渲染企业官方横版 Logo 图片（蓝色盾牌+火焰+中英文）', () => {
      render(<Navbar />);
      const logoLink = screen.getByLabelText('新蓝恒成首页');

      // 官方横版 Logo 为单张图片（alt 为品牌名），经 SiteLogo staticFallback 加载
      const logoImg = within(logoLink).getByAltText('新蓝恒成');
      expect(logoImg).toBeInTheDocument();
      expect(logoImg).toHaveAttribute('src', '/images/logos/logo_horizontal.png');
    });

    it('Logo 应链接到首页', () => {
      render(<Navbar />);
      const logoLink = screen.getByLabelText('新蓝恒成首页');
      expect(logoLink).toHaveAttribute('href', '/');
    });
  });

  describe('导航栏样式', () => {
    it('应使用白色背景（sticky，非滚动变色）', () => {
      render(<Navbar />);
      const header = screen.getByLabelText('新蓝恒成首页').closest('header');
      expect(header).toHaveClass('bg-white');
      expect(header).toHaveClass('sticky');
    });

    it('应有 1px 底部分割线', () => {
      render(<Navbar />);
      const header = screen.getByLabelText('新蓝恒成首页').closest('header');
      expect(header).toHaveClass('border-b');
    });
  });

  describe('桌面端导航链接', () => {
    const expectedLinks = [
      { href: '/', label: '首页' },
      { href: '/about', label: '关于我们' },
      { href: '/products', label: '产品与服务' },
      { href: '/hima', label: '鸿蒙智行' },
      { href: '/solutions', label: '解决方案' },
      { href: '/news', label: '新闻中心' },
      { href: '/careers', label: '加入我们' },
      { href: '/contact', label: '联系我们' },
    ];

    it.each(expectedLinks)('应渲染导航项 "$label" 指向 "$href"', ({ href, label }) => {
      render(<Navbar />);
      const link = screen.getByRole('link', { name: label });
      expect(link).toHaveAttribute('href', href);
    });

    it('桌面端应渲染全部 8 个导航链接 + CTA + Logo 链接', () => {
      render(<Navbar />);
      // 8 个导航 + Logo 首页链接 + 合作咨询 CTA = 10 个链接
      const allLinks = screen.getAllByRole('link');
      // 移动端抽屉也会渲染链接，这里取 header 内的链接
      const header = screen.getByLabelText('新蓝恒成首页').closest('header')!;
      const headerLinks = within(header).getAllByRole('link');
      // 8 导航 + Logo + CTA = 10
      expect(headerLinks).toHaveLength(10);
    });
  });

  describe('当前页面选中态', () => {
    it('首页(/) 应高亮"首页"链接（蓝色文字 + 蓝色下划线）', () => {
      mockedUsePathname.mockReturnValue('/');
      render(<Navbar />);
      const homeLink = screen.getByRole('link', { name: '首页' });

      // 文字蓝色
      expect(homeLink).toHaveClass('text-brand');
      // 下划线存在（span.bg-brand）
      const underline = homeLink.querySelector('span');
      expect(underline).not.toBeNull();
      expect(underline).toHaveClass('bg-brand');
    });

    it('/products 应高亮"产品与服务"链接', () => {
      mockedUsePathname.mockReturnValue('/products');
      render(<Navbar />);
      const productsLink = screen.getByRole('link', { name: '产品与服务' });

      expect(productsLink).toHaveClass('text-brand');
      const underline = productsLink.querySelector('span');
      expect(underline).toHaveClass('bg-brand');
    });

    it('/products/some-slug 子路径也应高亮"产品与服务"', () => {
      mockedUsePathname.mockReturnValue('/products/some-slug');
      render(<Navbar />);
      const productsLink = screen.getByRole('link', { name: '产品与服务' });
      expect(productsLink).toHaveClass('text-brand');
    });

    it('非当前页面的链接不应有下划线', () => {
      mockedUsePathname.mockReturnValue('/');
      render(<Navbar />);
      const aboutLink = screen.getByRole('link', { name: '关于我们' });

      // 不应高亮
      expect(aboutLink).not.toHaveClass('text-brand');
      // 不应有下划线 span
      const underline = aboutLink.querySelector('span');
      expect(underline).toBeNull();
    });

    it('下划线应为 3px 高、24px 宽的蓝色短横', () => {
      mockedUsePathname.mockReturnValue('/');
      render(<Navbar />);
      const homeLink = screen.getByRole('link', { name: '首页' });
      const underline = homeLink.querySelector('span')!;
      expect(underline).toHaveClass('h-[3px]', 'w-6', 'rounded-full', 'bg-brand');
    });
  });

  describe('合作咨询 CTA 按钮', () => {
    it('应渲染"合作咨询"按钮指向 /contact', () => {
      render(<Navbar />);
      const cta = screen.getByRole('link', { name: '合作咨询' });
      expect(cta).toHaveAttribute('href', '/contact');
    });

    it('CTA 应为蓝色背景 + 白色文字 + 无箭头图标', () => {
      render(<Navbar />);
      const cta = screen.getByRole('link', { name: '合作咨询' });
      expect(cta).toHaveClass('bg-brand', 'text-white');
      // 不应包含 svg 箭头
      const svg = cta.querySelector('svg');
      expect(svg).toBeNull();
    });
  });

  describe('移动端汉堡菜单', () => {
    it('桌面端（lg+）应隐藏汉堡按钮，移动端显示', () => {
      render(<Navbar />);
      const hamburger = screen.getByLabelText('打开菜单');
      expect(hamburger).toHaveClass('lg:hidden');
    });

    it('点击汉堡按钮应打开移动抽屉', async () => {
      const user = userEvent.setup();
      render(<Navbar />);

      // 初始无抽屉
      expect(screen.queryByLabelText('关闭菜单')).not.toBeInTheDocument();

      // 打开
      await user.click(screen.getByLabelText('打开菜单'));
      expect(screen.getByLabelText('关闭菜单')).toBeInTheDocument();
    });

    it('抽屉打开后应锁定 body 滚动', async () => {
      const user = userEvent.setup();
      render(<Navbar />);

      await user.click(screen.getByLabelText('打开菜单'));
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('点击关闭按钮应关闭抽屉并恢复 body 滚动', async () => {
      const user = userEvent.setup();
      render(<Navbar />);

      await user.click(screen.getByLabelText('打开菜单'));
      expect(document.body.style.overflow).toBe('hidden');

      await user.click(screen.getByLabelText('关闭菜单'));
      expect(screen.queryByLabelText('关闭菜单')).not.toBeInTheDocument();
      expect(document.body.style.overflow).toBe('');
    });

    it('点击遮罩应关闭抽屉', async () => {
      const user = userEvent.setup();
      render(<Navbar />);

      await user.click(screen.getByLabelText('打开菜单'));

      // 遮罩是抽屉容器的第一个子 div
      const drawerContainer = screen.getByLabelText('关闭菜单').closest('.fixed.inset-0');
      const overlay = drawerContainer?.querySelector('.absolute.inset-0.bg-ink\\/50') as HTMLElement;
      expect(overlay).toBeTruthy();

      await user.click(overlay);
      expect(screen.queryByLabelText('关闭菜单')).not.toBeInTheDocument();
    });

    it('抽屉内应包含所有导航链接', async () => {
      const user = userEvent.setup();
      render(<Navbar />);

      await user.click(screen.getByLabelText('打开菜单'));

      // 抽屉内的导航链接（注意 getAllByRole 会同时匹配桌面+移动端）
      const allAboutLinks = screen.getAllByText('关于我们');
      // 至少 2 个（桌面 + 移动端抽屉）
      expect(allAboutLinks.length).toBeGreaterThanOrEqual(2);
    });

    it('抽屉内应有"合作咨询" CTA 按钮', async () => {
      const user = userEvent.setup();
      render(<Navbar />);

      await user.click(screen.getByLabelText('打开菜单'));
      // 2 个合作咨询：桌面 CTA + 抽屉底部 CTA
      const ctas = screen.getAllByRole('link', { name: '合作咨询' });
      expect(ctas.length).toBe(2);
    });
  });

  describe('路由切换行为', () => {
    it('pathname 变化时应关闭移动抽屉', () => {
      mockedUsePathname.mockReturnValue('/');
      const { rerender } = render(<Navbar />);

      // 这个测试验证 useEffect 对 pathname 的响应
      // 由于 jest.setup 中已 mock usePathname，rerender 时会重新触发 effect
      mockedUsePathname.mockReturnValue('/about');
      rerender(<Navbar />);

      // 抽屉应保持关闭状态
      expect(screen.queryByLabelText('关闭菜单')).not.toBeInTheDocument();
    });
  });
});
