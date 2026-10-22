import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Target, Eye, Heart, Users, Award, Building2 } from 'lucide-react';
import PageHero from '@/components/common/PageHero';

export const metadata: Metadata = {
  title: '关于我们',
  description:
    '湖南新蓝恒成信息技术有限公司 — 专注于信息技术服务与解决方案，秉承"外稳内动，恒久达成"的理念，为客户提供优质产品与服务。',
  keywords: ['新蓝恒成', '关于我们', '信息技术公司', '湖南新蓝恒成', '公司简介'],
  alternates: {
    canonical: 'https://xinlanhengcheng.com/about',
  },
  openGraph: {
    title: '关于我们 | 新蓝恒成',
    description:
      '湖南新蓝恒成信息技术有限公司 — 专注于信息技术服务与解决方案，秉承"外稳内动，恒久达成"的理念，为客户提供优质产品与服务。',
    type: 'website',
    url: 'https://xinlanhengcheng.com/about',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '关于我们 | 新蓝恒成',
    description: '湖南新蓝恒成信息技术有限公司 — 外稳内动，恒久达成',
  },
};

const milestones = [
  { year: '2020', title: '公司成立', desc: '湖南新蓝恒成信息技术有限公司在长沙正式成立' },
  { year: '2021', title: '业务拓展', desc: '推出智能车辆管理系统，服务首批政企客户' },
  { year: '2022', title: '技术突破', desc: '车联网安全解决方案研发成功，获得行业认可' },
  { year: '2023', title: '规模扩大', desc: '团队规模扩大，业务覆盖全省并辐射周边省份' },
  { year: '2024', title: '产品升级', desc: '智能车辆管理系统 2.0 发布，新增 AI 智能调度功能' },
  { year: '2026', title: '持续创新', desc: '系统 3.0 版本上线，荣获年度信息安全优秀企业奖' },
];

const values = [
  {
    icon: Target,
    title: '使命',
    content: '用技术创新推动行业发展，为客户创造持久价值',
  },
  {
    icon: Eye,
    title: '愿景',
    content: '成为信息技术服务领域的值得信赖的领军企业',
  },
  {
    icon: Heart,
    title: '价值观',
    content: '外稳内动，恒久达成 — 稳健经营，持续创新',
  },
];

const stats = [
  { number: '6+', label: '年行业经验' },
  { number: '50+', label: '服务客户' },
  { number: '30+', label: '团队成员' },
  { number: '10+', label: '技术专利' },
];

