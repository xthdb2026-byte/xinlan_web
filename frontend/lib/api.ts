import type {
  ApiResponse,
  PaginatedData,
  NewsItem,
  NewsDetail,
  ProductItem,
  ProductDetail,
  SolutionItem,
  SolutionDetail,
  JobItem,
  MediaItem,
  LogoItem,
  CurrentLogo,
  AuditLogItem,
  LoginPayload,
  LoginResponse,
  DashboardStats,
  PaginatedAdminList,
} from './types';

// 首选同源 /api（由 next.config rewrites 代理到后端），彻底规避 CORS/Mixed Content。
// NEXT_PUBLIC_API_BASE 只在"前后端完全分离部署、无反向代理"时显式配置。
function resolveApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    // 浏览器端：同源部署最安全，自动适配 http/https + 当前 host
    return `${window.location.origin}/api`;
  }
  // SSR 阶段：窗口不可用时，回退到 127.0.0.1:3001（本机开发/standalone 部署）
  return 'http://127.0.0.1:3001/api';
}

// 动态读取，避免模块加载时 cache 导致测试 env 变更不生效
function getApiBase(): string {
  return resolveApiBase();
}

export function getMediaUrl(url: string): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  // /uploads/* 已通过 next.config 的 rewrites 代理到后端，直接使用同源路径
  if (url.startsWith('/uploads/')) return url;
  try {
    const base = new URL(getApiBase());
    return `${base.origin}${url.startsWith('/') ? '' : '/'}${url}`;
  } catch {
    return url;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const fullUrl = `${getApiBase()}${path}`;
  let res: Response;
  try {
    const browserSide = typeof window !== 'undefined';
    // 浏览器端 fetch 不支持 next.revalidate 等 server-only 参数，必须剥离
    const { next: _next, cache: _cache, ...browserOptions } = options ?? {};
    const fetchOptions: RequestInit = browserSide ? browserOptions : (options ?? {});
    res = await fetch(fullUrl, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      ...(browserSide ? {} : { next: (options as any)?.next, cache: (options as any)?.cache }),
    });
  } catch (err) {
    // fetch() 抛出 TypeError 时（最常见即 "Failed to fetch"），
    // 将通用错误转译为包含根因线索的诊断信息，便于排障
    const reason = err instanceof Error ? err.message : String(err);
    let diagnosis = `Network error: ${reason}`;
    diagnosis += `\n  URL: ${fullUrl}`;
    if (typeof window !== 'undefined') {
      diagnosis += `\n  Page origin: ${window.location.origin}`;
      diagnosis += `\n  Online: ${navigator.onLine ? 'yes' : 'no'}`;
    }
    // 常见根因判断
    if (typeof window !== 'undefined') {
      try {
        const u = new URL(fullUrl);
        if (u.protocol !== window.location.protocol) {
          diagnosis += `\n  ⚠ Mixed content: page=${window.location.protocol} vs api=${u.protocol} (browser may block)`;
        }
        if (u.origin !== window.location.origin) {
          diagnosis += `\n  ⚠ Cross-origin: check server CORS / firewall / upstream availability`;
        }
      } catch {
        /* ignore */
      }
    }
    throw new Error(diagnosis);
  }

  if (!res.ok) {
    // 尝试提取后端结构化错误 code/message 以便前端展示锁定/2FA 等细节
    let code: string | undefined;
    let bodyMessage: string | undefined;
    let extra: Record<string, unknown> | undefined;
    try {
      const clone = res.clone();
      const payload = await clone.json();
      if (payload && typeof payload === 'object') {
        code = typeof payload.code === 'string' ? payload.code : undefined;
        bodyMessage = typeof payload.message === 'string' ? payload.message : undefined;
        // 支持：
        //  - fail() extra 展开格式（顶层 attemptsLeft/score/errors/lockedUntil 等）
        //  - rate-limit handler 嵌套格式：{ code, message, details: { retryAfterSeconds, ... } }
        const known = [
          'lockedUntil', 'remainingMinutes', 'remainingSeconds', 'attemptsLeft',
          'errors', 'score', 'warnings',
          'retryAfterSeconds', 'windowMinutes', 'limitType', 'maxPerWindow', 'hint',
        ];
        const sources = [payload];
        if (payload.details && typeof payload.details === 'object') sources.push(payload.details);
        for (const s of sources) {
          for (const k of known) {
            if (k in s) {
              extra = extra ?? {};
              (extra as any)[k] = (s as any)[k];
            }
          }
        }
      }
    } catch {
      /* 非 JSON 响应，忽略 */
    }
    const summary = bodyMessage ?? `${res.status} ${res.statusText}`;
    const err = new Error(summary) as Error & {
      code?: string;
      status?: number;
      details?: Record<string, unknown>;
      url?: string;
    };
    err.code = code;
    err.status = res.status;
    err.details = extra;
    err.url = fullUrl;
    throw err;
  }

  const json: ApiResponse<T> = await res.json();
  return json.data;
}

