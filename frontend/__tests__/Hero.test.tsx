import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Hero from '@/components/home/Hero';
import { getPageConfig } from '@/lib/api';

// Hero 为异步服务端组件，依赖后台页面配置接口；mock 后返回 null 走默认轮播图
jest.mock('@/lib/api', () => ({
  getPageConfig: jest.fn(() => Promise.resolve(null)),
}));

const mockedGetPageConfig = getPageConfig as jest.MockedFunction<typeof getPageConfig>;

/** 渲染异步服务端组件：先 await 出 JSX 再交给 RTL */
async function renderHero() {
  return render(await Hero());
}

/**
 * Hero 组件渲染与交互逻辑测试
 *
 * 覆盖要点：
 * 1. Hero 主标题与简介文案
 * 2. 轮播背景（默认图兜底 / 后台配置驱动 / 手动切换 / 点击跳转）
 * 3. 渐变蒙层与 CTA 按钮
 * 4. 4 个价值卡片结构与文案
 * 5. ABOUT US 水印与关于我们主体内容
 */
describe('Hero 组件', () => {
  beforeEach(() => {
    mockedGetPageConfig.mockReset();
    mockedGetPageConfig.mockResolvedValue(null as never);
  });

  describe('Hero 主视觉区', () => {
    it('应渲染主标题"新以拓界，蓝以载智，恒以守诺，成以共赢"', async () => {
      await renderHero();
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('新以拓界，蓝以载智，恒以守诺，成以共赢');
      expect(h1).toHaveClass('text-white');
    });

    it('主标题应为唯一 h1', async () => {
      await renderHero();
      const h1s = screen.getAllByRole('heading', { level: 1 });
      expect(h1s).toHaveLength(1);
    });

    it('应渲染双行简介文案（湖南新蓝恒成致力于...）', async () => {
      await renderHero();
      const desc = screen.getByText(/湖南新蓝恒成致力于以技术创新驱动行业发展/);
      expect(desc).toBeInTheDocument();
      expect(desc).toHaveTextContent('为客户提供安全、可靠、高效的产品与解决方案。');
    });

    it('后台无配置时使用 5 张默认轮播图兜底', async () => {
      await renderHero();
      const carousel = screen.getByRole('region', { name: '新蓝恒成企业形象 图片轮播' });
      const imgs = carousel.querySelectorAll('img');
      expect(imgs).toHaveLength(5);
      expect(imgs[0]).toHaveAttribute('src', '/images/hero/hero_home.jpg');
      expect(imgs[4]).toHaveAttribute('src', '/images/hero/hero_home_5.jpg');
    });

    it('后台配置图片时优先使用配置', async () => {
      mockedGetPageConfig.mockResolvedValue({
        visualImages: ['/uploads/custom-hero.jpg'],
        visualLinks: ['/news'],
      } as never);
      await renderHero();
      const carousel = screen.getByRole('region', { name: '新蓝恒成企业形象 图片轮播' });
      const imgs = carousel.querySelectorAll('img');
      expect(imgs).toHaveLength(1);
      expect(imgs[0]).toHaveAttribute('src', '/uploads/custom-hero.jpg');
    });

    it('应包含渐变蒙层（保证文字可读性）', async () => {
      await renderHero();
      const firstSection = document.querySelector('section')!;
      const overlay = firstSection.querySelector('.bg-gradient-to-r');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('from-slate-950/70', 'via-slate-900/40');
    });

    it('应渲染"了解更多"CTA 按钮指向 /about', async () => {
      await renderHero();
      // Hero 区的第一个"了解更多"按钮
      const allLearnMore = screen.getAllByRole('link', { name: /了解更多/ });
      const heroCta = allLearnMore[0];
      expect(heroCta).toHaveAttribute('href', '/about');
      expect(heroCta).toHaveClass('bg-brand', 'text-white');
    });

    it('CTA 按钮应包含箭头图标', async () => {
      await renderHero();
      const heroCta = screen.getAllByRole('link', { name: /了解更多/ })[0];
      const svg = heroCta.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('轮播交互', () => {
    it('默认激活第一张，圆点 aria-current 指示当前帧', async () => {
      await renderHero();
      expect(screen.getByLabelText('切换到第 1 张')).toHaveAttribute('aria-current', 'true');
      expect(screen.getByLabelText('切换到第 2 张')).toHaveAttribute('aria-current', 'false');
    });

    it('点击"下一张"切换激活帧', async () => {
      const user = userEvent.setup();
      await renderHero();

      await user.click(screen.getByLabelText('下一张'));

      expect(screen.getByLabelText('切换到第 2 张')).toHaveAttribute('aria-current', 'true');
      expect(screen.getByLabelText('切换到第 1 张')).toHaveAttribute('aria-current', 'false');
    });

    it('点击"上一张"从第一张回绕到最后一张', async () => {
      const user = userEvent.setup();
      await renderHero();

      await user.click(screen.getByLabelText('上一张'));

      expect(screen.getByLabelText('切换到第 5 张')).toHaveAttribute('aria-current', 'true');
    });

    it('激活帧可点击跳转到对应栏目页（第一张 → /products）', async () => {
      await renderHero();
      const slideLink = screen.getByRole('link', { name: /点击进入对应页面/ });
      expect(slideLink).toHaveAttribute('href', '/products');
    });

    it('圆点上移避开价值卡片重叠区（bottom-20）', async () => {
      await renderHero();
      const dots = screen.getByLabelText('切换到第 1 张').closest('div')!;
      expect(dots).toHaveClass('bottom-20');
    });
  });

  describe('核心价值卡片', () => {
    const expectedCards = [
      { title: '安全可靠', subtitle: '多重防护，稳定运行' },
      { title: '技术创新', subtitle: '持续研发，追求卓越' },
      { title: '高效协同', subtitle: '优化流程，提升效率' },
      { title: '客户至上', subtitle: '专业服务，价值共赢' },
    ];

    it.each(expectedCards)(
      '应渲染卡片：$title - $subtitle',
      async ({ title, subtitle }) => {
        await renderHero();
        expect(screen.getByText(title)).toBeInTheDocument();
        expect(screen.getByText(subtitle)).toBeInTheDocument();
      },
    );

    it('应渲染 4 个价值卡片', async () => {
      await renderHero();
      const cardsContainer = document.querySelector(
        'section .grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4',
      );
      expect(cardsContainer).toBeInTheDocument();
      const cards = cardsContainer!.querySelectorAll(':scope > div');
      expect(cards).toHaveLength(4);
    });

    it('每张卡片应包含蓝色圆形白色图标', async () => {
      await renderHero();
      const cardsContainer = document.querySelector(
        'section .grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4',
      )!;
      const icons = cardsContainer.querySelectorAll('.rounded-full.bg-brand');
      expect(icons).toHaveLength(4);
      icons.forEach((icon) => {
        expect(icon).toHaveClass('text-white');
      });
    });

    it('卡片应使用重叠布局（-mt-16）向上覆盖 Hero 底部', async () => {
      await renderHero();
      const sections = document.querySelectorAll('section');
      // 第二个 section 是价值卡片
      const cardsSection = sections[1];
      expect(cardsSection).toHaveClass('-mt-16');
      expect(cardsSection).toHaveClass('relative', 'z-20');
    });

    it('卡片容器应有阴影和白色背景（shadow-xl + bg-white）', async () => {
      await renderHero();
      const cardWrapper = document.querySelector('.shadow-xl.bg-white');
      expect(cardWrapper).toBeInTheDocument();
      expect(cardWrapper).toHaveClass('rounded-2xl');
    });
  });

  describe('ABOUT US 水印区域', () => {
    it('应渲染"ABOUT US"水印大字（浅灰、超大、大写）', async () => {
      await renderHero();
      const watermark = screen.getByText('ABOUT US');
      expect(watermark).toBeInTheDocument();
      expect(watermark).toHaveClass('text-gray-100', 'font-black', 'uppercase');
    });

    it('应渲染"关于我们"二级标题且位于水印之上（z-10）', async () => {
      await renderHero();
      const aboutTitle = screen.getByRole('heading', {
        level: 2,
        name: '关于我们',
      });
      expect(aboutTitle).toBeInTheDocument();
      expect(aboutTitle.closest('.relative.z-10')).toBeInTheDocument();
    });
  });

  describe('关于我们主体内容', () => {
    it('应渲染"关于新蓝恒成"三级标题', async () => {
      await renderHero();
      const h3 = screen.getByRole('heading', {
        level: 3,
        name: '关于新蓝恒成',
      });
      expect(h3).toBeInTheDocument();
    });

    it('应渲染公司简介与业务范围文案', async () => {
      await renderHero();
      expect(
        screen.getByText(/湖南新蓝恒成信息技术有限公司成立于长沙/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/公司业务涵盖智能车辆管理、车联网安全、智慧出行等领域/),
      ).toBeInTheDocument();
    });

    it('应渲染前台接待图片', async () => {
      await renderHero();
      const receptionImg = screen.getByAltText('新蓝恒成前台接待');
      expect(receptionImg).toHaveAttribute('src', '/images/mockup_reception.png');
    });

    it('应渲染"了解更多"链接指向 /about', async () => {
      await renderHero();
      const learnMoreLinks = screen.getAllByRole('link', { name: /了解更多/ });
      // 最后一个是关于我们区的"了解更多"
      const aboutLink = learnMoreLinks[learnMoreLinks.length - 1];
      expect(aboutLink).toHaveAttribute('href', '/about');
    });

    it('图片和文案应使用双列布局（lg:grid-cols-2）', async () => {
      await renderHero();
      const gridContainer = screen.getByAltText('新蓝恒成前台接待').closest('.grid');
      expect(gridContainer).toHaveClass('lg:grid-cols-2');
    });
  });

  describe('整体结构完整性', () => {
    it('应包含 4 个 section（Hero + 卡片 + 水印 + 主体）', async () => {
      await renderHero();
      const sections = document.querySelectorAll('section');
      expect(sections).toHaveLength(4);
    });

    it('所有标题层级应正确（h1 → h2 → h3）', async () => {
      await renderHero();
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
    });
  });
});
