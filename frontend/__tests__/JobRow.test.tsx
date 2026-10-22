import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JobRow, { formatJobType } from '@/components/careers/JobRow';
import JobFilter from '@/components/careers/JobFilter';
import CultureSection from '@/components/careers/CultureSection';
import type { JobItem } from '@/lib/types';

// 覆盖 next/navigation mock
const mockPush = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/careers',
}));

const enc = (s: string) => encodeURIComponent(s);

const mockJob: JobItem = {
  id: 1,
  title: '高级前端工程师',
  department: '研发部',
  location: '长沙',
  type: 'full-time',
  description: '负责公司产品前端开发。',
  requirements: '1. 3年以上前端开发经验\n2. 精通 React/TypeScript',
  status: 'open',
  createdAt: '2026-08-11T00:00:00.000Z',
  updatedAt: '2026-08-11T00:00:00.000Z',
};

describe('formatJobType 函数', () => {
  it('应将 full-time 映射为 全职', () => {
    expect(formatJobType('full-time')).toBe('全职');
  });

  it('应将 part-time 映射为 兼职', () => {
    expect(formatJobType('part-time')).toBe('兼职');
  });

  it('应将 intern 映射为 实习', () => {
    expect(formatJobType('intern')).toBe('实习');
  });

  it('未知类型应返回原值', () => {
    expect(formatJobType('contract')).toBe('contract');
  });
});

