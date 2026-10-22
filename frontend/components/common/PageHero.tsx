import Image from 'next/image';
import { getPageConfig } from '@/lib/api';
import HeroCarousel from './HeroCarousel';

interface PageHeroProps {
  /** 页面标识（对应后端 PageConfig.page）：about | products | solutions | news | careers | contact */
  page: string;
  /** 默认标题（后台配置缺失时兜底） */
  title: string;
  /** 默认副标题 */
  subtitle: string;
  /** 默认全屏背景图（/images/hero/... 本地路径） */
  visualImage: string;
  /** 默认背景图 alt */
  visualAlt: string;
}

/**
 * 全屏 Hero 横幅：背景图（可多张轮播）铺满整个区域（object-cover 适配任意分辨率），
 * 半透明蒙版（横向渐变 + 纵向渐变 + 文字局部柔光底衬）+ 文字阴影保证可读性，
 * 内容以后台 PageConfig(hero) 为准、默认值为兜底；
 * 后台配置 visualImages 数组（≥2 张）时启用自动轮播，否则单图展示。
 */
export default async function PageHero({
  page,
  title,
  subtitle,
  visualImage,
  visualAlt,
}: PageHeroProps) {
  const cfg = await getPageConfig(page, 'hero');
  const finalTitle = cfg?.title ?? title;
  const finalSubtitle = cfg?.subtitle ?? subtitle;
  const finalImage = cfg?.visualImage ?? visualImage;
  const finalAlt = cfg?.visualAlt ?? visualAlt;
  // 轮播图列表：后台 visualImages 有效则用之（过滤空值），否则回退单图
  const cfgImages: string[] = Array.isArray(cfg?.visualImages)
    ? cfg.visualImages.filter((s: unknown): s is string => typeof s === 'string' && s.length > 0)
    : [];
  const images = cfgImages.length > 0 ? cfgImages : [finalImage];
  // 各图点击跳转链接（与 images 下标对齐，主题为对应栏目页；缺省不可点击）
  const rawLinks: unknown[] = Array.isArray(cfg?.visualLinks) ? cfg.visualLinks : [];
  const links = images.map((_, i) => {
    const v = rawLinks[i];
    return typeof v === 'string' && v.startsWith('/') ? v : null;
  });

  return (
    <section className="relative overflow-hidden bg-ink pt-16 lg:pt-20">
      {/* 全屏背景：≥2 张启用轮播（自动播放+手动切换+淡入淡出+点击跳转对应页面），
          单图直接展示；brightness-[1.15] 提升整体亮度（+15%，画面更明亮通透、不过曝） */}
      {images.length > 1 ? (
        <HeroCarousel images={images} alt={finalAlt} links={links} />
      ) : (
        <Image
          src={finalImage}
          alt={finalAlt}
          fill
          priority
          className="object-cover brightness-[1.15]"
          sizes="100vw"
        />
      )}

      {/* 遮罩层 1：左深右浅横向渐变，增大透明度呈轻盈半透，底层画面清晰展现；
          移动端文字居中，整体略深但保持通透 */}
      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-r from-slate-950/70 via-slate-900/40 to-slate-900/10 max-lg:from-slate-950/75 max-lg:via-slate-950/50 max-lg:to-slate-950/30" />
      {/* 遮罩层 2：纵向渐变，轻柔压暗顶部导航区与底部边缘过渡 */}
      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-slate-950/45 via-transparent to-slate-950/25" />

      {/* 文字内容区（左对齐，移动端居中） */}
      <div className="container-page relative z-10 flex min-h-[380px] flex-col justify-center py-16 sm:min-h-[420px] lg:min-h-[480px] lg:py-24">
        <div className="relative max-w-2xl text-center lg:text-left">
          {/* 遮罩层 3：文字局部柔光底衬，羽化文字背后的图片细节，不遮挡图片主体 */}
          <div
            aria-hidden
            className="absolute -inset-x-8 -inset-y-10 rounded-[2.5rem] bg-slate-950/40 blur-2xl"
          />
          <div className="relative">
            <h1 className="text-3xl font-bold text-white [text-shadow:0_2px_16px_rgba(2,6,23,0.8)] sm:text-4xl lg:text-5xl">
              {finalTitle}
            </h1>
            <p className="mt-4 text-lg text-white/90 [text-shadow:0_1px_10px_rgba(2,6,23,0.7)] sm:mt-6 sm:text-xl">
              {finalSubtitle}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
