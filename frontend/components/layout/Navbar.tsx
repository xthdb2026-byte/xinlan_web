'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import SiteLogo from '@/components/common/SiteLogo';

const navLinks = [
  { href: '/', label: '首页' },
  { href: '/about', label: '关于我们' },
  { href: '/products', label: '产品与服务' },
  { href: '/hima', label: '鸿蒙智行' },
  { href: '/solutions', label: '解决方案' },
  { href: '/news', label: '新闻中心' },
  { href: '/careers', label: '加入我们' },
  { href: '/contact', label: '联系我们' },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // 路由切换时关闭移动菜单
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // 移动菜单打开时锁定 body 滚动
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white">
        <nav className="container-page flex h-[72px] items-center justify-between">
          {/* Logo：企业官方横版图标（盾牌+火焰+中英文，经 SiteLogo 三层架构加载） */}
          <Link href="/" className="flex items-center" aria-label="新蓝恒成首页">
            <SiteLogo variant="navbar-desktop" />
          </Link>

          {/* 桌面导航 + 选中态底部蓝色短下划线 */}
          <div className="hidden items-center lg:flex">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-[26px] text-sm font-medium transition-colors ${
                    active ? 'text-brand' : 'text-ink-700 hover:text-brand'
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-full bg-brand" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* 桌面 CTA 按钮（无箭头） */}
          <div className="hidden lg:block">
            <Link
              href="/contact"
              className="inline-flex items-center rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              合作咨询
            </Link>
          </div>

          {/* 移动汉堡按钮 */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="inline-flex items-center justify-center rounded-md p-2 text-ink-700 hover:bg-gray-50 lg:hidden"
            aria-label="打开菜单"
          >
            <Menu className="h-6 w-6" />
          </button>
        </nav>
      </header>

      {/* 移动端抽屉菜单 */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-ink-100 px-4">
              <SiteLogo variant="navbar-mobile" />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md p-2 text-ink-500 hover:bg-ink-50 hover:text-ink"
                aria-label="关闭菜单"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block border-l-4 px-6 py-3 text-base font-medium transition-colors ${
                    isActive(link.href)
                      ? 'border-brand bg-brand-50 text-brand'
                      : 'border-transparent text-ink-700 hover:bg-ink-50 hover:text-brand'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="border-t border-ink-100 p-4">
              <Link
                href="/contact"
                className="flex w-full items-center justify-center rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
              >
                合作咨询
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
