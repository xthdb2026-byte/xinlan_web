import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Shell from './Shell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: '新蓝恒成 | 外稳内动，恒久达成',
    template: '%s | 新蓝恒成',
  },
  description:
    '湖南新蓝恒成信息技术有限公司 — 致力于提供安全可靠、技术创新的信息技术服务与解决方案。',
  keywords: ['新蓝恒成', 'Xinlan Hengcheng', '信息技术', '解决方案', '安全可靠'],
  metadataBase: new URL('https://xinlanhengcheng.com'),
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: '新蓝恒成 | 外稳内动，恒久达成',
    description: '湖南新蓝恒成信息技术有限公司 — 致力于提供安全可靠、技术创新的信息技术服务与解决方案。',
    type: 'website',
    locale: 'zh_CN',
    images: [{ url: '/icon-512x512.png', width: 512, height: 512, alt: '新蓝恒成 Logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '新蓝恒成 | 外稳内动，恒久达成',
    description: '湖南新蓝恒成信息技术有限公司',
    images: ['/icon-512x512.png'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: '#1a56db',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
