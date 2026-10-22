import { render, screen } from '@testing-library/react';
import ProductCard from '@/components/products/ProductCard';
import type { ProductItem } from '@/lib/types';

/** 构造产品卡片测试数据 */
function makeProduct(overrides: Partial<ProductItem> = {}): ProductItem {
  return {
    id: 1,
    name: '海康威视 DS-2DC4223IW-D 400万23倍智能球机',
    slug: 'hikvision-2dc4223iw-d',
    category: '海康威视监控解决方案系列',
    description: '400万像素23倍光学变焦红外网络智能球机',
    coverImage: '/uploads/products/hikvision-2dc4223iw-d-1.jpg',
    sortOrder: 0,
    viewCount: 0,
    ...overrides,
  } as ProductItem;
}

describe('ProductCard 产品卡片', () => {
  it('应渲染 coverImage 实拍图（京东图源接入回归）', () => {
    render(<ProductCard product={makeProduct()} />);

    const img = screen.getByRole('img', { name: /DS-2DC4223IW-D/ });
    expect(img).toHaveAttribute('src', '/uploads/products/hikvision-2dc4223iw-d-1.jpg');
  });

  it('卡片应链接到产品详情页', () => {
    render(<ProductCard product={makeProduct()} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/products/hikvision-2dc4223iw-d');
  });

  it('应显示产品名称、分类与描述', () => {
    render(<ProductCard product={makeProduct()} />);

    expect(screen.getByText(/400万23倍智能球机/)).toBeInTheDocument();
    expect(screen.getByText('海康威视监控解决方案系列')).toBeInTheDocument();
    expect(screen.getByText(/23倍光学变焦/)).toBeInTheDocument();
  });

  it('coverImage 为空时不渲染图片（避免破图占位）', () => {
    render(<ProductCard product={makeProduct({ coverImage: null })} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    // 其余信息仍正常展示
    expect(screen.getByText(/400万23倍智能球机/)).toBeInTheDocument();
  });

  it('SVG 封面（软件平台类无实物产品）同样渲染', () => {
    render(
      <ProductCard
        product={makeProduct({
          name: '海康威视 iSecure Center 综合安防管理平台',
          slug: 'hikvision-isecure-center',
          coverImage: '/uploads/products/hikvision-isecure-center-1.svg',
        })}
      />,
    );

    const img = screen.getByRole('img', { name: /iSecure Center/ });
    expect(img).toHaveAttribute('src', '/uploads/products/hikvision-isecure-center-1.svg');
  });
});
