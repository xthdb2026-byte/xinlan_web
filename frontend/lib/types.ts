// ==================== API 响应类型 ====================

export interface ApiResponse<T> {
  code: string;
  data: T;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// ==================== 业务模型类型 ====================

export interface NewsItem {
  id: number;
  title: string;
  slug: string;
  summary: string;
  coverImage?: string | null;
  category: string;
  tags?: string | null;
  viewCount?: number;
  publishedAt: string | null;
}

export interface NewsDetail extends NewsItem {
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductItem {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  coverImage?: string | null;
  sortOrder?: number;
  viewCount?: number;
}

export interface ProductDetail extends ProductItem {
  features: string; // JSON 字符串 — 核心卖点 [{title, detail}]
  specs?: string | null; // JSON 字符串 — 技术参数表 [{group, items: [{label, value}]}]
  priceInfo?: string | null; // JSON 字符串 — {min, max, unit, note, updatedAt}
  scenarios?: string | null; // JSON 字符串 — 适用场景 ["场景1"]
  images: string; // JSON 数组字符串
  status: string; // draft 草稿 | active 上架 | archived 下架归档
  viewCount?: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// 后台产品分析数据
export interface ProductAnalytics {
  totals: {
    products: number;
    totalViews: number;
    viewsLast30d: number;
    zeroViewActive: number;
  };
  byStatus: { status: string; count: number }[];
  byCategory: { category: string; count: number }[];
  topViewed: {
    id: number;
    name: string;
    slug: string;
    category: string;
    status: string;
    viewCount: number;
  }[];
  trend30: { day: string; views: number }[];
}

export interface SolutionItem {
  id: number;
  title: string;
  slug: string;
  industry: string;
  content: string;
  coverImage?: string | null;
  sortOrder?: number;
}

export interface SolutionDetail extends SolutionItem {
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobItem {
  id: number;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessagePayload {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  content: string;
}

// ==================== 管理后台 ====================

export interface AdminUser {
  id: number;
  username: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: AdminUser;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface PaginatedAdminList<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardStats {
  counts: {
    news: number;
    products: number;
    solutions: number;
    jobs: number;
    messages: number;
    applications: number;
  };
  recentMessages: Array<{
    id: number;
    name: string;
    phone: string;
    content: string;
    createdAt: string;
  }>;
  recentApplications: Array<{
    id: number;
    name: string;
    phone: string;
    status: string;
    createdAt: string;
    job: { title: string };
  }>;
}

// ==================== 媒体库 ====================
export interface MediaItem {
  id: number;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  createdAt: string;
}

// ==================== Logo 管理 ====================
export interface LogoItem {
  id: number;
  url: string;
  filename: string;
  mimeType: string;
  size?: number;
  width?: number | null;
  height?: number | null;
  isDefault?: boolean;
  createdAt?: string;
}

export interface CurrentLogo {
  id?: number | null;
  url: string | null;
  filename?: string | null;
  mimeType?: string | null;
  isDefault?: boolean;
  /** 加载失败时的降级图标标识（svg 图标名等） */
  fallbackIcon?: string | null;
  updatedAt?: string | null;
}

// ==================== 审计日志 ====================
export interface AuditLogItem {
  id: number;
  action: string;
  targetType: string;
  targetId: number;
  detail: string | null;
  operator: string;
  createdAt: string;
}

// ==================== 页脚 ====================
export interface FooterContactData {
  id?: number;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  copyrightText: string;
  extras?: Record<string, unknown> | null;
}

export interface FooterLinkData {
  id: number;
  group: string;
  label: string;
  href: string;
  iconName?: string | null;
  openInNew: boolean;
  sortOrder: number;
  active?: boolean;
}

export interface FooterFullData {
  contact: FooterContactData;
  links: FooterLinkData[];
}