// ==================== News API ====================

export async function getNewsList(params?: {
  page?: number;
  pageSize?: number;
  category?: string;
  tag?: string;
}): Promise<PaginatedData<NewsItem>> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  if (params?.category) query.set('category', params.category);
  if (params?.tag) query.set('tag', params.tag);
  const qs = query.toString();
  return request<PaginatedData<NewsItem>>(`/news${qs ? `?${qs}` : ''}`);
}

export async function getLatestNews(limit = 3): Promise<NewsItem[]> {
  return request<NewsItem[]>(`/news/latest?limit=${limit}`);
}

export async function getNewsBySlug(slug: string): Promise<NewsDetail> {
  return request<NewsDetail>(`/news/${slug}`);
}

// ==================== Products API ====================

export async function getProducts(category?: string): Promise<ProductItem[]> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : '';
  return request<ProductItem[]>(`/products${qs}`);
}

export async function getProductCategories(): Promise<string[]> {
  return request<string[]>('/products/categories');
}

export async function getFeaturedProducts(limit = 3): Promise<ProductItem[]> {
  return request<ProductItem[]>(`/products/featured?limit=${limit}`);
}

export async function getProductBySlug(slug: string): Promise<ProductDetail> {
  return request<ProductDetail>(`/products/${slug}`);
}

// 智能推荐：同分类按热度排序的相关产品
export async function getRelatedProducts(slug: string, limit = 4): Promise<ProductItem[]> {
  return request<ProductItem[]>(`/products/${slug}/related?limit=${limit}`);
}

// 匿名浏览埋点（失败静默，不影响页面展示）
export async function trackProductView(slug: string, referrer?: string): Promise<void> {
  try {
    await request<{ ok: boolean }>(`/products/${slug}/view`, {
      method: 'POST',
      body: JSON.stringify({ referrer: referrer ?? null }),
    });
  } catch {
    // 埋点失败不影响用户体验
  }
}

// ==================== Solutions API ====================

export async function getSolutions(industry?: string): Promise<SolutionItem[]> {
  const qs = industry ? `?industry=${encodeURIComponent(industry)}` : '';
  return request<SolutionItem[]>(`/solutions${qs}`);
}

export async function getSolutionBySlug(slug: string): Promise<SolutionDetail> {
  return request<SolutionDetail>(`/solutions/${slug}`);
}

// ==================== Jobs API ====================

export async function getJobs(params?: {
  department?: string;
  type?: string;
}): Promise<JobItem[]> {
  const query = new URLSearchParams();
  if (params?.department) query.set('department', params.department);
  if (params?.type) query.set('type', params.type);
  const qs = query.toString();
  return request<JobItem[]>(`/jobs${qs ? `?${qs}` : ''}`);
}

export async function getJobById(id: number): Promise<JobItem> {
  return request<JobItem>(`/jobs/${id}`);
}

