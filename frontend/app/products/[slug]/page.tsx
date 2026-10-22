import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ArrowLeft, MapPin, BadgeCheck } from 'lucide-react';
import { getProductBySlug, getRelatedProducts } from '@/lib/api';
import type { ProductDetail, ProductItem } from '@/lib/types';
import ProductViewTracker from '@/components/ProductViewTracker';

interface PageProps {
  params: { slug: string };
}

// 生成静态元数据
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const product = await getProductBySlug(params.slug);
    const canonicalUrl = `https://xinlanhengcheng.com/products/${product.slug}`;
    return {
      title: product.name,
      description: product.description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: product.name,
        description: product.description,
        type: 'website',
        url: canonicalUrl,
        locale: 'zh_CN',
        images: product.coverImage
          ? [{ url: product.coverImage, width: 1200, height: 900, alt: product.name }]
          : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: product.description,
        images: product.coverImage ? [product.coverImage] : undefined,
      },
    };
  } catch {
    return { title: '产品详情' };
  }
}

// 解析 JSON 字符串字段
interface ProductFeature {
  title: string;
  detail: string;
}

interface SpecGroup {
  group: string;
  items: { label: string; value: string }[];
}

interface PriceInfo {
  min: number;
  max: number;
  unit: string;
  note?: string;
  updatedAt?: string;
}

function parseProductFields(product: ProductDetail) {
  let features: ProductFeature[] = [];
  let images: string[] = [];
  let specs: SpecGroup[] = [];
  let priceInfo: PriceInfo | null = null;
  let scenarios: string[] = [];
  try {
    const parsed = product.features ? JSON.parse(product.features) : [];
    if (Array.isArray(parsed)) {
      features = parsed.filter(
        (f: unknown): f is ProductFeature =>
          typeof f === 'object' && f !== null && 'title' in f && 'detail' in f,
      );
    }
  } catch {
    features = [];
  }
  try {
    const parsed = product.images ? JSON.parse(product.images) : [];
    if (Array.isArray(parsed)) {
      images = parsed.filter((s): s is string => typeof s === 'string');
    }
  } catch {
    images = [];
  }
  try {
    const parsed = product.specs ? JSON.parse(product.specs) : [];
    if (Array.isArray(parsed)) {
      specs = parsed.filter(
        (g: unknown): g is SpecGroup =>
          typeof g === 'object' && g !== null && 'group' in g && Array.isArray((g as SpecGroup).items),
      );
    }
  } catch {
    specs = [];
  }
  try {
    const parsed = product.priceInfo ? JSON.parse(product.priceInfo) : null;
    if (parsed && typeof parsed === 'object' && 'min' in parsed && 'max' in parsed) {
      priceInfo = parsed as PriceInfo;
    }
  } catch {
    priceInfo = null;
  }
  try {
    const parsed = product.scenarios ? JSON.parse(product.scenarios) : [];
    if (Array.isArray(parsed)) {
      scenarios = parsed.filter((s): s is string => typeof s === 'string');
    }
  } catch {
    scenarios = [];
  }
  return { features, images, specs, priceInfo, scenarios };
}

// 价格格式化：千分位
function formatPrice(n: number) {
  return n.toLocaleString('zh-CN');
}

