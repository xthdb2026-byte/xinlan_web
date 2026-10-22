import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, MapPin, Sparkles } from 'lucide-react';
import { getProducts, getProductBySlug } from '@/lib/api';
import type { ProductDetail } from '@/lib/types';
import PageHero from '@/components/common/PageHero';

// 专区分类名（与后端 products.category 一致）
const HIMA_CATEGORY = '鸿蒙智行';

const SITE_URL = 'https://xinlanhengcheng.com';

export const revalidate = 60;

export const metadata: Metadata = {
  title: '鸿蒙智行专区',
  description:
    '鸿蒙智行全系车型专区：尚界 H5、尊界 S800、EHV 增程版，含建议零售价、核心配置与技术参数，欢迎合作咨询。',
  keywords: ['鸿蒙智行', '尚界 H5', '尊界 S800', 'EHV 增程版', '智能驾驶', '新能源车型', '新蓝恒成'],
  alternates: {
    canonical: `${SITE_URL}/hima`,
  },
  openGraph: {
    title: '鸿蒙智行专区 | 新蓝恒成',
    description:
      '鸿蒙智行全系车型专区：尚界 H5、尊界 S800、EHV 增程版，含建议零售价、核心配置与技术参数。',
    type: 'website',
    url: `${SITE_URL}/hima`,
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '鸿蒙智行专区 | 新蓝恒成',
    description: '鸿蒙智行全系车型：尚界 H5、尊界 S800、EHV 增程版',
  },
};

interface FeaturedCar {
  name: string;
  slug: string;
  description: string;
  coverImage?: string | null;
  features: { title: string; detail: string }[];
  priceRange: string | null;
  priceNote: string | null;
  scenarios: string[];
}

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

function formatPrice(n: number) {
  return n.toLocaleString('zh-CN');
}

// 把详情接口返回的 JSON 字符串字段整理为卡片所需的展示数据
function toFeaturedCar(p: ProductDetail): FeaturedCar {
  const features = parseJson<{ title: string; detail: string }[]>(p.features, []);
  const priceInfo = parseJson<{ min: number; max: number; unit: string; note?: string } | null>(
    p.priceInfo,
    null,
  );
  const scenarios = parseJson<string[]>(p.scenarios, []);
  const priceRange =
    priceInfo && typeof priceInfo.min === 'number' && typeof priceInfo.max === 'number'
      ? `¥${formatPrice(priceInfo.min)} — ¥${formatPrice(priceInfo.max)}`
      : null;
  return {
    name: p.name,
    slug: p.slug,
    description: p.description,
    coverImage: p.coverImage,
    features: features.slice(0, 4),
    priceRange,
    priceNote: priceInfo?.note ?? null,
    scenarios: scenarios.slice(0, 4),
  };
}

// 交付业绩（数据源：拓展材料第 24 页，文案照录现场画面/公示原文）
const achievements = [
  {
    image: '/images/hima/ach-police.jpg',
    tag: '政府采购入围',
    title: '公安部警务装备采购中心《入围通知书》',
    meta: '警采发〔2022〕702 号 · 2022 年',
    detail:
      '一般警用车辆协议供货补充征集项目（JC-HG20220015）第 10 包，经评审委员会评定，所投 8 种型号入选协议供货范围。',
  },
  {
    image: '/images/hima/ach-csg-bid.jpg',
    tag: '央企框架采购中标',
    title: '南方电网 2025 年度通用车辆（第一批）框架采购项目',
    meta: '中标公示 · 2025 年 10 月',
    detail:
      '南方电网电动汽车服务有限公司 2025 年度通用车辆（第一批）框架采购项目中标，进入中标候选人公示。',
  },
  {
    image: '/images/hima/ach-guangdong.jpg',
    tag: '公务用车交付',
    title: '广东省 2024 年新能源公务用车「统采分签」项目交车仪式',
    meta: '践行绿色公务出行理念 · 推动机关运行降本增效',
    detail: '参与广东省新能源公务用车「统采分签」项目并完成批量交车，助力机关运行绿色低碳、降本增效。',
  },
  {
    image: '/images/hima/ach-shenzhou.jpg',
    tag: '出行平台合作',
    title: '鸿蒙智行 & 问界与神州租车合作展望暨交车仪式',
    meta: '2025.09.28 · 海口',
    detail: '与神州租车达成合作展望并完成批量交车，拓展鸿蒙智行车型在出行服务平台的规模化应用。',
  },
  {
    image: '/images/hima/ach-guizhou.jpg',
    tag: '集中交付盛典',
    title: '2025 贵州鸿蒙智行问界 M7 集中交付盛典',
    meta: '智启新程 · 共赴未来',
    detail: '在贵州完成问界 M7 集中交付，面向区域用户实现规模化、仪式化交付。',
  },
  {
    image: '/images/hima/ach-aito.jpg',
    tag: '门店批量交付',
    title: 'AITO 鸿蒙智行门店批量交车',
    meta: '门店交付',
    detail: '通过 AITO 鸿蒙智行门店完成批量交车，打通从展示体验到交付服务的完整链路。',
  },
];

