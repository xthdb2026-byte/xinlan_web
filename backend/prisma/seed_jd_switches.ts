/**
 * 华为数通智选 S5735S 系列交换机 seed（京东渠道款）
 * 数据来源：京东华为授权旗舰店商品信息（2026-08-29 抓取）
 * 图片：backend/uploads/products/jd/jd-switch-*.jpg（京东商家主图，800×800）
 * 用法：cd backend && npx tsx prisma/seed_jd_switches.ts（upsert by slug，可重复执行）
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const JD = '/uploads/products/jd';
const PRICE_NOTE = '京东渠道到手价参考（含专票），实际成交价以正式报价为准';
const UPDATED_AT = '2026-08-29';

interface SeedProduct {
  slug: string;
  name: string;
  category: string;
  description: string;
  features: { title: string; detail: string }[];
  specs: { group: string; items: { label: string; value: string }[] }[];
  priceInfo: { min: number; max: number; unit: string; note: string; updatedAt: string };
  scenarios: string[];
  coverImage: string;
  images: string[];
  sortOrder: number;
  status: string;
}

const COMMON_SPEC_TAIL = [
  { label: '电源输入', value: 'AC 100–240V，50/60Hz' },
  { label: '工作温度', value: '-5℃ ～ +45℃' },
];

const products: SeedProduct[] = [
  {
    slug: 'huawei-s5735s-l24t4s-qa2',
    name: '华为数通智选 S5735S-L24T4S-QA2 千兆接入交换机',
    category: '华为网络产品系列',
    description:
      '面向中小企业与园区接入层的千兆弱三层交换机，提供24个千兆电口与4个千兆SFP光口上行，支持智能堆叠与全网管，无风扇静音设计，适合办公桌面、楼道弱电间等对噪声敏感的部署环境。',
    features: [
      { title: '千兆接入', detail: '24个10/100/1000BASE-T电口，4个千兆SFP光口上行，满足终端高密度接入' },
      { title: '弱三层能力', detail: '支持静态路由、RIP等三层特性，减轻网关压力，提升转发效率' },
      { title: '智能堆叠', detail: '支持多台设备堆叠虚拟化为一台，统一配置、统一管理' },
      { title: '静音设计', detail: '无风扇自然散热，零噪声，适合开放式办公环境部署' },
    ],
    specs: [
      {
        group: '核心性能',
        items: [
          { label: '交换容量', value: '336 Gbps / 3.36 Tbps' },
          { label: '包转发率', value: '51 / 108 Mpps' },
          { label: 'MAC地址表', value: '16K' },
          { label: 'VLAN数量', value: '4K' },
        ],
      },
      {
        group: '端口规格',
        items: [
          { label: '下行端口', value: '24 × 10/100/1000Base-T 电口' },
          { label: '上行端口', value: '4 × 千兆 SFP 光口' },
          { label: '管理端口', value: '1 × Console（RJ45）' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '外形尺寸（宽×深×高）', value: '442 × 220 × 43.6 mm（1U）' },
          { label: '散热方式', value: '无风扇自然散热' },
          ...COMMON_SPEC_TAIL,
        ],
      },
    ],
    priceInfo: { min: 1324, max: 1710, unit: '元/台', note: PRICE_NOTE, updatedAt: UPDATED_AT },
    scenarios: ['中小企业办公网接入', '园区楼栋弱电间接入', '酒店客房与商业店铺终端接入'],
    coverImage: `${JD}/jd-switch-09.jpg`,
    images: [`${JD}/jd-switch-09.jpg`, `${JD}/jd-switch-01.jpg`, `${JD}/jd-switch-17.jpg`],
    sortOrder: 33,
    status: 'active',
  },
  {
    slug: 'huawei-s5735s-l24t4x-qa2',
    name: '华为数通智选 S5735S-L24T4X-QA2 万兆上行接入交换机',
    category: '华为网络产品系列',
    description:
      '24口千兆电接入、4口万兆SFP+上行的弱三层网管交换机，万兆上行消除汇聚瓶颈，支持智能堆叠与即插即用，含京东渠道服务包，适合对上行带宽有较高要求的企业接入层。',
    features: [
      { title: '万兆上行', detail: '4个万兆SFP+上行口，千兆接入无阻塞，保障高带宽业务回传' },
      { title: '弱三层能力', detail: '支持静态路由、RIP，实现本地三层转发，降低核心压力' },
      { title: '智能堆叠', detail: '多台设备虚拟化统一管理，配置自动同步，扩容零配置' },
      { title: '含服务包', detail: '京东渠道含原厂服务支持，免费技术支持与调试指导' },
    ],
    specs: [
      {
        group: '核心性能',
        items: [
          { label: '交换容量', value: '336 Gbps / 3.36 Tbps' },
          { label: '包转发率', value: '108 / 126 Mpps' },
          { label: 'MAC地址表', value: '16K' },
          { label: 'VLAN数量', value: '4K' },
        ],
      },
      {
        group: '端口规格',
        items: [
          { label: '下行端口', value: '24 × 10/100/1000Base-T 电口' },
          { label: '上行端口', value: '4 × 万兆 SFP+ 光口' },
          { label: '管理端口', value: '1 × Console（RJ45）' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '外形尺寸（宽×深×高）', value: '442 × 220 × 43.6 mm（1U）' },
          { label: '散热方式', value: '无风扇自然散热' },
          ...COMMON_SPEC_TAIL,
        ],
      },
    ],
    priceInfo: { min: 2564, max: 2699, unit: '元/台', note: PRICE_NOTE, updatedAt: UPDATED_AT },
    scenarios: ['企业办公网万兆上行接入', '视频监控汇聚接入', '校园网教室与办公室接入'],
    coverImage: `${JD}/jd-switch-02.jpg`,
    images: [`${JD}/jd-switch-02.jpg`, `${JD}/jd-switch-11.jpg`],
    sortOrder: 34,
    status: 'active',
  },
  {
    slug: 'huawei-s5735s-l24p4s-a2',
    name: '华为数通智选 S5735S-L24P4S-A2 千兆PoE接入交换机',
    category: '华为网络产品系列',
    description:
      '24口千兆PoE+供电接入交换机，整机PoE功率380W，可为无线AP、IP电话、监控摄像机等终端统一供电，4个千兆SFP光口上行，弱三层全网管，是园区无线覆盖与安防接入的理想选择。',
    features: [
      { title: 'PoE+供电', detail: '24口全线PoE+输出，整机功率380W，单口最大30W，覆盖主流受电终端' },
      { title: '统一承载', detail: '一台设备同时承载数据与供电，省去强电布线，降低施工成本' },
      { title: '弱三层网管', detail: '支持静态路由、RIP与丰富VLAN特性，全网管精细化运维' },
      { title: '智能堆叠', detail: '支持堆叠虚拟化，多台合一统一管控，简化接入层架构' },
    ],
    specs: [
      {
        group: '核心性能',
        items: [
          { label: '交换容量', value: '336 Gbps / 3.36 Tbps' },
          { label: '包转发率', value: '51 / 108 Mpps' },
          { label: 'MAC地址表', value: '16K' },
          { label: 'VLAN数量', value: '4K' },
        ],
      },
      {
        group: '端口规格',
        items: [
          { label: '下行端口', value: '24 × 10/100/1000Base-T 电口（PoE+）' },
          { label: '上行端口', value: '4 × 千兆 SFP 光口' },
          { label: 'PoE功率', value: '整机 380W，单口最大 30W' },
          { label: '管理端口', value: '1 × Console（RJ45）' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '外形尺寸（宽×深×高）', value: '442 × 310 × 43.6 mm（1U）' },
          ...COMMON_SPEC_TAIL,
        ],
      },
    ],
    priceInfo: { min: 2906, max: 3059, unit: '元/台', note: PRICE_NOTE, updatedAt: UPDATED_AT },
    scenarios: ['企业无线AP集中供电接入', 'IP电话系统部署', '楼宇安防监控摄像机接入'],
    coverImage: `${JD}/jd-switch-03.jpg`,
    images: [`${JD}/jd-switch-03.jpg`, `${JD}/jd-switch-12.jpg`],
    sortOrder: 35,
    status: 'active',
  },
  {
    slug: 'huawei-s5735s-l24p4x-a2',
    name: '华为数通智选 S5735S-L24P4X-A2 万兆上行PoE交换机',
    category: '华为网络产品系列',
    description:
      '24口千兆PoE+供电、4口万兆SFP+上行的弱三层全网管交换机，整机PoE功率380W，万兆上行保障高密无线与高清监控回传带宽，适用于中大型园区高带宽PoE接入场景。',
    features: [
      { title: 'PoE+大功率', detail: '24口PoE+输出，整机380W功率储备，轻松带动Wi-Fi 6 AP与云台摄像机' },
      { title: '万兆上行', detail: '4个万兆SFP+上行口，高密终端流量回传无瓶颈' },
      { title: '弱三层网管', detail: '静态路由、RIP、VLAN、QoS等完整弱三层与二层网管能力' },
      { title: '智能堆叠', detail: '支持堆叠统一管控，接入层扩容与运维极简' },
    ],
    specs: [
      {
        group: '核心性能',
        items: [
          { label: '交换容量', value: '336 Gbps / 3.36 Tbps' },
          { label: '包转发率', value: '108 / 126 Mpps' },
          { label: 'MAC地址表', value: '16K' },
          { label: 'VLAN数量', value: '4K' },
        ],
      },
      {
        group: '端口规格',
        items: [
          { label: '下行端口', value: '24 × 10/100/1000Base-T 电口（PoE+）' },
          { label: '上行端口', value: '4 × 万兆 SFP+ 光口' },
          { label: 'PoE功率', value: '整机 380W，单口最大 30W' },
          { label: '管理端口', value: '1 × Console（RJ45）' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '外形尺寸（宽×深×高）', value: '442 × 310 × 43.6 mm（1U）' },
          ...COMMON_SPEC_TAIL,
        ],
      },
    ],
    priceInfo: { min: 3999, max: 4249, unit: '元/台', note: PRICE_NOTE, updatedAt: UPDATED_AT },
    scenarios: ['中大型园区Wi-Fi 6无线覆盖', '高清视频监控万兆回传接入', '智慧楼宇PoE终端统一承载'],
    coverImage: `${JD}/jd-switch-04.jpg`,
    images: [`${JD}/jd-switch-04.jpg`, `${JD}/jd-switch-13.jpg`],
    sortOrder: 36,
    status: 'active',
  },
  {
    slug: 'huawei-s5735s-l32st4x-a1',
    name: '华为数通智选 S5735S-L32ST4X-A1 全光口汇聚交换机',
    category: '华为网络产品系列',
    description:
      '24口千兆SFP光+8口千兆电复用、4口万兆SFP+上行的弱三层全网管交换机，光纤端口高密度，支持智能堆叠，适合作为园区光纤到楼汇聚或全光网接入层核心节点。',
    features: [
      { title: '高密光口', detail: '24个千兆SFP光口+8个千兆电口复用，灵活适配光纤到楼/到桌面部署' },
      { title: '万兆上行', detail: '4个万兆SFP+上行口，汇聚多楼栋流量无阻塞' },
      { title: '智能堆叠', detail: '支持多台堆叠虚拟化，统一配置管理，可靠性成倍提升' },
      { title: '弱三层网管', detail: '静态路由、RIP等三层能力，本地转发降低核心负载' },
    ],
    specs: [
      {
        group: '核心性能',
        items: [
          { label: '交换容量', value: '432 Gbps / 4.32 Tbps' },
          { label: '包转发率', value: '120 / 138 Mpps' },
          { label: 'MAC地址表', value: '16K' },
          { label: 'VLAN数量', value: '4K' },
        ],
      },
      {
        group: '端口规格',
        items: [
          { label: '下行端口', value: '24 × 千兆 SFP 光口 + 8 × 10/100/1000Base-T 电口（复用）' },
          { label: '上行端口', value: '4 × 万兆 SFP+ 光口' },
          { label: '管理端口', value: '1 × Console（RJ45）' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '外形尺寸（宽×深×高）', value: '442 × 220 × 43.6 mm（1U）' },
          ...COMMON_SPEC_TAIL,
        ],
      },
    ],
    priceInfo: { min: 4716, max: 4964, unit: '元/台', note: PRICE_NOTE, updatedAt: UPDATED_AT },
    scenarios: ['园区光纤到楼汇聚', '全光网（POL）接入层部署', '校园/医院多楼宇光纤汇聚'],
    coverImage: `${JD}/jd-switch-05.jpg`,
    images: [`${JD}/jd-switch-05.jpg`, `${JD}/jd-switch-14.jpg`],
    sortOrder: 37,
    status: 'active',
  },
  {
    slug: 'huawei-s5735s-l48t4s-a1',
    name: '华为数通智选 S5735S-L48T4S-A1 千兆高密度接入交换机',
    category: '华为网络产品系列',
    description:
      '48口千兆电+4口千兆SFP光上行的高密度弱三层接入交换机，单台即可满足整楼层终端接入，支持全网管与智能堆叠，适合大中型企业办公楼层、学校机房等高密度接入场景。',
    features: [
      { title: '高密度接入', detail: '48个千兆电口，单台覆盖整层办公终端，减少设备堆叠层级' },
      { title: '弱三层能力', detail: '支持静态路由、RIP，本地三层转发，优化网络架构' },
      { title: '全网管', detail: '完整二层网管特性，VLAN、QoS、ACL、端口安全一应俱全' },
      { title: '智能堆叠', detail: '多台设备虚拟化统一管理，扩容与运维更高效' },
    ],
    specs: [
      {
        group: '核心性能',
        items: [
          { label: '交换容量', value: '432 Gbps / 4.32 Tbps' },
          { label: '包转发率', value: '87 / 130 Mpps' },
          { label: 'MAC地址表', value: '16K' },
          { label: 'VLAN数量', value: '4K' },
        ],
      },
      {
        group: '端口规格',
        items: [
          { label: '下行端口', value: '48 × 10/100/1000Base-T 电口' },
          { label: '上行端口', value: '4 × 千兆 SFP 光口' },
          { label: '管理端口', value: '1 × Console（RJ45）' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '外形尺寸（宽×深×高）', value: '442 × 220 × 43.6 mm（1U）' },
          ...COMMON_SPEC_TAIL,
        ],
      },
    ],
    priceInfo: { min: 3666, max: 3666, unit: '元/台', note: PRICE_NOTE, updatedAt: UPDATED_AT },
    scenarios: ['大中型企业办公楼层接入', '学校多媒体教室与机房接入', '政务大厅与营业厅终端接入'],
    coverImage: `${JD}/jd-switch-08.jpg`,
    images: [`${JD}/jd-switch-08.jpg`],
    sortOrder: 38,
    status: 'active',
  },
  {
    slug: 'huawei-s5735s-l48t4x-a1',
    name: '华为数通智选 S5735S-L48T4X-A1 万兆上行高密度交换机',
    category: '华为网络产品系列',
    description:
      '48口千兆电+4口万兆SFP+上行的高密度弱三层全网管交换机，兼顾大端口密度与万兆上行带宽，可作为中小企业核心汇聚或大型企业楼层接入主力机型。',
    features: [
      { title: '高密度千兆接入', detail: '48个千兆电口，整楼层终端一台接入，布线整洁、管理集中' },
      { title: '万兆上行', detail: '4个万兆SFP+上行口，高密度流量回传核心无瓶颈' },
      { title: '核心汇聚两用', detail: '弱三层全网管能力，既胜任楼层接入，也可担当中小网汇聚' },
      { title: '智能堆叠', detail: '支持堆叠虚拟化，跨设备链路聚合，可靠性更高' },
    ],
    specs: [
      {
        group: '核心性能',
        items: [
          { label: '交换容量', value: '432 Gbps / 4.32 Tbps' },
          { label: '包转发率', value: '144 / 166 Mpps' },
          { label: 'MAC地址表', value: '16K' },
          { label: 'VLAN数量', value: '4K' },
        ],
      },
      {
        group: '端口规格',
        items: [
          { label: '下行端口', value: '48 × 10/100/1000Base-T 电口' },
          { label: '上行端口', value: '4 × 万兆 SFP+ 光口' },
          { label: '管理端口', value: '1 × Console（RJ45）' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '外形尺寸（宽×深×高）', value: '442 × 220 × 43.6 mm（1U）' },
          ...COMMON_SPEC_TAIL,
        ],
      },
    ],
    priceInfo: { min: 5319, max: 5599, unit: '元/台', note: PRICE_NOTE, updatedAt: UPDATED_AT },
    scenarios: ['企业楼层高密度接入', '中小企业网络核心汇聚', '数据中心千兆服务器接入'],
    coverImage: `${JD}/jd-switch-06.jpg`,
    images: [`${JD}/jd-switch-06.jpg`, `${JD}/jd-switch-15.jpg`],
    sortOrder: 39,
    status: 'active',
  },
  {
    slug: 'huawei-s5735s-l48p4x-a1',
    name: '华为数通智选 S5735S-L48P4X-A1 高密度PoE交换机',
    category: '华为网络产品系列',
    description:
      '48口千兆PoE+供电、4口万兆SFP+上行的三层全网管交换机，整机PoE功率380W，单台即可为整楼层无线AP、IP电话、监控终端统一供电与接入，是大型园区PoE接入层的旗舰机型。',
    features: [
      { title: '高密PoE+', detail: '48口全线PoE+输出，整机380W功率，单口最大30W，满足大功率终端' },
      { title: '万兆上行', detail: '4个万兆SFP+上行口，高密PoE终端流量回传无阻塞' },
      { title: '三层全网管', detail: '支持静态路由、RIP、OSPF等三层路由能力，组网更灵活' },
      { title: '智能堆叠', detail: '多台堆叠统一管控，供电与数据一体化运维' },
    ],
    specs: [
      {
        group: '核心性能',
        items: [
          { label: '交换容量', value: '432 Gbps / 4.32 Tbps' },
          { label: '包转发率', value: '144 / 166 Mpps' },
          { label: 'MAC地址表', value: '16K' },
          { label: 'VLAN数量', value: '4K' },
        ],
      },
      {
        group: '端口规格',
        items: [
          { label: '下行端口', value: '48 × 10/100/1000Base-T 电口（PoE+）' },
          { label: '上行端口', value: '4 × 万兆 SFP+ 光口' },
          { label: 'PoE功率', value: '整机 380W，单口最大 30W' },
          { label: '管理端口', value: '1 × Console（RJ45）' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '外形尺寸（宽×深×高）', value: '442 × 310 × 43.6 mm（1U）' },
          ...COMMON_SPEC_TAIL,
        ],
      },
    ],
    priceInfo: { min: 7599, max: 7999, unit: '元/台', note: PRICE_NOTE, updatedAt: UPDATED_AT },
    scenarios: ['大型园区整楼层无线覆盖', '智慧办公IP电话+AP统一供电', '高密度安防监控接入与供电'],
    coverImage: `${JD}/jd-switch-07.jpg`,
    images: [`${JD}/jd-switch-07.jpg`, `${JD}/jd-switch-16.jpg`],
    sortOrder: 40,
    status: 'active',
  },
];

async function main() {
  console.log(`🚀 开始写入 ${products.length} 款华为数通智选交换机...`);
  for (const p of products) {
    const data = {
      name: p.name,
      category: p.category,
      description: p.description,
      features: JSON.stringify(p.features),
      specs: JSON.stringify(p.specs),
      priceInfo: JSON.stringify(p.priceInfo),
      scenarios: JSON.stringify(p.scenarios),
      coverImage: p.coverImage,
      images: JSON.stringify(p.images),
      sortOrder: p.sortOrder,
      status: p.status,
    };
    await prisma.product.upsert({
      where: { slug: p.slug },
      create: { slug: p.slug, ...data },
      update: data,
    });
    console.log(`  ✅ ${p.slug}`);
  }
  console.log('🎉 完成');
}

main()
  .catch((e) => {
    console.error('❌ seed 失败:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
