import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { ProductItem } from '@/lib/types';

export default function ProductCard({ product }: { product: ProductItem }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100 transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-brand-200"
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
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand transition-colors group-hover:gap-2">
          了解详情
          <ArrowRight className="h-3.5 w-3.5 transition-all" />
        </span>
      </div>
    </Link>
  );
}
