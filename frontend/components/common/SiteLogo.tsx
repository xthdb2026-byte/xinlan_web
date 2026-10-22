'use client';

import Image from 'next/image';
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  type CSSProperties,
} from 'react';
import { getCurrentLogo, getMediaUrl } from '@/lib/api';
import type { CurrentLogo } from '@/lib/types';
import {
  siteLogoConfig,
  type SiteLogoVariant,
} from '@/config/siteLogo';
import LogoImage from './LogoImage';

export interface SiteLogoProps {
  /** 场景变体，决定尺寸和预加载策略 */
  variant: SiteLogoVariant;
  /** 可选：高度覆盖（px），不传则用 siteLogoConfig 预设 */
  height?: number;
  /** 可选：最小宽度覆盖（px） */
  minWidth?: number;
  /** 可选：容器额外 className（叠加到 siteLogoConfig.style.wrapperClassName） */
  className?: string;
  /** 可选：容器额外 inline style */
  style?: CSSProperties;
  /** 可选：图片额外 className */
  imageClassName?: string;
  /** 可选：alt 文本覆盖，默认使用 brand.name */
  alt?: string;
  /** 可选：是否渲染品牌文字（Logo 旁边），默认 false */
  showBrandText?: boolean;
  /** 可选：brandText 额外 className */
  brandTextClassName?: string;
  /** 可选：仅当 custom 失败时才走 fallback（测试/调试用） */
  disableFallbackLogo?: boolean;
  /** 可选：强制使用纯文本（测试兜底链用） */
  forceTextFallback?: boolean;
}

type FallbackStage = (typeof siteLogoConfig.fallbackChain)[number];

/** 计算"当前窗口"对应的响应式高度 */
function resolveResponsiveHeight(variant: SiteLogoVariant): number {
  const preset = siteLogoConfig.sizes[variant];
  if (typeof window === 'undefined' || !preset.responsive) return preset.height;
  const w = window.innerWidth;
  const map: Array<[number, number]> = [];
  if (preset.responsive.sm) map.push([640, preset.responsive.sm]);
  if (preset.responsive.md) map.push([768, preset.responsive.md]);
  if (preset.responsive.lg) map.push([1024, preset.responsive.lg]);
  if (preset.responsive.xl) map.push([1280, preset.responsive.xl]);
  if (preset.responsive['2xl']) map.push([1536, preset.responsive['2xl']]);
  let h = preset.height;
  for (const [bp, bpHeight] of map) {
    if (w >= bp) h = bpHeight;
  }
  return h;
}