describe('JobRow 组件', () => {
  it('应渲染职位标题', () => {
    render(<JobRow job={mockJob} />);
    // 标题同时出现在桌面端 span 和移动端 h3 中
    const titles = screen.getAllByText('高级前端工程师');
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });

  it('应渲染部门、地点和类型', () => {
    render(<JobRow job={mockJob} />);
    // 这些字段同时出现在桌面端和移动端布局中
    expect(screen.getAllByText('研发部').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('长沙').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('全职').length).toBeGreaterThanOrEqual(1);
  });

  it('应将 type=full-time 映射为"全职"', () => {
    render(<JobRow job={mockJob} />);
    expect(screen.getAllByText('全职').length).toBeGreaterThanOrEqual(1);
  });

  it('应渲染"查看详情"文字', () => {
    render(<JobRow job={mockJob} />);
    const detailLinks = screen.getAllByText('查看详情');
    expect(detailLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('应链接到 /careers/:id', () => {
    render(<JobRow job={mockJob} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/careers/1');
  });

  it('应有 hover 背景变色效果', () => {
    render(<JobRow job={mockJob} />);
    const link = screen.getByRole('link');
    expect(link).toHaveClass('hover:bg-ink-50');
  });

  it('type=intern 应映射为"实习"', () => {
    render(<JobRow job={{ ...mockJob, type: 'intern', title: '前端开发实习生' }} />);
    expect(screen.getAllByText('实习').length).toBeGreaterThanOrEqual(1);
  });

  it('桌面端应隐藏移动端布局', () => {
    render(<JobRow job={mockJob} />);
    // 桌面端布局有 hidden sm:flex
    const desktopLayout = document.querySelector('.hidden.sm\\:flex');
    expect(desktopLayout).toBeTruthy();
  });

  it('移动端应隐藏桌面端布局', () => {
    const { container } = render(<JobRow job={mockJob} />);
    const mobileLayout = container.querySelector('.sm\\:hidden');
    expect(mobileLayout).toBeTruthy();
  });
});

describe('JobFilter 组件', () => {
  const departments = ['研发部', '安全部'];
  const types = ['full-time', 'intern'];

  beforeEach(() => {
    mockPush.mockClear();
    mockSearchParams = new URLSearchParams();
  });

  it('应渲染"部门"和"类型"两个筛选区', () => {
    render(<JobFilter departments={departments} types={types} total={4} />);
    expect(screen.getByText('部门')).toBeInTheDocument();
    expect(screen.getByText('类型')).toBeInTheDocument();
  });

  it('应渲染所有部门筛选按钮', () => {
    render(<JobFilter departments={departments} types={types} total={4} />);
    expect(screen.getAllByText('全部').length).toBe(2); // 部门和类型各一个
    expect(screen.getByText('研发部')).toBeInTheDocument();
    expect(screen.getByText('安全部')).toBeInTheDocument();
  });

  it('应将 type 映射为中文展示', () => {
    render(<JobFilter departments={departments} types={types} total={4} />);
    expect(screen.getByText('全职')).toBeInTheDocument();
    expect(screen.getByText('实习')).toBeInTheDocument();
  });

  it('应显示结果总数', () => {
    render(<JobFilter departments={departments} types={types} total={4} />);
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText(/个职位/)).toBeInTheDocument();
  });

  it('无选中时两个"全部"按钮均为选中态', () => {
    render(<JobFilter departments={departments} types={types} total={4} />);
    const allBtns = screen.getAllByText('全部');
    allBtns.forEach((btn) => {
      expect(btn).toHaveClass('bg-brand', 'text-white');
    });
  });

  it('点击部门按钮应更新 URL', async () => {
    const user = userEvent.setup();
    render(<JobFilter departments={departments} types={types} total={2} />);

    await user.click(screen.getByText('研发部'));
    expect(mockPush).toHaveBeenCalledWith(
      `/careers?department=${enc('研发部')}`,
      { scroll: false },
    );
  });

  it('点击类型按钮应更新 URL', async () => {
    const user = userEvent.setup();
    render(<JobFilter departments={departments} types={types} total={2} />);

    await user.click(screen.getByText('全职'));
    expect(mockPush).toHaveBeenCalledWith(
      '/careers?type=full-time',
      { scroll: false },
    );
  });

  it('URL 含 department 时对应按钮应为选中态', () => {
    mockSearchParams.set('department', '安全部');
    render(<JobFilter departments={departments} types={types} total={1} />);

    // 安全部可能同时出现在按钮和结果计数中
    const matches = screen.getAllByText('安全部');
    const button = matches.find((el) => el.tagName === 'BUTTON');
    expect(button).toHaveClass('bg-brand', 'text-white');
  });

  it('URL 含 type 时对应按钮应为选中态（中文展示）', () => {
    mockSearchParams.set('type', 'intern');
    render(<JobFilter departments={departments} types={types} total={1} />);

    const matches = screen.getAllByText('实习');
    const button = matches.find((el) => el.tagName === 'BUTTON');
    expect(button).toHaveClass('bg-brand', 'text-white');
  });

  it('同时有 department 和 type 时应保留两个参数', async () => {
    const user = userEvent.setup();
    mockSearchParams.set('department', '研发部');
    render(<JobFilter departments={departments} types={types} total={2} />);

    await user.click(screen.getByText('全职'));
    const callArgs = mockPush.mock.calls[0][0] as string;
    expect(callArgs).toContain(`department=${enc('研发部')}`);
    expect(callArgs).toContain('type=full-time');
  });

  it('点击"全部"清除对应筛选维度', async () => {
    const user = userEvent.setup();
    mockSearchParams.set('department', '研发部');
    mockSearchParams.set('type', 'full-time');
    render(<JobFilter departments={departments} types={types} total={2} />);

    // 点击部门区的"全部"（第一个）
    const allBtns = screen.getAllByText('全部');
    await user.click(allBtns[0]);
    // 应保留 type，删除 department
    const callArgs = mockPush.mock.calls[0][0] as string;
    expect(callArgs).toContain('type=full-time');
    expect(callArgs).not.toContain('department=');
  });

  it('选中筛选时应显示维度名称', () => {
    mockSearchParams.set('department', '研发部');
    mockSearchParams.set('type', 'intern');
    render(<JobFilter departments={departments} types={types} total={1} />);

    const brandSpans = document.querySelectorAll('span.font-semibold.text-brand');
    const texts = Array.from(brandSpans).map((s) => s.textContent);
    expect(texts.some((t) => t?.includes('研发部'))).toBe(true);
    expect(texts.some((t) => t?.includes('实习'))).toBe(true);
  });
});

describe('CultureSection 组件', () => {
  it('应渲染标题"为什么选择新蓝恒成"', () => {
    render(<CultureSection />);
    expect(screen.getByText('为什么选择新蓝恒成')).toBeInTheDocument();
  });

  it('应渲染副标题描述', () => {
    render(<CultureSection />);
    expect(
      screen.getByText('我们致力于为员工提供优秀的工作环境与发展平台'),
    ).toBeInTheDocument();
  });

  it('应渲染三个文化项：价值观、成长、福利', () => {
    render(<CultureSection />);
    expect(screen.getByText('价值观')).toBeInTheDocument();
    expect(screen.getByText('成长')).toBeInTheDocument();
    expect(screen.getByText('福利')).toBeInTheDocument();
  });

  it('每个文化项应有图标', () => {
    const { container } = render(<CultureSection />);
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBe(3);
  });

  it('每个文化项应有描述文字', () => {
    render(<CultureSection />);
    expect(
      screen.getByText(/外稳内动，恒久达成/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/完善的培训体系/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/五险一金/),
    ).toBeInTheDocument();
  });

  it('图标应为品牌色圆形背景', () => {
    const { container } = render(<CultureSection />);
    const iconWrappers = container.querySelectorAll('.rounded-full.bg-brand');
    expect(iconWrappers.length).toBe(3);
  });
});
