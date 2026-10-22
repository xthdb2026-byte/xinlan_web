import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SolutionCard from '@/components/solutions/SolutionCard';
import SolutionFilter from '@/components/solutions/SolutionFilter';
import type { SolutionItem } from '@/lib/types';

// 覆盖 next/navigation mock，以便测试 URL 参数同步
const mockPush = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/solutions',
}));

const mockSolution: SolutionItem = {
  id: 1,
  title: '政企车辆管理解决方案',
  slug: 'enterprise-vehicle-management',
  industry: '政府机关',
  content: '为政府机关和企事业单位提供专业的车辆管理解决方案',
  coverImage: '/images/car_mockup_deep_blue.png',
  sortOrder: 1,
};

const enc = (s: string) => encodeURIComponent(s);

describe('SolutionCard 组件', () => {
  it('应渲染封面图、行业标签、标题和摘要', () => {
    render(<SolutionCard solution={mockSolution} />);

    expect(screen.getByText('政企车辆管理解决方案')).toBeInTheDocument();
    expect(screen.getByText('政府机关')).toBeInTheDocument();
    expect(
      screen.getByText('为政府机关和企事业单位提供专业的车辆管理解决方案'),
    ).toBeInTheDocument();
  });

  it('封面图应使用方案标题作为 alt', () => {
    render(<SolutionCard solution={mockSolution} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', '政企车辆管理解决方案');
  });

  it('封面图应使用正确的 src', () => {
    render(<SolutionCard solution={mockSolution} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/images/car_mockup_deep_blue.png');
  });

  it('卡片应链接到 /solutions/:slug', () => {
    render(<SolutionCard solution={mockSolution} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/solutions/enterprise-vehicle-management');
  });

  it('应渲染"了解详情"文字', () => {
    render(<SolutionCard solution={mockSolution} />);
    expect(screen.getByText('了解详情')).toBeInTheDocument();
  });

  it('行业标签应为蓝色文字', () => {
    render(<SolutionCard solution={mockSolution} />);
    const tag = screen.getByText('政府机关');
    expect(tag).toHaveClass('text-brand');
  });

  it('卡片应有 hover 上移效果', () => {
    render(<SolutionCard solution={mockSolution} />);
    const link = screen.getByRole('link');
    expect(link).toHaveClass('hover:-translate-y-1', 'hover:shadow-xl');
  });

  it('无封面图时不应渲染 img', () => {
    render(<SolutionCard solution={{ ...mockSolution, coverImage: null }} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('SolutionFilter 组件', () => {
  const industries = ['政府机关', '物流运输'];

  beforeEach(() => {
    mockPush.mockClear();
    mockSearchParams = new URLSearchParams();
  });

  it('应渲染"全部方案"按钮', () => {
    render(<SolutionFilter industries={industries} total={2} />);
    expect(screen.getByText('全部方案')).toBeInTheDocument();
  });

  it('应渲染所有行业筛选按钮', () => {
    render(<SolutionFilter industries={industries} total={2} />);
    expect(screen.getByText('政府机关')).toBeInTheDocument();
    expect(screen.getByText('物流运输')).toBeInTheDocument();
  });

  it('应显示结果总数', () => {
    render(<SolutionFilter industries={industries} total={2} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/个解决方案/)).toBeInTheDocument();
  });

  it('无选中时"全部方案"应为选中态', () => {
    render(<SolutionFilter industries={industries} total={2} />);
    const allBtn = screen.getByText('全部方案');
    expect(allBtn).toHaveClass('bg-brand', 'text-white');
  });

  it('行业按钮为未选中态时应有 ring 样式', () => {
    render(<SolutionFilter industries={industries} total={2} />);
    const industryBtn = screen.getByText('政府机关');
    expect(industryBtn).toHaveClass('bg-white', 'text-ink-600');
  });

  it('点击行业按钮应调用 router.push 更新 URL', async () => {
    const user = userEvent.setup();
    render(<SolutionFilter industries={industries} total={2} />);

    await user.click(screen.getByText('政府机关'));
    expect(mockPush).toHaveBeenCalledWith(
      `/solutions?industry=${enc('政府机关')}`,
      { scroll: false },
    );
  });

  it('点击"全部方案"应清除 industry 参数', async () => {
    const user = userEvent.setup();
    mockSearchParams.set('industry', '政府机关');
    render(<SolutionFilter industries={industries} total={2} />);

    await user.click(screen.getByText('全部方案'));
    expect(mockPush).toHaveBeenCalledWith('/solutions', { scroll: false });
  });

  it('URL 含 industry 参数时对应按钮应为选中态', () => {
    mockSearchParams.set('industry', '物流运输');
    render(<SolutionFilter industries={industries} total={1} />);

    const buttons = screen.getAllByText('物流运输');
    const activeBtn = buttons.find((b) => b.tagName === 'BUTTON');
    expect(activeBtn).toHaveClass('bg-brand', 'text-white');

    const allBtn = screen.getByText('全部方案');
    expect(allBtn).not.toHaveClass('bg-brand');
  });

  it('选中行业时应显示行业名称', () => {
    mockSearchParams.set('industry', '政府机关');
    render(<SolutionFilter industries={industries} total={1} />);
    const spans = screen.getAllByText('政府机关');
    const labelSpan = spans.find((s) => s.tagName === 'SPAN' && s.classList.contains('text-brand'));
    expect(labelSpan).toBeTruthy();
  });
});
