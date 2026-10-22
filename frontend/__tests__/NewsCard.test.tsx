import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewsCard from '@/components/news/NewsCard';
import NewsFilter from '@/components/news/NewsFilter';
import Pagination from '@/components/common/Pagination';
import type { NewsItem } from '@/lib/types';

// 覆盖 next/navigation mock
const mockPush = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/news',
}));

const enc = (s: string) => encodeURIComponent(s);

const mockNews: NewsItem = {
  id: 1,
  title: '新蓝恒成荣获2026年度信息安全优秀企业奖',
  slug: 'xinlan-wins-security-award-2026',
  summary: '我司凭借在信息安全领域的突出表现，荣获年度优秀企业奖项。',
  coverImage: '/images/logo_shield.png',
  category: '公司动态',
  tags: '获奖,信息安全,企业荣誉',
  viewCount: 128,
  publishedAt: '2026-07-15T00:00:00.000Z',
};

describe('NewsCard 组件', () => {
  it('应渲染新闻标题、摘要和分类标签', () => {
    render(<NewsCard news={mockNews} />);

    expect(screen.getByText('新蓝恒成荣获2026年度信息安全优秀企业奖')).toBeInTheDocument();
    expect(
      screen.getByText('我司凭借在信息安全领域的突出表现，荣获年度优秀企业奖项。'),
    ).toBeInTheDocument();
    expect(screen.getByText('公司动态')).toBeInTheDocument();
  });

  it('应格式化日期为 YYYY-MM-DD', () => {
    render(<NewsCard news={mockNews} />);
    expect(screen.getByText('2026-07-15')).toBeInTheDocument();
  });

  it('应显示阅读数', () => {
    render(<NewsCard news={mockNews} />);
    // 阅读数和"阅读全文"都含"阅读"，用完整文本匹配
    expect(screen.getByText(/阅读 128/)).toBeInTheDocument();
  });

  it('应解析并渲染逗号分隔的标签', () => {
    render(<NewsCard news={mockNews} />);
    expect(screen.getByText('#获奖')).toBeInTheDocument();
    expect(screen.getByText('#信息安全')).toBeInTheDocument();
    expect(screen.getByText('#企业荣誉')).toBeInTheDocument();
  });

  it('应渲染"阅读全文"文字', () => {
    render(<NewsCard news={mockNews} />);
    expect(screen.getByText('阅读全文')).toBeInTheDocument();
  });

  it('卡片应链接到 /news/:slug', () => {
    render(<NewsCard news={mockNews} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/news/xinlan-wins-security-award-2026');
  });

  it('封面图应使用新闻标题作为 alt', () => {
    render(<NewsCard news={mockNews} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', '新蓝恒成荣获2026年度信息安全优秀企业奖');
  });

  it('无标签时不应渲染标签元素', () => {
    render(<NewsCard news={{ ...mockNews, tags: null }} />);
    expect(screen.queryByText('#获奖')).not.toBeInTheDocument();
  });

  it('无封面图时不应渲染 img', () => {
    render(<NewsCard news={{ ...mockNews, coverImage: null }} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('viewCount 为 null 时不应显示阅读数', () => {
    render(<NewsCard news={{ ...mockNews, viewCount: undefined }} />);
    // "阅读全文"存在但"阅读 N"不存在
    expect(screen.queryByText(/阅读 \d/)).not.toBeInTheDocument();
    expect(screen.getByText('阅读全文')).toBeInTheDocument();
  });

  it('卡片应有 hover 上移效果', () => {
    render(<NewsCard news={mockNews} />);
    const link = screen.getByRole('link');
    expect(link).toHaveClass('hover:-translate-y-1', 'hover:shadow-xl');
  });
});

describe('NewsFilter 组件', () => {
  const categories = ['公司动态', '行业资讯'];

  beforeEach(() => {
    mockPush.mockClear();
    mockSearchParams = new URLSearchParams();
  });

  it('应渲染"全部"按钮和所有分类按钮', () => {
    render(<NewsFilter categories={categories} total={3} />);
    expect(screen.getByText('全部')).toBeInTheDocument();
    expect(screen.getByText('公司动态')).toBeInTheDocument();
    expect(screen.getByText('行业资讯')).toBeInTheDocument();
  });

  it('应显示结果总数', () => {
    render(<NewsFilter categories={categories} total={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/条新闻/)).toBeInTheDocument();
  });

  it('无选中时"全部"应为选中态', () => {
    render(<NewsFilter categories={categories} total={3} />);
    const allBtn = screen.getByText('全部');
    expect(allBtn).toHaveClass('bg-brand', 'text-white');
  });

  it('点击分类按钮应调用 router.push 更新 URL', async () => {
    const user = userEvent.setup();
    render(<NewsFilter categories={categories} total={3} />);

    await user.click(screen.getByText('公司动态'));
    expect(mockPush).toHaveBeenCalledWith(
      `/news?category=${enc('公司动态')}`,
      { scroll: false },
    );
  });

  it('点击"全部"应清除 category 参数', async () => {
    const user = userEvent.setup();
    mockSearchParams.set('category', '公司动态');
    render(<NewsFilter categories={categories} total={3} />);

    await user.click(screen.getByText('全部'));
    expect(mockPush).toHaveBeenCalledWith('/news', { scroll: false });
  });

  it('URL 含 category 参数时对应按钮应为选中态', () => {
    mockSearchParams.set('category', '行业资讯');
    render(<NewsFilter categories={categories} total={1} />);

    // 行业资讯同时出现在按钮和结果计数中，用 getAllByText 找到按钮
    const matches = screen.getAllByText('行业资讯');
    const button = matches.find((el) => el.tagName === 'BUTTON');
    expect(button).toHaveClass('bg-brand', 'text-white');

    const allBtn = screen.getByText('全部');
    expect(allBtn).not.toHaveClass('bg-brand');
  });

  it('切换分类时应清除 tag 和 page 参数', async () => {
    const user = userEvent.setup();
    mockSearchParams.set('tag', '信息安全');
    mockSearchParams.set('page', '2');
    render(<NewsFilter categories={categories} total={3} />);

    await user.click(screen.getByText('公司动态'));
    // push 的 URL 只含 category，不含 tag 和 page
    const callArgs = mockPush.mock.calls[0][0] as string;
    expect(callArgs).toContain(`category=${enc('公司动态')}`);
    expect(callArgs).not.toContain('tag=');
    expect(callArgs).not.toContain('page=');
  });

  it('同时有 category 和 tag 时应显示两个筛选条件', () => {
    mockSearchParams.set('category', '公司动态');
    mockSearchParams.set('tag', '信息安全');
    render(<NewsFilter categories={categories} total={1} />);

    // 分类名称在 span.font-semibold.text-brand 中显示
    const brandSpans = document.querySelectorAll('span.font-semibold.text-brand');
    const texts = Array.from(brandSpans).map((s) => s.textContent);
    expect(texts.some((t) => t?.includes('公司动态'))).toBe(true);
    expect(texts.some((t) => t?.includes('信息安全'))).toBe(true);
  });
});

describe('Pagination 组件', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSearchParams = new URLSearchParams();
  });

  it('总页数 <= 1 时不应渲染', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} basePath="/news" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('总页数 > 1 时应渲染分页导航', () => {
    render(<Pagination currentPage={1} totalPages={3} basePath="/news" />);
    expect(screen.getByLabelText('分页导航')).toBeInTheDocument();
  });

  it('应渲染上一页和下一页按钮', () => {
    render(<Pagination currentPage={2} totalPages={3} basePath="/news" />);
    expect(screen.getByLabelText('上一页')).toBeInTheDocument();
    expect(screen.getByLabelText('下一页')).toBeInTheDocument();
  });

  it('第一页时上一页按钮应禁用', () => {
    render(<Pagination currentPage={1} totalPages={3} basePath="/news" />);
    expect(screen.getByLabelText('上一页')).toBeDisabled();
  });

  it('最后一页时下一页按钮应禁用', () => {
    render(<Pagination currentPage={3} totalPages={3} basePath="/news" />);
    expect(screen.getByLabelText('下一页')).toBeDisabled();
  });

  it('当前页码应为选中态（蓝色背景）', () => {
    render(<Pagination currentPage={2} totalPages={3} basePath="/news" />);
    const page2Btn = screen.getByLabelText('第 2 页');
    expect(page2Btn).toHaveClass('bg-brand', 'text-white');
  });

  it('非当前页码应为白色背景', () => {
    render(<Pagination currentPage={1} totalPages={3} basePath="/news" />);
    const page2Btn = screen.getByLabelText('第 2 页');
    expect(page2Btn).toHaveClass('bg-white', 'text-ink-600');
  });

  it('点击页码应调用 router.push 更新 URL', async () => {
    const user = userEvent.setup();
    render(<Pagination currentPage={1} totalPages={3} basePath="/news" />);

    await user.click(screen.getByLabelText('第 2 页'));
    expect(mockPush).toHaveBeenCalledWith('/news?page=2', { scroll: false });
  });

  it('点击下一页应跳到 currentPage + 1', async () => {
    const user = userEvent.setup();
    render(<Pagination currentPage={1} totalPages={3} basePath="/news" />);

    await user.click(screen.getByLabelText('下一页'));
    expect(mockPush).toHaveBeenCalledWith('/news?page=2', { scroll: false });
  });

  it('点击上一页应跳到 currentPage - 1', async () => {
    const user = userEvent.setup();
    render(<Pagination currentPage={3} totalPages={3} basePath="/news" />);

    await user.click(screen.getByLabelText('上一页'));
    expect(mockPush).toHaveBeenCalledWith('/news?page=2', { scroll: false });
  });

  it('跳转到第 1 页时应删除 page 参数', async () => {
    const user = userEvent.setup();
    mockSearchParams.set('page', '2');
    render(<Pagination currentPage={2} totalPages={3} basePath="/news" />);

    await user.click(screen.getByLabelText('第 1 页'));
    expect(mockPush).toHaveBeenCalledWith('/news', { scroll: false });
  });

  it('页数多时应显示省略号', () => {
    render(<Pagination currentPage={5} totalPages={10} basePath="/news" />);
    const ellipsis = screen.getAllByText('...');
    expect(ellipsis.length).toBeGreaterThanOrEqual(1);
  });

  it('保留已有 URL 参数（如 category）', async () => {
    const user = userEvent.setup();
    mockSearchParams.set('category', '公司动态');
    render(<Pagination currentPage={1} totalPages={3} basePath="/news" />);

    await user.click(screen.getByLabelText('第 2 页'));
    const callArgs = mockPush.mock.calls[0][0] as string;
    expect(callArgs).toContain(`category=${enc('公司动态')}`);
    expect(callArgs).toContain('page=2');
  });

  it('当前页等于目标页时不应触发导航', async () => {
    const user = userEvent.setup();
    render(<Pagination currentPage={2} totalPages={3} basePath="/news" />);

    await user.click(screen.getByLabelText('第 2 页'));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('应有 aria-current="page" 标记当前页', () => {
    render(<Pagination currentPage={2} totalPages={3} basePath="/news" />);
    const page2Btn = screen.getByLabelText('第 2 页');
    expect(page2Btn).toHaveAttribute('aria-current', 'page');
  });
});