export default async function AboutPage() {
  return (
    <>
      {/* ==================== 页面 Banner（全屏背景图 + 渐变蒙版） ==================== */}
      <PageHero
        page="about"
        title="关于新蓝恒成"
        subtitle="外稳内动，恒久达成 — 致力于提供安全可靠、技术创新的信息技术服务与解决方案"
        visualImage="/images/hero/hero_about.jpg"
        visualAlt="上海陆家嘴黄昏天际线，展现现代企业总部气象"
      />

      {/* ==================== 公司简介 ==================== */}
      <section className="section bg-white">
        <div className="container-page">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">
            {/* 图片 */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
              <Image
                src="/images/mockup_reception.png"
                alt="新蓝恒成公司前台"
                fill
                className="object-cover"
                sizes="(max-width: 1200px) 100vw, 50vw"
                priority
              />
            </div>

            {/* 文案 */}
            <div>
              <span className="text-sm font-semibold uppercase tracking-wider text-brand">
                Company Profile
              </span>
              <h2 className="mt-2 section-title">公司简介</h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-ink-600">
                <p>
                  湖南新蓝恒成信息技术有限公司成立于长沙，是一家专注于信息技术服务与解决方案的创新型企业。公司秉承&ldquo;外稳内动，恒久达成&rdquo;的理念，以技术创新为核心驱动力，为客户提供优质的产品与服务。
                </p>
                <p>
                  公司业务涵盖智能车辆管理、车联网安全、智慧出行等领域，拥有一支经验丰富的研发团队和完善的技术服务体系。我们致力于用技术创新推动行业发展，为客户创造持久价值。
                </p>
                <p>
                  经过多年发展，新蓝恒成已在政企车辆管理、物流运输安全等细分市场建立了良好的口碑，服务客户遍布政府机关、物流企业、交通运输等多个行业。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 数据统计 ==================== */}
      <section className="bg-brand py-12 lg:py-16">
        <div className="container-page">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                  {stat.number}
                </div>
                <div className="mt-2 text-sm text-brand-100 lg:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 使命愿景价值观 ==================== */}
      <section className="section bg-ink-50">
        <div className="container-page">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="section-title">使命 · 愿景 · 价值观</h2>
            <p className="section-subtitle">我们坚守的信念与方向</p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {values.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-ink-100 bg-white p-8 text-center transition-all hover:shadow-lg"
                >
                  <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-ink">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-500">{item.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== 团队文化 ==================== */}
      <section className="section bg-white">
        <div className="container-page">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="section-title">团队文化</h2>
            <p className="section-subtitle">专业、协作、创新的团队精神</p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Polo 文化衫 */}
            <div className="group relative aspect-square overflow-hidden rounded-2xl shadow-md">
              <Image
                src="/images/mockup_polo.png"
                alt="新蓝恒成团队文化衫"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/80 via-transparent to-transparent p-6">
                <div>
                  <Users className="mb-2 h-6 w-6 text-white" />
                  <h3 className="text-lg font-bold text-white">团队形象</h3>
                  <p className="text-sm text-ink-200">统一的团队标识</p>
                </div>
              </div>
            </div>

            {/* 工牌 */}
            <div className="group relative aspect-square overflow-hidden rounded-2xl shadow-md">
              <Image
                src="/images/mockup_employee_id.png"
                alt="新蓝恒成员工工牌"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/80 via-transparent to-transparent p-6">
                <div>
                  <Award className="mb-2 h-6 w-6 text-white" />
                  <h3 className="text-lg font-bold text-white">专业身份</h3>
                  <p className="text-sm text-ink-200">规范的职业形象</p>
                </div>
              </div>
            </div>

            {/* 手提袋 */}
            <div className="group relative aspect-square overflow-hidden rounded-2xl shadow-md sm:col-span-2 lg:col-span-1">
              <Image
                src="/images/mockup_tote_bag.png"
                alt="新蓝恒成品牌周边"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/80 via-transparent to-transparent p-6">
                <div>
                  <Building2 className="mb-2 h-6 w-6 text-white" />
                  <h3 className="text-lg font-bold text-white">品牌文化</h3>
                  <p className="text-sm text-ink-200">传递企业价值观</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 发展历程 ==================== */}
      <section className="section bg-ink-50">
        <div className="container-page">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="section-title">发展历程</h2>
            <p className="section-subtitle">新蓝恒成的成长足迹</p>
          </div>

          {/* 时间线 */}
          <div className="relative mx-auto max-w-3xl">
            {/* 竖线 */}
            <div className="absolute left-4 top-0 h-full w-0.5 bg-brand-200 lg:left-1/2 lg:-translate-x-1/2" />

            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div
                  key={milestone.year}
                  className={`relative flex items-start gap-6 lg:gap-0 ${
                    index % 2 === 0 ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  {/* 圆点 */}
                  <div className="absolute left-4 top-2 z-10 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-brand bg-white lg:left-1/2" />

                  {/* 内容卡片 */}
                  <div className={`ml-12 flex-1 lg:ml-0 lg:w-1/2 ${index % 2 === 0 ? 'lg:pl-8' : 'lg:pr-8 lg:text-right'}`}>
                    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                      <span className="text-2xl font-bold text-brand">{milestone.year}</span>
                      <h3 className="mt-1 text-base font-bold text-ink">{milestone.title}</h3>
                      <p className="mt-2 text-sm text-ink-500">{milestone.desc}</p>
                    </div>
                  </div>

                  {/* 占位 */}
                  <div className="hidden lg:block lg:w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section className="section bg-white">
        <div className="container-page">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-800 px-6 py-12 text-center lg:px-12 lg:py-16">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              携手新蓝恒成，共创未来
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-brand-100">
              无论您有任何合作意向或咨询需求，我们都期待与您的交流
            </p>
            <Link
              href="/contact"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-7 py-3.5 text-base font-semibold text-brand transition-all hover:bg-ink-50"
            >
              联系我们
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
