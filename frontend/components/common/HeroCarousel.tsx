'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroCarouselProps {
  /** 轮播图片路径列表（≥2 张） */
  images: string[];
  /** 图片 alt（各张共用页面级描述） */
  alt: string;
  /** 各张图片的点击跳转链接（与 images 按下标对齐；空值表示该张不可点击） */
  links?: (string | null)[];
  /** 自动播放间隔 ms，默认 5000 */
  intervalMs?: number;
  /** 圆点指示器定位类（默认 bottom-5；底部有被重叠内容时可上移，如 bottom-20） */
  dotsClassName?: string;
}

/**
 * 全屏 Hero 轮播：交叉淡入淡出过渡 + 自动播放（悬停暂停）+ 箭头/圆点手动切换。
 * 配置了 links 的幻灯片整体可点击，跳转至其主题对应页面；
 * 仅当前激活帧可点（非激活帧 pointer-events 关闭且不可聚焦）。
 * 手动切换后自动播放重新计时，避免刚切走就被定时器跳页。
 */
export default function HeroCarousel({
  images,
  alt,
  links,
  intervalMs = 5000,
  dotsClassName = 'bottom-5',
}: HeroCarouselProps) {
  const count = images.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (idx: number) => setActive(((idx % count) + count) % count),
    [count],
  );

  // 自动播放：active 变化（含手动切换）时重启计时；悬停或仅剩一张时暂停
  useEffect(() => {
    if (paused || count <= 1) return;
    const timer = setInterval(() => {
      setActive((cur) => (cur + 1) % count);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [paused, count, intervalMs, active]);

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label={`${alt} 图片轮播`}
    >
      {/* 幻灯片：交叉淡入淡出（brightness 提升画面整体亮度）；有链接的帧整体可点击 */}
      {images.map((src, i) => {
        const isActive = i === active;
        const href = links?.[i] ?? null;
        const slideClass = `absolute inset-0 transition-opacity duration-1000 ease-in-out ${
          isActive ? 'z-[1] opacity-100' : 'pointer-events-none z-0 opacity-0'
        }`;
        const img = (
          <Image
            src={src}
            alt={isActive ? alt : ''}
            fill
            priority={i === 0}
            className="object-cover brightness-[1.15]"
            sizes="100vw"
          />
        );
        return (
          <div key={src} className={slideClass} aria-hidden={!isActive}>
            {href ? (
              <Link
                href={href}
                className="absolute inset-0 block"
                aria-label={`${alt} — 点击进入对应页面`}
                title="点击查看对应页面"
                tabIndex={isActive ? 0 : -1}
              >
                {img}
              </Link>
            ) : (
              img
            )}
          </div>
        );
      })}

      {/* 上一张 / 下一张（位于蒙版与文字层之上） */}
      <button
        type="button"
        onClick={() => go(active - 1)}
        aria-label="上一张"
        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-slate-950/40 p-2 text-white/90 backdrop-blur-sm transition-all hover:bg-slate-950/65 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={() => go(active + 1)}
        aria-label="下一张"
        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-slate-950/40 p-2 text-white/90 backdrop-blur-sm transition-all hover:bg-slate-950/65 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* 圆点指示器（位置可配，默认底部居中） */}
      <div className={`absolute left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 ${dotsClassName}`}>
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => go(i)}
            aria-label={`切换到第 ${i + 1} 张`}
            aria-current={i === active}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === active ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
