'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import SiteLogo from '@/components/common/SiteLogo';
import { getFooterData } from '@/lib/api';
import { DEFAULT_FOOTER_CONTACT, DEFAULT_FOOTER_LINK_GROUPS } from '@/lib/footerDefaults';
import type { FooterContactData, FooterLinkData } from '@/lib/types';

// 静态兜底：API不可用时仍按此显示（保持首屏SSR/静态导出可用）
// — 抽出到 footerDefaults.ts 共享常量，联系我们页/首页 JSON-LD/Footer 三处兜底一致。
const FALLBACK: {
  contact: typeof DEFAULT_FOOTER_CONTACT;
  linkGroups: typeof DEFAULT_FOOTER_LINK_GROUPS;
} = {
  contact: DEFAULT_FOOTER_CONTACT,
  linkGroups: DEFAULT_FOOTER_LINK_GROUPS,
};

const GROUP_TITLE: Record<string, string> = {
  product: '产品与服务',
  solution: '解决方案',
  about: '关于我们',
  info: '快速链接',
  custom: '自定义',
};

/**
 * 根据 group 字段将扁平的 links 数组分组，按 sortOrder 排序。
 * 对空 groups 回退到 FALLBACK 中的对应分组，保证 4列栅格稳定。
 */
function groupLinks(
  flat: FooterLinkData[],
): Array<{ group: string; title: string; links: FooterLinkData[] }> {
  const byGroup: Record<string, FooterLinkData[]> = {};
  for (const l of flat) {
    if (!byGroup[l.group]) byGroup[l.group] = [];
    byGroup[l.group].push(l);
  }
  for (const k in byGroup) {
    byGroup[k].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  }
  const order = ['product', 'solution', 'about'];
  const allKeys = Object.keys(byGroup);
  const extras = allKeys.filter((g) => !order.includes(g));
  const groups = [...order, ...extras];
  return groups
    .filter((g) => byGroup[g]?.length || FALLBACK.linkGroups.find((x) => x.group === g)?.links?.length)
    .map((g) => ({
      group: g,
      title: GROUP_TITLE[g] ?? g,
      links: byGroup[g] ?? FALLBACK.linkGroups.find((x) => x.group === g)!.links,
    }));
}

export default function Footer() {
  const [contact, setContact] = useState<FooterContactData>(FALLBACK.contact);
  const [infoLinks, setInfoLinks] = useState<FooterLinkData[]>([]); // group="info" → 底栏链接（隐私/条款/地图...）
  const [colGroups, setColGroups] = useState(FALLBACK.linkGroups);
  const [year] = useState(() => new Date().getFullYear());

  useEffect(() => {
    let cancelled = false;
    getFooterData()
      .then((data) => {
        if (cancelled) return;
        if (data?.contact) setContact(data.contact);
        const flat = data?.links ?? [];
        const info = flat.filter((l) => l.group === 'info').sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
        setInfoLinks(info);
        const cols = groupLinks(flat.filter((l) => l.group !== 'info'));
        if (cols.length > 0) setColGroups(cols);
      })
      .catch(() => {
        // 接口失败：使用初始兜底，无视觉破坏
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer className="bg-brand-800 text-white">
      <div className="container-page py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* 品牌信息 */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" aria-label="新蓝恒成首页">
              {/* Footer专属：品牌蓝背景下，Logo统一反转为纯白色（保留alpha透明边缘） */}
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

          {/* 链接列（按 group 分组；列数与栅格匹配） */}
          {colGroups.map((col) => (
            <div key={col.group}>
              <h3 className="mb-4 text-sm font-semibold text-white">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.href}
                      target={link.openInNew ? '_blank' : undefined}
                      rel={link.openInNew ? 'noopener noreferrer' : undefined}
                      className="text-sm text-white/80 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 联系方式 */}
        <div className="mt-8 border-t border-white/20 pt-8">
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
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
          {/*
            底部版权栏：截图2版权文本放在左侧「原始位置」；行高垂直居中
            - 移动端：垂直堆叠，items-center 使左右两段都水平居中
            - 桌面端 (sm)：左右分开，items-center 强制左右中线对齐（截图2版权文本行高垂直居中在本行高度内）
            - gap: sm 用 gap-4 防止极小窗口换行压叠
          */}
          <div className="mt-6 flex flex-col items-stretch gap-4 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
            {/* 左：截图2内容（© 2026 湖南新蓝恒成信息技术有限公司 版权所有） — 行高垂直居中 */}
            <p className="m-0 flex flex-1 items-center justify-center leading-none py-1 sm:justify-start">
              © 2026 {contact.copyrightText}
            </p>
            {/* 右：隐私政策 · 服务条款 · 网站地图 — 行高与左侧版权垂直居中对齐 */}
            <p className="m-0 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 leading-none py-1 sm:justify-end">
              {infoLinks.length > 0 ? (
                infoLinks.map((link, i) => (
                  <span key={link.id} className="inline-flex items-center">
                    <Link
                      href={link.href}
                      target={link.openInNew ? '_blank' : undefined}
                      rel={link.openInNew ? 'noopener noreferrer' : undefined}
                      className="inline-flex items-center hover:text-white"
                    >
                      {link.label}
                    </Link>
                    {i < infoLinks.length - 1 ? <span className="mx-2 inline-flex items-center">·</span> : null}
                  </span>
                ))
              ) : (
                <>
                  <Link href="#" className="inline-flex items-center hover:text-white">隐私政策</Link>
                  <span className="mx-2 inline-flex items-center">·</span>
                  <Link href="#" className="inline-flex items-center hover:text-white">服务条款</Link>
                  <span className="mx-2 inline-flex items-center">·</span>
                  <Link href="#" className="inline-flex items-center hover:text-white">网站地图</Link>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