export default async function ProductDetailPage({ params }: PageProps) {
  let product: ProductDetail;
  let relatedProducts: ProductItem[] = [];

  try {
    product = await getProductBySlug(params.slug);
  } catch {
    notFound();
  }

  const { features, images, specs, priceInfo, scenarios } = parseProductFields(product);

  // 智能推荐：同分类按浏览热度排序的相关产品
  try {
    relatedProducts = await getRelatedProducts(params.slug, 4);
  } catch {
    // 推荐失败不影响主内容展示
  }

  return (
    <>
      {/* 匿名浏览埋点（会话内去重） */}
      <ProductViewTracker slug={product.slug} />
      {/* 面包屑导航 */}
      <div className="border-b border-ink-100 bg-white pt-16 lg:pt-20">
        <div className="container-page py-4">
          <nav className="flex items-center gap-2 text-sm text-ink-400">
            <Link href="/" className="hover:text-brand">首页</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-brand">产品与服务</Link>
            <span>/</span>
            <span className="text-ink-600">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* 产品详情 */}
      <section className="section bg-white">
        <div className="container-page">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
            {/* 产品图 */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-ink-100 shadow-lg">
              {product.coverImage && (
                <Image
                  src={product.coverImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1200px) 100vw, 50vw"
                  priority
                />
              )}
            </div>

            {/* 产品信息 */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-3">
                <span className="inline-flex w-fit items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand">
                  {product.category}
                </span>
                {typeof product.viewCount === 'number' && product.viewCount > 0 && (
                  <span className="text-xs text-ink-400">
                    累计浏览 {product.viewCount.toLocaleString('zh-CN')}
                  </span>
                )}
              </div>
              <h1 className="mt-4 text-2xl font-bold text-ink sm:text-3xl lg:text-4xl">
                {product.name}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-ink-600">
                {product.description}
              </p>

              {/* 核心特性 */}
              {features.length > 0 && (
                <div className="mt-8">
                  <h2 className="mb-4 text-lg font-bold text-ink">核心特性</h2>
                  <ul className="space-y-3">
                    {features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand" />
                        <div>
                          <span className="text-sm font-semibold text-ink-700">{feature.title}</span>
                          <span className="ml-2 text-sm leading-relaxed text-ink-500">{feature.detail}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 市场参考价 */}
              {priceInfo && (
                <div className="mt-8 rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-5">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-ink-400">市场参考价</p>
                      <p className="mt-1 text-2xl font-bold text-brand sm:text-3xl">
                        ¥{formatPrice(priceInfo.min)}
                        <span className="mx-1 text-base font-semibold text-ink-400">—</span>
                        ¥{formatPrice(priceInfo.max)}
                        <span className="ml-2 text-sm font-normal text-ink-500">{priceInfo.unit}</span>
                      </p>
                    </div>
                    {priceInfo.updatedAt && (
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-ink-400 ring-1 ring-ink-100">
                        价格更新于 {priceInfo.updatedAt}
                      </span>
                    )}
                  </div>
                  {priceInfo.note && (
                    <p className="mt-3 text-xs leading-relaxed text-ink-400">
                      * {priceInfo.note}
                    </p>
                  )}
                </div>
              )}

              {/* 适用场景 */}
              {scenarios.length > 0 && (
                <div className="mt-6">
                  <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-ink">
                    <MapPin className="h-5 w-5 text-brand" />
                    适用场景
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {scenarios.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-ink-50 px-4 py-1.5 text-sm text-ink-600 ring-1 ring-ink-100"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-7 py-3.5 text-base font-semibold text-white transition-all hover:bg-brand-600"
                >
                  合作咨询
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink-200 px-7 py-3.5 text-base font-semibold text-ink-600 transition-all hover:border-brand-300 hover:text-brand"
                >
                  <ArrowLeft className="h-4 w-4" />
                  返回列表
                </Link>
              </div>
            </div>
          </div>

          {/* 技术参数 */}
          {specs.length > 0 && (
            <div className="mt-16">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-ink">
                <BadgeCheck className="h-5 w-5 text-brand" />
                技术参数
              </h2>
              <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
                {specs.map((group, gi) => (
                  <div key={group.group} className={gi > 0 ? 'border-t-2 border-ink-100' : ''}>
                    <div className="bg-ink-50 px-5 py-3">
                      <h3 className="text-sm font-bold text-ink-700">{group.group}</h3>
                    </div>
                    <dl className="divide-y divide-ink-50">
                      {group.items.map((item) => (
                        <div
                          key={item.label}
                          className="grid grid-cols-1 gap-1 px-5 py-3 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-4"
                        >
                          <dt className="text-sm font-medium text-ink-400">{item.label}</dt>
                          <dd className="text-sm leading-relaxed text-ink-700 break-words">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 产品图集 */}
          {images.length > 0 && (
            <div className="mt-16">
              <h2 className="mb-6 text-xl font-bold text-ink">产品展示</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-video overflow-hidden rounded-xl bg-ink-100">
                    <Image
                      src={img}
                      alt={`${product.name} - ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 相关产品（智能推荐：同分类按热度排序） */}
      {relatedProducts.length > 0 && (
        <section className="section bg-ink-50">
          <div className="container-page">
            <h2 className="mb-8 text-xl font-bold text-ink">相关产品推荐</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/products/${rp.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100 transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-ink-100">
                    {rp.coverImage && (
                      <Image
                        src={rp.coverImage}
                        alt={rp.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-base font-bold text-ink transition-colors group-hover:text-brand">
                      {rp.name}
                    </h3>
                    <p className="mt-1 text-sm text-ink-500 line-clamp-2">{rp.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
