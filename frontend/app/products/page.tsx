import type { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';
import { getProducts, getProductCategories } from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import ProductFilter from '@/components/products/ProductFilter';
import PageHero from '@/components/common/PageHero';

export const metadata: Metadata = {
  title: '产品与服务',
  description: '新蓝恒成产品与服务 — 智能车辆管理、车联网安全、智慧出行等信息技术解决方案，安全可靠的技术产品满足不同行业的多样化需求。',
  keywords: ['智能车辆管理', '车联网安全', '智慧出行', '信息技术产品', '新蓝恒成产品'],
  alternates: {
    canonical: 'https://xinlanhengcheng.com/products',
  },
  openGraph: {
    title: '产品与服务 | 新蓝恒成',
    description: '新蓝恒成产品与服务 — 智能车辆管理、车联网安全、智慧出行等信息技术解决方案，安全可靠的技术产品满足不同行业的多样化需求。',
    type: 'website',
    url: 'https://xinlanhengcheng.com/products',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '产品与服务 | 新蓝恒成',
    description: '智能车辆管理、车联网安全、智慧出行等信息技术解决方案',
  },
};

interface SearchParams {
  category?: string;
}

// 鸿蒙智行车型在独立专区（/hima）展示，不混入本页 IT 产品列表
const HIMA_CATEGORY = '鸿蒙智行';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const category = searchParams?.category;

  // 并行获取产品列表和分类
  const [allProducts, allCategories] = await Promise.all([
    getProducts(category),
    getProductCategories(),
  ]);

  const products = allProducts.filter((p) => p.category !== HIMA_CATEGORY);
  const categories = allCategories.filter((c) => c !== HIMA_CATEGORY);

  return (
    <>
      {/* 页面 Banner（全屏背景图 + 渐变蒙版） */}
      <PageHero
        page="products"
        title="产品与服务"
        subtitle="安全可靠的技术产品与解决方案，满足不同行业的多样化需求"
        visualImage="/images/hero/hero_products.jpg"
        visualAlt="黄昏城市驾驶舱视角，智能车联网产品意境"
      />

      {/* 产品列表 */}
      <section className="section bg-ink-50">
        <div className="container-page">
          {/* 筛选器 */}
          <Suspense fallback={<div className="mb-10 h-10 animate-pulse rounded-full bg-ink-100" />}>
            <ProductFilter categories={categories} total={products.length} />
          </Suspense>

          {/* 产品网格 */}
          {products.length === 0 ? (
            <div className="rounded-2xl border border-ink-100 bg-white p-12 text-center">
              <p className="text-lg font-medium text-ink-600">暂无该分类下的产品</p>
              <p className="mt-2 text-sm text-ink-400">请尝试选择其他分类或查看全部产品</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
