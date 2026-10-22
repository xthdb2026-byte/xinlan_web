import React from 'react';
import { render, screen } from '@testing-library/react';
import HimaPage from '@/app/hima/page';
import type { ProductDetail, ProductItem } from '@/lib/types';

// PageHero 为读取 page_configs 的服务端组件，测试中用桩组件替代
jest.mock('@/components/common/PageHero', () => {
  return function MockPageHero({ title, subtitle }: { title: string; subtitle: string }) {
    return (
      <div data-testid="page-hero">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    );
  };
});

/** 构造车型详情测试数据（JSON 字符串字段与后端返回一致） */
function makeCar(overrides: {
  slug: string;
  name: string;
  description: string;
  min: number;
  max: number;
  note: string;
}): ProductDetail {
  const base: ProductItem = {
    id: 1,
    name: overrides.name,
    slug: overrides.slug,
    category: '鸿蒙智行',
    description: overrides.description,
    coverImage: `/uploads/products/hima/${overrides.slug}-1.jpg`,
    sortOrder: 101,
    viewCount: 0,
  } as ProductItem;
  return {
    ...base,
    features: JSON.stringify([
      { title: '华为乾崑智驾 ADS', detail: '高阶版' },
      { title: '鸿蒙座舱', detail: '全系标配' },
    ]),
    specs: JSON.stringify([{ group: '基本参数', items: [{ label: '轴距', value: '3250' }] }]),
    priceInfo: JSON.stringify({
      min: overrides.min,
      max: overrides.max,
      unit: '元',
      note: overrides.note,
    }),
    scenarios: JSON.stringify(['高端商务接待', '多人口家庭出行']),
    images: JSON.stringify([`/uploads/products/hima/${overrides.slug}-1.jpg`]),
    status: 'active',
    createdAt: '2026-10-10T00:00:00.000Z',
    updatedAt: '2026-10-10T00:00:00.000Z',
  } as ProductDetail;
}

const threeCars: ProductDetail[] = [
  makeCar({
    slug: 'shangjie-h5',
    name: '尚界 H5',
    description: '鸿蒙智行旗下中型 SUV',
    min: 159800,
    max: 199800,
    note: '建议零售价，共 6 款配置',
  }),
  makeCar({
    slug: 'zunjie-s800',
    name: '尊界 S800',
    description: '鸿蒙智行旗舰大型豪华轿车',
    min: 708000,
    max: 1018000,
    note: '指导价，共 6 款配置',
  }),
  makeCar({
    slug: 'ehv-extended-range',
    name: 'EHV 增程版',
    description: '鸿蒙智行旗下大型七座 MPV（增程动力）',
    min: 389800,
    max: 519800,
    note: '价格区间 38.98 万 - 51.98 万元',
  }),
];

// mock lib/api：列表返回 3 款车型，详情按 slug 对应
jest.mock('@/lib/api', () => ({
  getProducts: jest.fn(() =>
    Promise.resolve(
      threeCars.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        category: c.category,
        description: c.description,
        coverImage: c.coverImage,
        sortOrder: c.sortOrder,
        viewCount: 0,
      })),
    ),
  ),
  getProductBySlug: jest.fn((slug: string) =>
    Promise.resolve(threeCars.find((c) => c.slug === slug)),
  ),
}));

describe('鸿蒙智行专区页 /hima', () => {
  it('应渲染 PageHero 与 3 款车型', async () => {
    render(await HimaPage());

    expect(screen.getByTestId('page-hero')).toBeInTheDocument();
    expect(screen.getByText('尚界 H5')).toBeInTheDocument();
    expect(screen.getByText('尊界 S800')).toBeInTheDocument();
    expect(screen.getByText('EHV 增程版')).toBeInTheDocument();
  });

  it('每款车型 CTA 应链接到对应产品详情页', async () => {
    render(await HimaPage());

    for (const slug of ['shangjie-h5', 'zunjie-s800', 'ehv-extended-range']) {
      const links = screen.getAllByRole('link', { name: /查看详细配置/ });
      expect(links.some((l) => l.getAttribute('href') === `/products/${slug}`)).toBe(true);
    }
  });

  it('应按 zh-CN 千分位格式化建议零售价区间', async () => {
    render(await HimaPage());

    expect(screen.getByText('¥159,800 — ¥199,800')).toBeInTheDocument();
    expect(screen.getByText('¥708,000 — ¥1,018,000')).toBeInTheDocument();
    expect(screen.getByText('¥389,800 — ¥519,800')).toBeInTheDocument();
  });

  it('应渲染 8 张交付业绩卡片（含国网广东与京东汽车热搜榜）', async () => {
    render(await HimaPage());

    const achievementTitles = [
      '公安部警务装备采购中心《入围通知书》',
      '南方电网 2025 年度通用车辆（第一批）框架采购项目',
      '广东省 2024 年新能源公务用车「统采分签」项目交车仪式',
      '鸿蒙智行 & 问界与神州租车合作展望暨交车仪式',
      '2025 贵州鸿蒙智行问界 M7 集中交付盛典',
      'AITO 鸿蒙智行门店批量交车',
      '国网广东成交确认书',
      '尊界 S800 登上京东汽车热搜榜',
    ];
    for (const title of achievementTitles) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it('公安部入围卡片应包含抬头主体标注（赛力斯）', async () => {
    render(await HimaPage());

    expect(
      screen.getByText(/通知书抬头单位：重庆金康赛力斯汽车销售有限公司/),
    ).toBeInTheDocument();
  });

  it('命名回归：页面不应残留「智界 V9」字样（车型统一显示为 EHV 增程版）', async () => {
    const { container } = render(await HimaPage());

    expect(container.textContent).not.toContain('智界 V9');
    expect(screen.getAllByText('鸿蒙智行').length).toBeGreaterThan(0);
  });

  it('车型封面图应使用本地 hima 目录资源', async () => {
    render(await HimaPage());

    const img = screen.getByRole('img', { name: 'EHV 增程版' });
    expect(img).toHaveAttribute('src', '/uploads/products/hima/ehv-extended-range-1.jpg');
  });

  it('接口异常时应渲染空态兜底文案', async () => {
    const api = jest.requireMock('@/lib/api') as { getProducts: jest.Mock };
    api.getProducts.mockImplementationOnce(() => Promise.reject(new Error('network down')));

    render(await HimaPage());

    expect(screen.getByText('专区车型信息即将上线')).toBeInTheDocument();
  });
});