export default function SiteLogo({
  variant,
  height: heightOverride,
  minWidth: minWidthOverride,
  className,
  style,
  imageClassName,
  alt,
  showBrandText = false,
  brandTextClassName,
  disableFallbackLogo = false,
  forceTextFallback = false,
}: SiteLogoProps) {
  const preset = siteLogoConfig.sizes[variant];
  const mountTime = useRef<number>(Date.now());
  const faviconUpdated = useRef(false);

  // 1) 从后台拉自定义 Logo
  const [customLogo, setCustomLogo] = useState<CurrentLogo | null>(null);
  const [customFetched, setCustomFetched] = useState(false);
  useEffect(() => {
    let cancelled = false;
    getCurrentLogo()
      .then((data) => {
        if (!cancelled) setCustomLogo(data);
      })
      .catch(() => {
        if (!cancelled) {
          setCustomLogo({
            url: null,
            isDefault: false,
            fallbackIcon: siteLogoConfig.staticFallback.svgIcon,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setCustomFetched(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) 当前窗口响应式高度（监听 resize 刷新）
  const [boxH, setBoxH] = useState<number>(() =>
    heightOverride ?? resolveResponsiveHeight(variant),
  );
  useEffect(() => {
    if (heightOverride !== undefined) {
      setBoxH(heightOverride);
      return;
    }
    if (typeof window === 'undefined') return;
    const handler = () => setBoxH(resolveResponsiveHeight(variant));
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [variant, heightOverride]);

  // 3) 图片加载后根据真实宽高撑开容器宽度（objectFit: contain 下完整显示）
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const minW = minWidthOverride ?? preset.minWidth;
  const boxW = naturalSize && naturalSize.h > 0
    ? Math.max(minW, Math.round((boxH * naturalSize.w) / naturalSize.h))
    : minW;

  // 4) fallback 链：选择当前渲染使用的 src
  // - hasErrored / setHasErrored ：标记 Image 加载已完全失败（所有图片类 stage 均已跳过）
  // - stageRef 代替 state+queueMicrotask ：避免 render-phase useMemo factory 中异步 setState 触发
  //   "Can't perform a React state update on a component that hasn't mounted yet" 警告。
  //   ref 在同一次 re-render 中同步写同步读；re-render 的驱动由 deps（customLogo/hasErrored）负责。
  const [hasErrored, setHasErrored] = useState(false);
  const stageRef = useRef<FallbackStage>('custom');
  function setStageSilent(s: FallbackStage) {
    stageRef.current = s;
  }
  const computedSrc = useMemo<string | null>(() => {
    if (forceTextFallback) return null;
    const chain = siteLogoConfig.fallbackChain;
    for (const s of chain) {
      switch (s) {
        case 'custom': {
          if (customLogo?.url && !hasErrored) {
            setStageSilent('custom');
            return getMediaUrl(customLogo.url);
          }
          break;
        }
        case 'fallback-logo': {
          if (!disableFallbackLogo && !hasErrored) {
            setStageSilent('fallback-logo');
            return siteLogoConfig.staticFallback.logo;
          }
          break;
        }
        case 'fallback-svg': {
          if (!hasErrored) {
            setStageSilent('fallback-svg');
            return siteLogoConfig.staticFallback.svgIcon;
          }
          break;
        }
        case 'text-only':
        default:
          setStageSilent('text-only');
          return null;
      }
    }
    setStageSilent('text-only');
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customLogo?.url, hasErrored, disableFallbackLogo, forceTextFallback]);

  const finalStage = stageRef.current;

  // 5) 图片加载完成 → 更新自然尺寸 + 同步 favicon
  const handleLoad = useCallback(
    (img: HTMLImageElement) => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w && h) {
        setNaturalSize((prev) => {
          if (prev?.w === w && prev?.h === h) return prev;
          return { w, h };
        });
        // 同步写父容器 style，保证首屏尺寸正确（避免 setState 异步延迟）
        const parent = img.parentElement as HTMLElement | null;
        if (parent) {
          const expectedW = `${Math.max(minW, Math.round((boxH * w) / h))}px`;
          if (parent.style.width !== expectedW) parent.style.width = expectedW;
          parent.style.height = `${boxH}px`;
        }
      }
      // 关键位置（navbar-desktop）成功加载后，同步 favicon
      if (
        siteLogoConfig.syncFavicon &&
        (variant === 'navbar-desktop' || variant === 'hero') &&
        !faviconUpdated.current &&
        finalStage !== 'text-only'
      ) {
        faviconUpdated.current = true;
        // favicon 必须为正方形以避免浏览器标签页变形：
        // 若当前渲染的 Logo 是"横版含文字"（w > h * 1.2），则自动改用纯盾牌正方形图标（logoWithText）或 SVG
        const isHorizontal = w > h * 1.2;
        const faviconHref = isHorizontal
          ? (siteLogoConfig.staticFallback.logoWithText ?? siteLogoConfig.staticFallback.svgIcon)
          : (img.currentSrc || img.src);
        document
          .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
          .forEach((link) => {
            link.removeAttribute('type');
            link.removeAttribute('sizes');
            link.setAttribute('href', faviconHref);
          });
      }
    },
    [variant, boxH, minW, finalStage],
  );

  // 6) 加载失败 → 进入 fallback 链下一级
  const handleError = useCallback(() => {
    const chain = siteLogoConfig.fallbackChain;
    const curIdx = chain.indexOf(finalStage);
    // 只对"图片类"stage 触发错误降级；text-only 已到底部，不再重复报错
    const isImageStage = finalStage === 'custom' || finalStage === 'fallback-logo' || finalStage === 'fallback-svg';
    if (!isImageStage) return;
    const currentSrc = computedSrc ?? 'unknown';
    console.warn(
      `[SiteLogo] LOAD FAILED stage=${finalStage} src=${currentSrc} variant=${variant} elapsed=${Date.now() - mountTime.current}ms — moving down fallback chain`,
    );
    const next = chain[curIdx + 1];
    if (next) {
      // 置错：让 computedSrc 的 memo 中 custom/fallback-logo 跳过
      if (finalStage === 'custom') {
        // custom 阶段失败 → 进入 static fallback，不整体标记 errored
        // 用 customFetched + 强制让 custom.url 无效化
        setCustomLogo((prev) => (prev ? { ...prev, url: null } : prev));
      } else {
        setHasErrored(true);
      }
    } else {
      setHasErrored(true);
    }
  }, [finalStage, computedSrc, variant]);

  // 7) 组装渲染输出
  const wrapperCls = [
    siteLogoConfig.style.wrapperClassName ?? '',
    className ?? '',
    'relative flex-shrink-0 flex items-center justify-center select-none',
  ].join(' ').trim();
  const imgCls = [
    siteLogoConfig.style.imageClassName ?? '',
    imageClassName ?? '',
  ].join(' ').trim();

  const brandAlt = alt ?? siteLogoConfig.brand.name;

  const isPreload = siteLogoConfig.image.preload?.[variant] === true;
  const unoptimized = !siteLogoConfig.image.optimize;
  const objectFit = siteLogoConfig.image.objectFit;

  return (
    <div className="flex items-center gap-3">
      <div
        className={wrapperCls}
        style={{
          width: `${boxW}px`,
          height: `${boxH}px`,
          ...style,
        }}
        aria-label={brandAlt}
      >
        {finalStage === 'text-only' ? (
          <div
            className={[
              siteLogoConfig.style.textClassName ?? '',
              'flex items-center justify-center w-full h-full bg-brand text-white rounded-md text-xs',
            ].join(' ').trim()}
            title={brandAlt}
          >
            {brandAlt.slice(0, 2)}
          </div>
        ) : (
          computedSrc && (
            <LogoImage
              location={variant}
              src={computedSrc}
              alt={brandAlt}
              fill
              sizes={`${boxW}px`}
              priority={isPreload}
              unoptimized={unoptimized}
              className={imgCls || undefined}
              style={{ objectFit }}
              onError={handleError}
              onLoadingComplete={handleLoad}
              // 在 custom 尚未 fetch 前先不渲染 Image，避免无谓 fallback 抖动
              key={`${finalStage}-${computedSrc}-${customFetched ? 'fetched' : 'pending'}`}
            />
          )
        )}
      </div>
      {showBrandText ? (
        <div className="flex flex-col leading-tight">
          <span
            className={[
              'font-bold text-ink',
              brandTextClassName ?? '',
            ].join(' ').trim()}
          >
            {siteLogoConfig.brand.name}
          </span>
          {siteLogoConfig.brand.nameEn ? (
            <span className="text-[10px] font-semibold tracking-widest text-ink-400 uppercase">
              {siteLogoConfig.brand.nameEn}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// 方便纯静态场景（SSR 或后台还没配好时）使用
export function StaticSiteLogo(props: Omit<SiteLogoProps, 'variant'> & { variant?: SiteLogoVariant }) {
  return <SiteLogo variant={props.variant ?? 'other' as SiteLogoVariant} {...props} />;
}
