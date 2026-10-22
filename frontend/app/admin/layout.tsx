'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Newspaper,
  Package,
  Lightbulb,
  Briefcase,
  MessageSquare,
  FileText,
  LogOut,
  Shield,
  Menu,
  X,
  Image,
  Settings,
  PanelBottomOpen,
  ExternalLink,
  FolderDown,
  Home,
  ScrollText,
  GalleryHorizontal,
  Link2,
  Users,
} from 'lucide-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

const menuItems = [
  { href: '/admin', label: '仪表盘', icon: LayoutDashboard },
  { href: '/admin/news', label: '新闻管理', icon: Newspaper },
  { href: '/admin/products', label: '产品管理', icon: Package },
  { href: '/admin/products/documents', label: '资料文档', icon: FolderDown },
  { href: '/admin/solutions', label: '方案管理', icon: Lightbulb },
  { href: '/admin/jobs', label: '职位管理', icon: Briefcase },
  { href: '/admin/media', label: '媒体库', icon: Image },
  { href: '/admin/logos', label: 'Logo 管理', icon: Settings },
  { href: '/admin/page-configs', label: '页面配置', icon: Home },
  { href: '/admin/banners', label: '轮播 Banner', icon: GalleryHorizontal },
  { href: '/admin/friend-links', label: '友情链接', icon: Link2 },
  { href: '/admin/footer', label: '底部内容', icon: PanelBottomOpen },
  { href: '/admin/messages', label: '留言管理', icon: MessageSquare },
  { href: '/admin/applications', label: '投递管理', icon: FileText },
  { href: '/admin/audit-logs', label: '操作日志', icon: ScrollText },
  { href: '/admin/users', label: '用户管理', icon: Users, adminOnly: true },
];

// 前台官网地址：
// - 优先读 NEXT_PUBLIC_SITE_URL（生产部署时显式注入正式域名，例：https://xinlanhengcheng.com）
// - 未配置时回退到当前部署下的前台首页（相对路径 '/'），避免域名尚未上线/DNS 未解析场景下"内部网站链接无法打开"
const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || '/';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  );
}

function AdminLayoutContent({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, pathname]);

  // 路由变化时自动关闭侧边栏（避免 Link onClick 同步 setState 打断导航）
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // 登录页直接渲染，不显示侧边栏
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <div className="text-ink-500">加载中...</div>
      </div>
    );
  }

  if (!user) return null;

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-ink-50">
      {/* 移动端遮罩 - 始终渲染，通过CSS控制可见性，避免ghost click */}
      <div
        className={`fixed inset-0 z-40 bg-ink/50 lg:hidden ${
          sidebarOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* 侧边栏 - 使用left切换，无过渡动画避免React StrictMode下CSSTransition卡住 */}
      <aside
        className={`fixed inset-y-0 z-50 flex w-64 flex-col bg-ink text-ink-300 lg:static lg:left-0 ${
          sidebarOpen ? 'left-0' : 'left-[-16rem]'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-ink-700 px-6">
          <Shield className="h-7 w-7 text-brand" />
          <span className="text-lg font-bold text-white">管理后台</span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto rounded-md p-1 text-ink-400 hover:bg-ink-700 hover:text-white lg:hidden"
            aria-label="关闭菜单"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 菜单 */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand text-white'
                    : 'text-ink-300 hover:bg-ink-700 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 底部用户信息 */}
        <div className="shrink-0 border-t border-ink-700 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">
                {user.username}
              </div>
              <div className="truncate text-xs text-ink-400">
                {user.role === 'admin' ? '管理员' : '编辑'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-ink-600 px-3 py-2 text-sm font-medium text-ink-300 transition-colors hover:border-red-500 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* 顶部栏 */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink-100 bg-white px-4 shadow-sm lg:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 text-ink-600 hover:bg-ink-50 lg:hidden"
            aria-label="打开菜单"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="text-sm text-ink-500 lg:hidden">新蓝恒成管理后台</div>
          <div className="ml-auto flex items-center gap-5 text-sm">
            {/* 访问前台官网（外部链接）：新标签打开 + 安全 rel + 品牌色下划线 hover */}
            <a
              href={PUBLIC_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="访问新蓝恒成官方网站（在新标签页打开）"
              className="hidden items-center gap-1.5 text-ink-500 transition-colors hover:text-brand hover:underline lg:inline-flex"
            >
              <span>访问新蓝恒成网站</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            {/* 移动端：仅展示外部链接图标，节省横向空间；点击跳转前台 */}
            <a
              href={PUBLIC_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="访问新蓝恒成官方网站（在新标签页打开）"
              className="inline-flex items-center rounded-md p-1.5 text-ink-500 transition-colors hover:text-brand hover:bg-ink-50 lg:hidden"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <span className="hidden text-ink-500 lg:inline">
              欢迎回来，{user.username}
            </span>
          </div>
        </header>

        {/* 内容 */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
