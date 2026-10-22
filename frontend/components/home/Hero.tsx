import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, Cpu, Zap, Heart } from 'lucide-react';
import { getPageConfig } from '@/lib/api';
import HeroCarousel from '@/components/common/HeroCarousel';

// 价值卡片（文案严格与参考图一致）
const valueCards = [
  { icon: ShieldCheck, title: '安全可靠', subtitle: '多重防护，稳定运行' },
  { icon: Cpu, title: '技术创新', subtitle: '持续研发，追求卓越' },
  { icon: Zap, title: '高效协同', subtitle: '优化流程，提升效率' },
  { icon: Heart, title: '客户至上', subtitle: '专业服务，价值共赢' },
];

// 首页轮播默认图（后台配置缺失时兜底，与其他栏目同规格：1920 宽高清）
const defaultImages = [
  '/images/hero/hero_home.jpg',
  '/images/hero/hero_home_2.jpg',
  '/images/hero/hero_home_3.jpg',
  '/images/hero/hero_home_4.jpg',
  '/images/hero/hero_home_5.jpg',
];
// 各图默认跳转链接（按图片主题对应栏目页）
const defaultLinks: (string | null)[] = ['/products', '/solutions', '/about', '/products', '/contact'];

export default async function Hero() {
  // 后台 home/hero 配置驱动轮播（与 PageHero 同一数据模式），缺省回退默认值
  const cfg = await getPageConfig('home', 'hero');
  const cfgImages: string[] = Array.isArray(cfg?.visualImages)
    ? cfg.visualImages.filter((s: unknown): s is string => typeof s === 'string' && s.length > 0)
    : [];
  const images = cfgImages.length > 0 ? cfgImages : defaultImages;
  const rawLinks: unknown[] = Array.isArray(cfg?.visualLinks) ? cfg.visualLinks : [];
  const links = images.map((_, i) => {
    const v = rawLinks[i];
    return typeof v === 'string' && v.startsWith('/') ? v : defaultLinks[i] ?? null;
  });

  return (
    <>
      {/* ==================== Hero 主视觉区（全屏轮播，与其他栏目一致） ==================== */}
      <section className="relative overflow-hidden bg-ink">
        {/* 轮播背景：自动播放 + 手动切换 + 淡入淡出 + 点击跳转对应页面；
            圆点上移避开下方价值卡片重叠区 */}
        <HeroCarousel
          images={images}
          alt="新蓝恒成企业形象"
          links={links}
          dotsClassName="bottom-20"
        />

        {/* 蒙版（与 PageHero 相同体系）：横向左深右浅 + 纵向压边，半通透明亮 */}
        <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-r from-slate-950/70 via-slate-900/40 to-slate-900/10 max-lg:from-slate-950/75 max-lg:via-slate-950/50 max-lg:to-slate-950/30" />
        <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-slate-950/45 via-transparent to-slate-950/25" />

        {/* 内容 */}
        <div className="container-page relative z-10 flex items-center py-28 lg:py-36">
          {/* 容器加宽（从 max-w-2xl → 响应式 4xl/5xl），给单行 16 字 + 3 逗号标语留足水平空间 */}
          <div className="relative w-full max-w-[92vw] sm:max-w-4xl xl:max-w-5xl">
            {/* 文字局部柔光底衬（与 PageHero 一致，守住可读性） */}
            <div
              aria-hidden
              className="absolute -inset-x-8 -inset-y-10 rounded-[2.5rem] bg-slate-950/40 blur-2xl"
            />
            <div className="relative">
              {/* 主标题：强制单行不换行，保持原逗号分隔、原顺序；随视口平滑缩放字号 */}
              <h1 className="whitespace-nowrap break-keep text-[17px] font-bold leading-none tracking-[0.02em] text-white [text-shadow:0_2px_16px_rgba(2,6,23,0.8)] sm:text-[30px] md:text-[38px] lg:text-[44px] xl:text-[52px]">
                新以拓界，蓝以载智，恒以守诺，成以共赢
              </h1>

              {/* 简介双行（文案严格与参考图一致） */}
              <p className="mt-6 max-w-lg text-sm leading-relaxed text-white/90 [text-shadow:0_1px_10px_rgba(2,6,23,0.7)] sm:text-base lg:mt-8 lg:leading-8">
                湖南新蓝恒成致力于以技术创新驱动行业发展，
                <br />
                为客户提供安全、可靠、高效的产品与解决方案。
              </p>

              {/* 单 CTA 按钮 */}
              <div className="mt-8 lg:mt-10">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 rounded-md bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-900/30 transition-colors hover:bg-brand-600 sm:text-base"
                >
                  了解更多
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 核心价值卡片（向上重叠 Hero 底部） ==================== */}
      <section className="relative z-20 -mt-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-100">
            <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
              {valueCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="flex items-center gap-4 p-6 lg:p-7"
                  >
                    {/* 左侧：蓝色圆形白图标 */}
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand text-white lg:h-12 lg:w-12">
                      <Icon className="h-5 w-5 lg:h-[22px] lg:w-[22px]" />
                    </div>
                    {/* 右侧：标题 + 副标题 */}
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-bold text-ink lg:text-base">
                        {card.title}
                      </div>
                      <div className="mt-1 text-sm text-ink-500">{card.subtitle}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 关于我们入口标题（带 ABOUT US 水印大字） ==================== */}
      <section className="relative pt-20 pb-6 lg:pt-28 lg:pb-8">
        {/* 背景层：ABOUT US 超大浅灰水印 */}
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-hidden pt-8 lg:pt-10">
          <span className="select-none text-[110px] font-black uppercase leading-none text-gray-100 sm:text-[140px] lg:text-[180px]">
            ABOUT US
          </span>
        </div>

        {/* 前景层：关于我们标题 */}
        <div className="container-page relative z-10 text-center">
          <h2 className="text-2xl font-bold text-ink lg:text-3xl">关于我们</h2>
        </div>
      </section>

      {/* ==================== 关于我们主体内容 ==================== */}
      <section className="pb-16 lg:pb-24">
        <div className="container-page">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">
            {/* 图片 */}
            <div className="relative aspect-video overflow-hidden rounded-2xl shadow-xl">
              <Image
                src="/images/mockup_reception.png"
                alt="新蓝恒成前台接待"
                fill
                className="object-cover"
                sizes="(max-width: 1200px) 100vw, 50vw"
              />
            </div>

            {/* 文案 */}
            <div>
              <h3 className="text-2xl font-bold text-ink">关于新蓝恒成</h3>
              <p className="mt-4 text-base leading-relaxed text-ink-600 sm:text-lg">
                湖南新蓝恒成信息技术有限公司成立于长沙，是一家专注于信息技术服务与解决方案的创新型企业。我们秉承&ldquo;外稳内动，恒久达成&rdquo;的理念，为客户提供优质的产品与服务。
              </p>
              <p className="mt-4 text-base leading-relaxed text-ink-600 sm:text-lg">
                公司业务涵盖智能车辆管理、车联网安全、智慧出行等领域，致力于用技术创新推动行业发展。
              </p>
              <Link
                href="/about"
                className="mt-6 inline-flex items-center gap-2 text-base font-semibold text-brand transition-colors hover:text-brand-700"
              >
                了解更多
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
