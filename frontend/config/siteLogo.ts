/**
 * 全站 Logo 静态配置文件
 *
 * 说明：
 * 1. 替换站点默认 Logo 时，优先修改本文件中 staticFallback.logo 指向的图片路径，
 *    或在"后台管理 → 图标管理"页面上传并设为默认，无需修改任何业务组件代码。
 * 2. 静态 fallback 的优先级低于"后台设置的自定义 Logo"。
 * 3. 当自定义 Logo 加载失败时，按 fallbackChain 顺序逐级降级，最终显示纯文本品牌名。
 */

export type SiteLogoVariant = 'navbar-desktop' | 'navbar-mobile' | 'footer' | 'hero' | 'print';

export interface LogoSizePreset {
  /** Logo 高度（px），宽度按图片真实宽高比自动撑开 */
  height: number;
  /** 最小宽度（px），避免超窄 Logo 视觉上挤压 */
  minWidth: number;
  /** 是否随 Tailwind 响应式断点切换高度 */
  responsive?: Partial<Record<'sm' | 'md' | 'lg' | 'xl' | '2xl', number>>;
}

export interface SiteLogoConfigShape {
  /** 品牌基础信息 */
  brand: {
    name: string;
    nameEn?: string;
    tagline?: string;
  };
  /** 不同场景下的尺寸预设 */
  sizes: Record<SiteLogoVariant, LogoSizePreset>;
  /** 图片格式和加载策略 */
  image: {
    /** 优先启用 Next.js Image 优化（远程图建议 true；本地小 Logo 可 false 避免二次压缩） */
    optimize: boolean;
    /** 关键 Logo（navbar）是否标记为 priority 预加载 */
    preload: Partial<Record<SiteLogoVariant, boolean>>;
    /** object-fit 策略，contain = 完整显示，cover = 铺满裁剪 */
    objectFit: 'contain' | 'cover';
  };
  /** 静态兜底（后台无自定义 Logo 时生效） */
  staticFallback: {
    /** 主要 fallback 图 — 用户提供的盾牌 Logo（盾牌+火焰图形，无文字） */
    logo: string;
    /** 带品牌文字的横版 fallback 图（hero 大场景使用） */
    logoWithText?: string;
    /** 纯 SVG fallback */
    svgIcon: string;
  };
  /** 兜底链顺序，任何一步失败自动走下一级 */
  fallbackChain: ('custom' | 'fallback-logo' | 'fallback-svg' | 'text-only')[];
  /** 是否同步把 Logo 更新到浏览器标签 favicon */
  syncFavicon: boolean;
  /** 样式调整接口 — 可在此集中定义，也可在组件 prop 中单独覆盖 */
  style: {
    /** Logo 外围额外 className（过渡、圆角、透明度等效果放这里） */
    wrapperClassName?: string;
    /** 图片本身 className（悬停动效、滤镜等） */
    imageClassName?: string;
    /** 文字 fallback 模式下的 className */
    textClassName?: string;
  };
}

export const siteLogoConfig: SiteLogoConfigShape = {
  brand: {
    name: '新蓝恒成',
    nameEn: 'XINLAN HENGCHENG',
    tagline: '外稳内动，恒久达成',
  },

  sizes: {
    'navbar-desktop': {
      height: 60,
      minWidth: 90,
      responsive: {
        xl: 64,
      },
    },
    'navbar-mobile': {
      height: 44,
      minWidth: 66,
    },
    footer: {
      height: 56,
      minWidth: 84,
    },
    hero: {
      height: 96,
      minWidth: 144,
      responsive: {
        sm: 112,
        md: 128,
        lg: 160,
      },
    },
    print: {
      height: 60,
      minWidth: 90,
    },
  },

  image: {
    optimize: false,
    preload: {
      'navbar-desktop': true,
      'navbar-mobile': true,
    },
    objectFit: 'contain',
  },

  staticFallback: {
    // 用户提供的横版蓝色盾牌Logo（含"新蓝恒成 XINLAN HENGCHENG"文字）
    // 替换默认Logo时优先修改这里，或在"后台管理 → 图标管理"上传设为默认
    logo: '/images/logos/logo_horizontal.png',
    // 纯盾牌图标版（无文字，用于favicon/移动端图标等小尺寸场景）
    logoWithText: '/images/logos/logo_shield.png',
    svgIcon: '/icon.svg',
  },

  fallbackChain: ['custom', 'fallback-logo', 'fallback-svg', 'text-only'],

  syncFavicon: true,

  style: {
    wrapperClassName: 'transition-opacity duration-300 ease-out hover:opacity-90',
    imageClassName: '',
    textClassName: 'font-bold tracking-wide',
  },
};

export default siteLogoConfig;
