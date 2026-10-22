'use client';

import { useEffect } from 'react';
import { trackProductView } from '@/lib/api';

/**
 * 产品详情页匿名浏览埋点
 * - 仅上报产品 slug 与来源路径，不采集 IP/UA
 * - sessionStorage 按会话去重，避免刷新/StrictMode 重复计数
 */
export default function ProductViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `pv:${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    trackProductView(slug, window.location.pathname);
  }, [slug]);

  return null;
}
