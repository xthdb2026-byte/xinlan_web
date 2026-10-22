import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { getFeaturedProducts } from '@/lib/api';
import type { ProductItem } from '@/lib/types';

export default async function ProductPreview() {
  let products: ProductItem[] = [];
  let loadError = false;

  try {
    products = await getFeaturedProducts(3);
  } catch {
    loadError = true;
  }

  return (
    <section className="section bg-ink-50">
      <div className="container-page">
        {/* 标题区 */}
        <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="section-title">产品与服务</h2>
            <p className="section-subtitle">安全可靠的技术产品与解决方案</p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand transition-colors hover:text-brand-700"
          >
            查看全部
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* 内容区 */}
        {loadError ? (
          <div className="rounded-xl border border-ink-100 bg-white p-8 text-center text-ink-500">
            暂时无法加载产品数据，请稍后重试
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-ink-100 bg-white p-8 text-center text-ink-500">
            暂无产品信息
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                {/* 产品图 */}
                <div className="relative aspect-[4/3] overflow-hidden bg-ink-100">
                  {product.coverImage && (
                    <Image
                      src={product.coverImage}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  )}
                  {/* 分类标签 */}
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand backdrop-blur-sm">
                    {product.category}
                  </span>
                </div>

                {/* 产品信息 */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="mb-2 text-lg font-bold text-ink transition-colors group-hover:text-brand">
                    {product.name}
                  </h3>
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-ink-500 line-clamp-2">
                    {product.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand transition-colors group-hover:text-brand-700">
                    了解详情
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