// ==================== Auth API ====================

export async function login(data: LoginPayload): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
    credentials: 'include',
  });
}

export async function logout(): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>('/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
}

export async function getCurrentUser(): Promise<{ user: { id: number; username: string; role: string } }> {
  return request('/auth/me', { credentials: 'include' });
}

// ==================== Admin API ====================

function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return request<T>(`/admin${path}`, { ...options, headers, credentials: 'include' });
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return adminRequest<DashboardStats>('/stats');
}

export async function getAdminList<T>(module: string, page = 1, pageSize = 10): Promise<PaginatedAdminList<T>> {
  return adminRequest<PaginatedAdminList<T>>(`/${module}?page=${page}&pageSize=${pageSize}`);
}

export async function createAdminItem<T>(module: string, data: unknown): Promise<T> {
  return adminRequest<T>(`/${module}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAdminItem<T>(module: string, id: number, data: unknown): Promise<T> {
  return adminRequest<T>(`/${module}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAdminItem(module: string, id: number): Promise<{ ok: boolean }> {
  return adminRequest<{ ok: boolean }>(`/${module}/${id}`, {
    method: 'DELETE',
  });
}

// 产品数据分析（仪表盘）
export async function getProductAnalytics(): Promise<import('./types').ProductAnalytics> {
  return adminRequest<import('./types').ProductAnalytics>('/products/analytics');
}

// 产品批量操作：publish 上架 / archive 下架归档 / delete 删除
export async function batchProductAction(
  action: 'publish' | 'archive' | 'delete',
  ids: number[],
): Promise<{ ok: boolean; action: string; affected: number }> {
  return adminRequest<{ ok: boolean; action: string; affected: number }>('/products/batch', {
    method: 'POST',
    body: JSON.stringify({ action, ids }),
  });
}

export async function updateApplicationStatus(id: number, status: string) {
  return adminRequest(`/applications/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function updateMessageStatus(id: number, status: string) {
  return adminRequest(`/messages/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

// ==================== Media API ====================

export async function getMediaList(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedData<MediaItem>> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  const qs = query.toString();
  return request<PaginatedData<MediaItem>>(`/media${qs ? `?${qs}` : ''}`);
}

export async function uploadMedia(file: File): Promise<MediaItem> {
  const formData = new FormData();
  formData.append('file', file);
  return adminRequest<MediaItem>('/media/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function deleteMedia(id: number): Promise<{ ok: boolean }> {
  return adminRequest<{ ok: boolean }>(`/media/${id}`, {
    method: 'DELETE',
  });
}

// ==================== Logo API ====================

export async function getCurrentLogo(): Promise<CurrentLogo> {
  return request<CurrentLogo>('/logo/current');
}

export async function getLogoList(): Promise<LogoItem[]> {
  return adminRequest<LogoItem[]>('/logo/list');
}

export async function uploadLogo(file: File): Promise<MediaItem> {
  const formData = new FormData();
  formData.append('file', file);
  return adminRequest<MediaItem>('/logo/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function setDefaultLogo(mediaId: number): Promise<{ ok: boolean }> {
  return adminRequest<{ ok: boolean }>('/logo/set-default', {
    method: 'POST',
    body: JSON.stringify({ mediaId }),
  });
}

export async function deleteLogo(id: number): Promise<{ ok: boolean; wasDefault: boolean }> {
  return adminRequest<{ ok: boolean; wasDefault: boolean }>(`/logo/${id}`, {
    method: 'DELETE',
  });
}

export async function getLogoAuditLogs(): Promise<AuditLogItem[]> {
  return adminRequest<AuditLogItem[]>('/logo/audit-logs');
}

/** 通用操作日志查询（分页 + 可选 targetType/action 筛选） */
export async function getAuditLogs(params?: {
  page?: number;
  pageSize?: number;
  targetType?: string;
  action?: string;
  keyword?: string;
}): Promise<PaginatedAdminList<AuditLogItem>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
  if (params?.targetType) qs.set('targetType', params.targetType);
  if (params?.action) qs.set('action', params.action);
  if (params?.keyword) qs.set('keyword', params.keyword);
  const query = qs.toString();
  return adminRequest<PaginatedAdminList<AuditLogItem>>(
    `/audit-logs${query ? `?${query}` : ''}`,
  );
}

// ==================== Footer API ====================

import type {
  FooterContactData,
  FooterFullData,
  FooterLinkData,
} from './types';

export async function getFooterData(): Promise<FooterFullData> {
  return request<FooterFullData>('/footer');
}

// ==================== Page Configs API ====================

export async function getPageConfig(page: string, section: string): Promise<any> {
  const fullUrl = `${getApiBase()}/page-configs/${page}/${section}`;
  try {
    const browserSide = typeof window !== 'undefined';
    // revalidate 60s：后台编辑器保存后，前台 ISR 最多 1 分钟内生效，兼顾性能与可见性
    const fetchOptions: RequestInit = browserSide ? {} : { next: { revalidate: 60 } };
    const res = await fetch(fullUrl, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
      },
      ...(browserSide ? {} : { next: { revalidate: 60 } }),
    });
    if (!res.ok) return null;
    const json: { code: string; data: any } = await res.json();
    if (json.code !== 'OK') return null;
    // 后端返回完整记录 { id, page, section, content, updatedAt }，需提取 content 字段
    const d = json.data;
    if (d && typeof d === 'object' && 'content' in d) {
      const c = d.content;
      // content 可能是 JSON 字符串（admin 接口格式）或已解析对象（public 接口格式）
      if (typeof c === 'string') {
        try {
          return JSON.parse(c);
        } catch {
          return null;
        }
      }
      return c;
    }
    return d;
  } catch {
    return null;
  }
}

// ==================== Banner（首页轮播）API ====================

export interface BannerItem {
  id: number;
  title: string;
  subtitle: string | null;
  image: string;
  link: string | null;
  sortOrder: number;
}

export interface AdminBannerItem extends BannerItem {
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getAdminBanners(): Promise<AdminBannerItem[]> {
  const res = await adminRequest<{ items: AdminBannerItem[] }>('/banners');
  return res.items;
}

export interface BannerPayload {
  title: string;
  subtitle?: string | null;
  image: string;
  link?: string | null;
  sortOrder: number;
  enabled: boolean;
}

export async function createBanner(data: BannerPayload): Promise<AdminBannerItem> {
  return adminRequest<AdminBannerItem>('/banners', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBanner(id: number, data: BannerPayload): Promise<AdminBannerItem> {
  return adminRequest<AdminBannerItem>(`/banners/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteBanner(id: number): Promise<{ id: number }> {
  return adminRequest<{ id: number }>(`/banners/${id}`, { method: 'DELETE' });
}

// ==================== PageConfig 历史版本 API ====================

export interface PageConfigRevisionItem {
  id: number;
  page: string;
  section: string;
  content: string;
  operator: string;
  createdAt: string;
}

export async function getPageConfigRevisions(
  page: string,
  section: string,
): Promise<PageConfigRevisionItem[]> {
  const res = await adminRequest<{ items: PageConfigRevisionItem[] }>(
    `/page-configs/${encodeURIComponent(page)}/${encodeURIComponent(section)}/revisions`,
  );
  return res.items;
}

export async function rollbackPageConfig(
  page: string,
  section: string,
  revisionId: number,
): Promise<AdminPageConfigItem> {
  return adminRequest<AdminPageConfigItem>(
    `/page-configs/${encodeURIComponent(page)}/${encodeURIComponent(section)}/rollback`,
    {
      method: 'POST',
      body: JSON.stringify({ revisionId }),
    },
  );
}

// ==================== 用户管理 API ====================

export interface AdminUserItem {
  id: number;
  username: string;
  role: 'admin' | 'editor';
  disabled: boolean;
  twoFactorEnabled: boolean;
  failedAttempts: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getAdminUsers(): Promise<AdminUserItem[]> {
  const res = await adminRequest<{ items: AdminUserItem[] }>('/users');
  return res.items;
}

export async function createAdminUser(data: {
  username: string;
  password: string;
  role: 'admin' | 'editor';
}): Promise<AdminUserItem> {
  return adminRequest<AdminUserItem>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAdminUserRole(
  id: number,
  role: 'admin' | 'editor',
): Promise<AdminUserItem> {
  return adminRequest<AdminUserItem>(`/users/${id}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
}

export async function resetAdminUserPassword(
  id: number,
  password: string,
): Promise<{ id: number; ok: boolean }> {
  return adminRequest<{ id: number; ok: boolean }>(`/users/${id}/password`, {
    method: 'PUT',
    body: JSON.stringify({ password }),
  });
}

export async function setAdminUserDisabled(
  id: number,
  disabled: boolean,
): Promise<AdminUserItem> {
  return adminRequest<AdminUserItem>(`/users/${id}/disabled`, {
    method: 'PUT',
    body: JSON.stringify({ disabled }),
  });
}

// ==================== 审计日志筛选 facets ====================

export interface AuditLogFacets {
  actions: string[];
  targetTypes: string[];
}

export async function getAuditLogFacets(): Promise<AuditLogFacets> {
  return adminRequest<AuditLogFacets>('/audit-logs/facets');
}

export async function updateFooterContact(
  data: Partial<FooterContactData> & Pick<FooterContactData, 'companyName' | 'address' | 'phone' | 'email' | 'copyrightText'>,
): Promise<FooterContactData> {
  return adminRequest<FooterContactData>('/footer/contact', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getAdminFooterLinks(): Promise<FooterLinkData[]> {
  return adminRequest<FooterLinkData[]>('/footer/links');
}

export async function createFooterLink(
  data: Omit<FooterLinkData, 'id'>,
): Promise<FooterLinkData> {
  return adminRequest<FooterLinkData>('/footer/links', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateFooterLink(
  id: number,
  data: Partial<FooterLinkData>,
): Promise<FooterLinkData> {
  return adminRequest<FooterLinkData>(`/footer/links/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateFooterLinkSort(id: number, sortOrder: number): Promise<FooterLinkData> {
  return adminRequest<FooterLinkData>(`/footer/links/${id}/sort`, {
    method: 'PATCH',
    body: JSON.stringify({ sortOrder }),
  });
}

export async function deleteFooterLink(id: number): Promise<{ ok: boolean }> {
  return adminRequest<{ ok: boolean }>(`/footer/links/${id}`, {
    method: 'DELETE',
  });
}

// ==================== Admin PageConfig（首页内容配置） ====================

export interface AdminPageConfigItem {
  id: number;
  page: string;
  section: string;
  content: string; // JSON 字符串
  updatedAt: string;
}

/** 拉取后台所有 PageConfig（用于 /admin/page-configs 一次性装载 3 个 section） */
export async function getAdminPageConfigs(page?: string): Promise<AdminPageConfigItem[]> {
  const qs = page ? `?page=${encodeURIComponent(page)}` : '';
  const res = await adminRequest<{ items: AdminPageConfigItem[] }>(`/page-configs${qs}`);
  return res.items;
}

/** 更新（upsert）某 page/section 的 PageConfig content（要求 content 必须是合法 JSON 字符串） */
export async function updateAdminPageConfig(
  page: string,
  section: string,
  content: string,
): Promise<AdminPageConfigItem> {
  return adminRequest<AdminPageConfigItem>(
    `/page-configs/${encodeURIComponent(page)}/${encodeURIComponent(section)}`,
    {
      method: 'PUT',
      body: JSON.stringify({ content }),
    },
  );
}
