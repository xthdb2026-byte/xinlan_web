import type { MetadataRoute } from 'next';

// sitemap 在 SSR 构建阶段执行，始终走后端直连（127.0.0.1:3001 或 NEXT_PUBLIC_API_BASE）。
// 不使用同源代理，因为构建时 browser window 不存在。
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:3001/api';
const SITE_URL = 'https://xinlanhengcheng.com';

type NewsItem = {
  slug: string;
  updatedAt?: string;
  publishedAt?: string | null;
};

type ProductItem = {
  slug: string;
  updatedAt?: string;
};

type SolutionItem = {
  slug: string;
  updatedAt?: string;
};

type ApiResponse<T> = {
  code: string;
  data: T;
};

type PaginatedData<T> = {
  items: T[];
};

async function fetchApi<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      next: { revalidate: 3600 },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }
    const json: ApiResponse<T> = await res.json();
    return json.data;
  } finally {
    clearTimeout(timeoutId);
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 静态页面
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/products`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/hima`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/solutions`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/news`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/careers`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // 动态页面：新闻详情
  let newsUrls: MetadataRoute.Sitemap = [];
  try {
    const newsData = await fetchApi<PaginatedData<NewsItem>>('/news?pageSize=100');
    newsUrls = newsData.items.map((item) => ({
      url: `${SITE_URL}/news/${item.slug}`,
      lastModified: item.updatedAt ? new Date(item.updatedAt) : item.publishedAt ? new Date(item.publishedAt) : now,
      changeFrequency: 'monthly',
      priority: 0.7,
    }));
  } catch {
    // 忽略错误
  }

  // 动态页面：产品详情
  let productUrls: MetadataRoute.Sitemap = [];
  try {
    const products = await fetchApi<ProductItem[]>('/products');
    productUrls = products.map((item) => ({
      url: `${SITE_URL}/products/${item.slug}`,
      lastModified: item.updatedAt ? new Date(item.updatedAt) : now,
      changeFrequency: 'monthly',
      priority: 0.7,
    }));
  } catch {
    // 忽略错误
  }

  // 动态页面：解决方案详情
  let solutionUrls: MetadataRoute.Sitemap = [];
  try {
    const solutions = await fetchApi<SolutionItem[]>('/solutions');
    solutionUrls = solutions.map((item) => ({
      url: `${SITE_URL}/solutions/${item.slug}`,
      lastModified: item.updatedAt ? new Date(item.updatedAt) : now,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));
  } catch {
    // 忽略错误
  }

  return [...staticPages, ...newsUrls, ...productUrls, ...solutionUrls];
}
