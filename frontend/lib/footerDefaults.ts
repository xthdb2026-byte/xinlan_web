import type { FooterContactData, FooterLinkData } from './types';

/**
 * 全局共享的「底部信息」兜底数据。
 * — 当后端未启动、或 /api/footer 返回异常时，联系我们页、首页 JSON-LD、Footer 底栏
 *   均使用同一份默认值，避免三处硬编码导致的"显示不一致"。
 * — 本文件为纯常量（无副作用），Server Component 与 Client Component 均可直接 import。
 *
 * 与 backend/src/routes/footer.ts 后端默认值保持视觉同步：
 *   companyName → 对应 FooterContact 单例（version=1）兜底 companyName
 *   address/phone/email → 对应 admin/footer 管理页面可编辑的三项
 */
export const DEFAULT_FOOTER_CONTACT: FooterContactData = {
  companyName: '湖南新蓝恒成信息技术有限公司',
  address: '湘潭雨湖区城镇街旺城天誉22栋1单元28楼118号',
  phone: '0731-5856-0087',
  email: '99431952@qq.com',
  copyrightText: '湖南新蓝恒成信息技术有限公司 版权所有',
  extras: null,
};

/**
 * 共享的「快速链接列」兜底（原 Footer.tsx 内联结构抽出为常量）：
 * 当后端未上传任何 link 数据时，Footer 4 列栅格仍保持稳定 3 列 + 1 品牌列。
 */
export const DEFAULT_FOOTER_LINK_GROUPS: Array<{
  group: string;
  title: string;
  links: FooterLinkData[];
}> = [
  {
    group: 'product',
    title: '产品与服务',
    links: [
      { id: -1, group: 'product', label: '智能车辆管理', href: '/products', openInNew: false, sortOrder: 1 },
      { id: -2, group: 'product', label: '车联网安全',     href: '/products', openInNew: false, sortOrder: 2 },
      { id: -3, group: 'product', label: '智慧出行',       href: '/products', openInNew: false, sortOrder: 3 },
    ],
  },
  {
    group: 'solution',
    title: '解决方案',
    links: [
      { id: -4, group: 'solution', label: '政企车辆管理', href: '/solutions', openInNew: false, sortOrder: 1 },
      { id: -5, group: 'solution', label: '物流运输安全', href: '/solutions', openInNew: false, sortOrder: 2 },
    ],
  },
  {
    group: 'about',
    title: '关于我们',
    links: [
      { id: -6, group: 'about', label: '公司简介', href: '/about',   openInNew: false, sortOrder: 1 },
      { id: -7, group: 'about', label: '新闻动态', href: '/news',    openInNew: false, sortOrder: 2 },
      { id: -8, group: 'about', label: '加入我们', href: '/careers', openInNew: false, sortOrder: 3 },
    ],
  },
];

/**
 * 联系我们页"工作时间"的默认文案。
 * — 未来如需让后台也能编辑：在 FooterContact.extras.workingHours 字段存自定义字符串，
 *   这里读 contact.extras?.workingHours || WORKING_HOURS_FALLBACK 即可。
 *   当前需求仅要求关联地址/电话/邮箱，故保留常量兜底，不做强制联动。
 */
export const WORKING_HOURS_FALLBACK = '周一至周五 9:00 - 18:00';
