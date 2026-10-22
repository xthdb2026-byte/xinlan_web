import type { Metadata } from 'next';
import Image from 'next/image';
import { MapPin, Phone, Mail, Clock, MessageSquare } from 'lucide-react';
import ContactForm from '@/components/contact/ContactForm';
import PageHero from '@/components/common/PageHero';
import { getFooterData } from '@/lib/api';
import {
  DEFAULT_FOOTER_CONTACT,
  WORKING_HOURS_FALLBACK,
} from '@/lib/footerDefaults';
import type { FooterContactData } from '@/lib/types';

export const metadata: Metadata = {
  title: '联系我们',
  description:
    '联系新蓝恒成 — 如果您有任何合作意向或咨询需求，请通过表单或以下方式与我们联系，我们期待您的来信。',
  keywords: ['联系我们', '新蓝恒成联系方式', '合作咨询', '信息技术服务咨询'],
  alternates: {
    canonical: 'https://xinlanhengcheng.com/contact',
  },
  openGraph: {
    title: '联系我们 | 新蓝恒成',
    description:
      '联系新蓝恒成 — 如果您有任何合作意向或咨询需求，请通过表单或以下方式与我们联系，我们期待您的来信。',
    type: 'website',
    url: 'https://xinlanhengcheng.com/contact',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '联系我们 | 新蓝恒成',
    description: '如有合作意向或咨询需求，欢迎联系新蓝恒成',
  },
};

/**
 * SSR 安全获取 FooterContact：
 * - 命中：用后台「底部内容管理」中的真实数据（address/phone/email 三者联动）
 * - 失败：回落到 DEFAULT_FOOTER_CONTACT，保证首屏不空白、不 throw
 * - cache: force-cache + revalidate 60s，避免每访问一次 /contact 就打一次 backend
 */
async function getContactData(): Promise<FooterContactData> {
  try {
    const data = await getFooterData();
    if (data?.contact) return data.contact;
  } catch {
    /* 网络异常、后端未启动 — 静默走兜底 */
  }
  return DEFAULT_FOOTER_CONTACT;
}

/** 从 contact.extras 解析工作时间，兼容 object/string 两种形态。*/
function resolveWorkingHours(contact: FooterContactData): string {
  const extras = contact.extras;
  if (!extras) return WORKING_HOURS_FALLBACK;
  if (typeof extras === 'object' && extras !== null) {
    const raw = (extras as Record<string, unknown>).workingHours;
    if (typeof raw === 'string' && raw.trim()) return raw.trim();
  }
  return WORKING_HOURS_FALLBACK;
}

/** tel href：仅保留数字、+、- 字符，避免空格中文括号导致协议不识别。*/
function toTelHref(raw: string): string {
  return `tel:${raw.replace(/[^\d+\-]/g, '')}`;
}

/** mailto href：取第一个合法邮箱。*/
function toMailtoHref(raw: string): string {
  const m = raw.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  return `mailto:${m ? m[0] : raw.replace(/\s+/g, '')}`;
}

/** 地图导航 href：优先用高德 URI，兜底百度。地址做 URL encode。*/
function toGeoHref(rawAddress: string, company: string): string {
  const q = encodeURIComponent(`${company} ${rawAddress}`);
  return `https://uri.amap.com/search?keyword=${q}&src=webapp-company&callnative=1`;
}

export default async function ContactPage() {
  const contact = await getContactData();
  const workingHours = resolveWorkingHours(contact);

  const contactInfo: Array<{
    icon: typeof MapPin;
    label: string;
    value: string;
    href?: string;
    ariaLabel?: string;
  }> = [
    {
      icon: MapPin,
      label: '公司地址',
      value: contact.address,
      href: toGeoHref(contact.address, contact.companyName),
      ariaLabel: `在地图中查看公司地址：${contact.address}`,
    },
    {
      icon: Phone,
      label: '联系电话',
      value: contact.phone,
      href: toTelHref(contact.phone),
      ariaLabel: `拨打公司联系电话：${contact.phone}`,
    },
    {
      icon: Mail,
      label: '电子邮箱',
      value: contact.email,
      href: toMailtoHref(contact.email),
      ariaLabel: `发送邮件至公司邮箱：${contact.email}`,
    },
    {
      icon: Clock,
      label: '工作时间',
      value: workingHours,
    },
  ];

  return (
    <>
      {/* 页面 Banner（全屏背景图 + 渐变蒙版） */}
      <PageHero
        page="contact"
        title="联系我们"
        subtitle="如果您有任何合作意向或咨询需求，请通过表单或以下方式与我们联系"
        visualImage="/images/hero/hero_contact.jpg"
        visualAlt="商务伙伴办公室握手洽谈合作"
      />

      {/* 联系内容 */}
      <section className="section bg-ink-50">
        <div className="container-page">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-12">
            {/* 左侧：联系信息（现在完全从后台 FooterContact 数据驱动） */}
            <div className="lg:col-span-2">
              <h2 className="mb-6 text-2xl font-bold text-ink">联系方式</h2>
              <p className="mb-8 text-base leading-relaxed text-ink-500">
                {contact.companyName}期待与您的交流。无论您是想了解我们的产品与服务，还是寻求合作机会，我们都欢迎您的来信。
              </p>

              <div className="space-y-6">
                {contactInfo.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-ink-400">{item.label}</div>
                        {item.href ? (
                          <a
                            href={item.href}
                            aria-label={item.ariaLabel}
                            // tel:/mailto: 均使用 _blank 让协议处理器接管，替换当前窗口也可
                            target={item.href.startsWith('mailto:') ? undefined : item.href.startsWith('tel:') ? undefined : '_blank'}
                            rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                            className="mt-1 inline-block text-base font-semibold text-ink-700 transition-colors hover:text-brand hover:underline"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <div className="mt-1 text-base font-semibold text-ink-700">{item.value}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 提示卡片 */}
              <div className="mt-8 rounded-2xl border border-brand-100 bg-brand-50 p-6">
                <div className="mb-2 flex items-center gap-2 text-brand">
                  <MessageSquare className="h-5 w-5" />
                  <span className="font-semibold">在线咨询</span>
                </div>
                <p className="text-sm leading-relaxed text-ink-600">
                  填写右侧表单即可提交您的咨询，我们会在 1-2 个工作日内给予回复。请确保联系方式的准确性，以便我们及时与您取得联系。
                </p>
              </div>
            </div>

            {/* 右侧：联系表单 */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-ink-100 sm:p-8 lg:p-10">
                <h2 className="mb-6 text-2xl font-bold text-ink">在线咨询</h2>
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