export default async function HimaPage() {
  // 列表接口取本专区车型，再逐款取详情以获得价格/配置（车型仅 3 款，开销可控）
  let cars: FeaturedCar[] = [];
  try {
    const list = await getProducts(HIMA_CATEGORY);
    const details = await Promise.all(list.map((item) => getProductBySlug(item.slug)));
    cars = details.map(toFeaturedCar);
  } catch {
    cars = [];
  }

  return (
    <>
      {/* 页面 Banner */}
      <PageHero
        page="hima"
        title="鸿蒙智行"
        subtitle="鸿蒙智行全系车型 —— 尚界 H5 · 尊界 S800 · EHV 增程版，智能驾驶与豪华出行的全新选择"
        visualImage="/images/hero/hero_hima.jpg"
        visualAlt="鸿蒙智行 MPV 七座空间与落日意境"
      />

      {/* 车型列表 */}
      <section className="section bg-ink-50">
        <div className="container-page">
          {/* 面包屑 */}
          <nav className="mb-8 flex items-center gap-2 text-sm text-ink-400">
            <Link href="/" className="hover:text-brand">首页</Link>
            <span>/</span>
            <span className="text-ink-600">{HIMA_CATEGORY}</span>
          </nav>

          {cars.length === 0 ? (
            <div className="rounded-2xl border border-ink-100 bg-white p-12 text-center">
              <p className="text-lg font-medium text-ink-600">专区车型信息即将上线</p>
              <p className="mt-2 text-sm text-ink-400">如需了解鸿蒙智行车型详情，欢迎联系我们</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {cars.map((car) => (
                <article
                  key={car.slug}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100 transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-brand-200"
                >
                  {/* 车型图 */}
                  <Link href={`/products/${car.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-ink-100">
                    {car.coverImage && (
                      <Image
                        src={car.coverImage}
                        alt={car.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 1024px) 100vw, 33vw"
                      />
                    )}
                    <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand backdrop-blur-sm">
                      {HIMA_CATEGORY}
                    </span>
                  </Link>

                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="text-xl font-bold text-ink transition-colors group-hover:text-brand">
                      {car.name}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-ink-500">{car.description}</p>

                    {/* 价格区间 */}
                    {car.priceRange && (
                      <div className="mt-5 rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white px-4 py-3">
                        <p className="text-xs font-medium text-ink-400">建议零售价</p>
                        <p className="mt-1 text-lg font-bold text-brand">
                          {car.priceRange}
                          {car.priceNote && (
                            <span className="ml-2 block text-xs font-normal text-ink-400">
                              {car.priceNote}
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    {/* 核心配置 */}
                    {car.features.length > 0 && (
                      <div className="mt-5">
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
                          <Sparkles className="h-4 w-4 text-brand" />
                          核心配置
                        </h3>
                        <ul className="space-y-2.5">
                          {car.features.map((f) => (
                            <li key={f.title} className="flex items-start gap-2">
                              <BadgeCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand" />
                              <span className="text-sm leading-relaxed text-ink-600">
                                <span className="font-semibold text-ink-700">{f.title}</span>
                                <span className="mx-1 text-ink-300">·</span>
                                {f.detail}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 适用场景 */}
                    {car.scenarios.length > 0 && (
                      <div className="mt-5">
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
                          <MapPin className="h-4 w-4 text-brand" />
                          适用场景
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {car.scenarios.map((s) => (
                            <span
                              key={s}
                              className="rounded-full bg-ink-50 px-3 py-1 text-xs text-ink-600 ring-1 ring-ink-100"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CTA */}
                    <Link
                      href={`/products/${car.slug}`}
                      className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-600"
                    >
                      查看详细配置
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 交付业绩 */}
      <section className="section bg-white">
        <div className="container-page">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-ink sm:text-4xl">交付业绩</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-500 sm:text-base">
              覆盖政府采购入围、央企框架采购中标、公务用车交付、出行服务平台合作与门店批量交付等场景
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((a) => (
              <article
                key={a.title}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-ink-50">
                  <Image
                    src={a.image}
                    alt={a.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
                    {a.tag}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-base font-bold leading-snug text-ink">{a.title}</h3>
                  <p className="mt-2 text-xs font-medium text-brand">{a.meta}</p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-500">{a.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 合作咨询 */}
      <section className="section bg-white">
        <div className="container-page">
          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand px-8 py-10 text-center shadow-lg sm:px-12 sm:py-14">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">鸿蒙智行车型合作咨询</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/85">
              如需了解车型报价、配置定制、批量采购或政企用车方案，欢迎联系我们获取专属方案。
            </p>
            <Link
              href="/contact"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-brand transition-all hover:bg-brand-50"
            >
              立即咨询
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
