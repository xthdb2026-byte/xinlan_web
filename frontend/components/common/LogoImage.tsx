'use client';

import Image, { type ImageProps } from 'next/image';
import { useRef, useEffect, useCallback } from 'react';

type LogoLocation = 'navbar-desktop' | 'navbar-mobile' | 'footer' | 'hero' | 'print' | 'other';

interface LogoImageProps extends ImageProps {
  location: LogoLocation;
  /** 可选：外部自定义加载成功回调（在内部日志后执行） */
  onLogoLoad?: (img: HTMLImageElement) => void;
  /** 可选：外部自定义加载失败回调（在内部日志后执行） */
  onLogoError?: () => void;
}

export default function LogoImage({
  location,
  src,
  alt,
  onLogoLoad,
  onLogoError,
  onLoadingComplete,
  onError,
  ...rest
}: LogoImageProps) {
  const mountTime = useRef<number>(Date.now());
  const logged = useRef(false);

  useEffect(() => {
    const srcStr = typeof src === 'string' ? src : 'unknown';
    console.info(
      `[LogoImage] mount | location=${location} src=${srcStr} sizes=${rest.sizes ?? 'N/A'} priority=${rest.priority ?? false}`,
    );
  }, [location, src, rest.sizes, rest.priority]);

  const handleError = useCallback(() => {
    const srcStr = typeof src === 'string' ? src : 'unknown';
    console.error(
      `[LogoImage] LOAD FAILED | location=${location} src=${srcStr} elapsed=${Date.now() - mountTime.current}ms`,
    );
    onLogoError?.();
    if (onError) (onError as (e: React.SyntheticEvent<HTMLImageElement>) => void)(null as unknown as React.SyntheticEvent<HTMLImageElement>);
  }, [location, src, onLogoError, onError]);

  const handleLoad = useCallback(
    (img: HTMLImageElement) => {
      if (logged.current) {
        onLogoLoad?.(img);
        onLoadingComplete?.(img);
        return;
      }
      logged.current = true;
      const srcStr = typeof src === 'string' ? src : 'unknown';
      console.info(
        `[LogoImage] loaded | location=${location} src=${srcStr} natural=${img.naturalWidth}x${img.naturalHeight} elapsed=${Date.now() - mountTime.current}ms`,
      );
      onLogoLoad?.(img);
      onLoadingComplete?.(img);
    },
    [location, src, onLogoLoad, onLoadingComplete],
  );

  return (
    <Image
      {...rest}
      src={src}
      alt={alt}
      onError={handleError}
      onLoadingComplete={handleLoad}
      // Trae 浏览器自动化工具会在 DOM 元素上注入 data-trae-ref / data-trae-unmounted 等调试引用属性，
      // SSR 输出不包含这些属性，hydration 时会出现"Extra attributes from the server: data-trae-ref"警告。
      // 这里抑制仅开发/调试环境出现的非业务属性 hydration 噪声。
      suppressHydrationWarning
    />
  );
}
