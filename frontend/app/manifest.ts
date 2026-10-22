import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '新蓝恒成',
    short_name: '新蓝恒成',
    description: '湖南新蓝恒成信息技术有限公司 — 外稳内动，恒久达成',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1a56db',
    icons: [
      { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-384x384.png', sizes: '384x384', type: 'image/png' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' as const },
    ],
  };
}
