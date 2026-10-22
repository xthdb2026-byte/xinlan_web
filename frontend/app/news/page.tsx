import type { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';
import { getNewsList } from '@/lib/api';
import type { PaginatedData, NewsItem } from '@/lib/types';
import NewsCard from '@/components/news/NewsCard';
import NewsFilter from '@/components/news/NewsFilter';
import Pagination from '@/components/common/Pagination';
import PageHero from '@/components/common/PageHero';

export const metadata: Metadata = {
  title: '新闻中心',
  description: '了解新蓝恒成最新资讯与行业动态，掌握智能车辆管理、车联网安全领域的前沿技术与公司动态。',
  keywords: ['新蓝恒成新闻', '行业动态', '信息技术资讯', '智能车辆管理', '车联网安全'],
  alternates: {
    canonical: 'https://xinlanhengcheng.com/news',
  },
  openGraph: {
    title: '新闻中心 | 新蓝恒成',
    description: '了解新蓝恒成最新资讯与行业动态，掌握智能车辆管理、车联网安全领域的前沿技术与公司动态。',
    type: 'website',
    url: 'https://xinlanhengcheng.com/news',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '新闻中心 | 新蓝恒成',
    description: '了解新蓝恒成最新资讯与行业动态',
  },
};

interface SearchParams {
  page?: string;
  category?: string;
  tag?: string;
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = searchParams?.page ? parseInt(searchParams.page, 10) : 1;
  const category = searchParams?.category;
  const tag = searchParams?.tag;

  // 获取全部新闻（第一页、大 pageSize）用于客户端提取分类列表
  const allNewsData: PaginatedData<NewsItem> = await getNewsList({
    page: 1,
    pageSize: 50,
  });

  // 客户端提取去重分类列表
  const categories = Array.from(
    new Set(allNewsData.items.map((n) => n.category).filter(Boolean)),
  );

  // 获取当前页新闻（带筛选参数）
  const newsData: PaginatedData<NewsItem> = await getNewsList({
    page,
    pageSize: 10,
    category,
    tag,
  });

  return (
    <>
      {/* 页面 Banner（全屏背景图 + 渐变蒙版） */}
      <PageHero
        page="news"
        title="新闻中心"
        subtitle="了解新蓝恒成最新资讯与行业动态"
        visualImage="/images/hero/hero_news.jpg"
        visualAlt="上海都市夜景航拍，资讯脉搏与城市共生"
      />

      {/* 新闻列表 */}
      <section className="section bg-ink-50">
        <div className="container-page">
          {/* 筛选器 */}
          <Suspense fallback={<div className="mb-10 h-10 animate-pulse rounded-full bg-ink-100" />}>
            <NewsFilter
              categories={categories}
              total={newsData.pagination.total}
            />
          </Suspense>

          {/* 新闻列表 */}
          {newsData.items.length === 0 ? (
            <div className="rounded-2xl border border-ink-100 bg-white p-12 text-center">
              <p className="text-lg font-medium text-ink-600">暂无符合条件的新闻</p>
              <p className="mt-2 text-sm text-ink-400">请尝试选择其他分类或查看全部新闻</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {newsData.items.map((news) => (
                <NewsCard key={news.id} news={news} />
              ))}
            </div>
          )}

          {/* 分页器 */}
          <Suspense fallback={null}>
            <Pagination
              currentPage={newsData.pagination.page}
              totalPages={newsData.pagination.totalPages}
              basePath="/news"
            />
          </Suspense>
        </div>
      </section>
    </>
  );
}
