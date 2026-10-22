'use client';

import Link from 'next/link';
import SiteLogo from '@/components/common/SiteLogo';
import type { FooterContactData, FooterLinkData } from '@/lib/types';

const GROUP_TITLE: Record<string, string> = {
  product: '产品与服务',
  solution: '解决方案',
  about: '关于我们',
  info: '快速链接',
  custom: '自定义',
};

function groupLinks(flat: FooterLinkData[]): Array<{ group: string; title: string; links: FooterLinkData[] }> {
  const byGroup: Record<string, FooterLinkData[]> = {};
  for (const l of flat) {
    if (!byGroup[l.group]) byGroup[l.group] = [];
    byGroup[l.group].push(l);
  }
  for (const k in byGroup) {
    byGroup[k].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  }
  const order = ['product', 'solution', 'about'];
  const extras = Object.keys(byGroup).filter((g) => !order.includes(g));
  return [...order, ...extras]
    .map((g) => ({
      group: g,
      title: GROUP_TITLE[g] ?? g,
      links: byGroup[g] ?? [],
    }))
    .filter((x) => x.links.length > 0);
}

/**
 * 在管理界面里嵌入的"Footer实时预览"组件。
 * 直接接受 contact + links 参数，无需 useEffect 网络请求，
 * 保证输入编辑即时反映在预览区。
 */
export default function FooterPreview({
  contact,
  links,
  year = new Date().getFullYear(),
}: {
  contact: FooterContactData;
  links: FooterLinkData[];
  year?: number;
}) {
  const info = links.filter((l) => l.group === 'info').sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  const colGroups = (() => {
    const g = groupLinks(links.filter((l) => l.group !== 'info'));
    if (g.length === 0) {
      return [
        {
          group: 'product',
          title: '产品与服务',
          links: [
            { id: -1, group: 'product', label: '智能车辆管理', href: '/products', openInNew: false, sortOrder: 1 },
          ],
        },
        {
          group: 'solution',
          title: '解决方案',
          links: [
            { id: -2, group: 'solution', label: '政企车辆管理', href: '/solutions', openInNew: false, sortOrder: 1 },
          ],
        },
        {
          group: 'about',
          title: '关于我们',
          links: [
            { id: -3, group: 'about', label: '公司简介', href: '/about', openInNew: false, sortOrder: 1 },
          ],
        },
      ];
    }
    return g;
  })();

  return (
    <div className="overflow-hidden rounded-xl border border-ink-100 shadow-sm ring-1 ring-black/5">
      <div className="border-b border-ink-100 bg-ink-50 px-4 py-2 text-xs font-medium text-ink-500">
        实时预览 · 与前台 Footer 显示效果一致
      </div>
      <footer className="bg-brand-800 text-white">
        <div className="px-4 py-8 lg:px-8 lg:py-12">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" aria-label="首页">
                <SiteLogo
                  variant="footer"
                  imageClassName="brightness-0 invert"
                />
              </Link>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                {contact.companyName}
                <br />
                外稳内动，恒久达成
              </p>
            </div>
            {colGroups.map((col) => (
              <div key={col.group}>
                <h3 className="mb-3 text-sm font-semibold text-white">{col.title}</h3>
                <ul className="space-y-1.5">
                  {col.links.slice(0, 4).map((l) => (
                    <li key={l.id}>
                      <a
                        href={l.href}
                        onClick={(e) => e.preventDefault()}
                        target={l.openInNew ? '_blank' : undefined}
                        rel={l.openInNew ? 'noopener noreferrer' : undefined}
                        className="text-sm text-white/80 hover:text-white"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-white/20 pt-6">
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div className="text-white/80">
                <span className="text-white">地址：</span>
                {contact.address}
              </div>
              <div className="text-white/80">
                <span className="text-white">电话：</span>
                {contact.phone}
              </div>
              <div className="text-white/80">
                <span className="text-white">邮箱：</span>
                {contact.email}
              </div>
            </div>
            <div className="mt-5 flex flex-col items-center justify-between gap-2 text-xs text-white/60 sm:flex-row">
              <p>© {year} {contact.copyrightText}</p>
              <p>
                {(info.length > 0 ? info : [
                  { id: -99, group: 'info', label: '隐私政策', href: '#', openInNew: false, sortOrder: 1 },
                  { id: -98, group: 'info', label: '服务条款', href: '#', openInNew: false, sortOrder: 2 },
                  { id: -97, group: 'info', label: '网站地图', href: '#', openInNew: false, sortOrder: 3 },
                ] as FooterLinkData[]).map((l, i, arr) => (
                  <span key={l.id}>
                    <a
                      href={l.href}
                      onClick={(e) => e.preventDefault()}
                      target={l.openInNew ? '_blank' : undefined}
                      rel={l.openInNew ? 'noopener noreferrer' : undefined}
                      className="hover:text-white"
                    >
                      {l.label}
                    </a>
                    {i < arr.length - 1 ? <span className="mx-2">·</span> : null}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
