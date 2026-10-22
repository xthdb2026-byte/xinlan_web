/**
 * 产品目录扩充 Seed — 6 大分类共 32 款产品
 * 分类：华为网络产品系列 / 服务器及AI算力服务器系列 / 电脑设备系列 /
 *       海康威视监控解决方案系列 / 科大讯飞智能产品系列 / 希沃教育信息化产品系列
 *
 * 运行：npx tsx prisma/seed_product_catalog.ts
 * 说明：
 *  - upsert by slug，可重复执行
 *  - 旧版 3 个演示产品（智能交通/信息安全/智慧出行）会被置为 inactive
 *  - 价格均为含税市场参考价（更新日期 2026-08-29），实际成交以正式报价为准
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==================== 图片生成（统一白底产品摄影风格） ====================
const IMG_API = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image';
const STYLE =
  ', professional commercial product photography, studio softbox lighting, clean seamless light gray background, centered composition, photorealistic, ultra sharp details, 8k quality';
const gen = (base: string, view: string) =>
  `${IMG_API}?prompt=${encodeURIComponent(`${base}, ${view}${STYLE}`)}&image_size=landscape_4_3`;
const imgSet = (base: string, detailView: string) => ({
  cover: gen(base, 'front view'),
  images: [
    gen(base, 'front view'),
    gen(base, 'three-quarter side view'),
    gen(base, detailView),
  ],
});

const PRICE_DATE = '2026-08-29';
const PRICE_NOTE = '含税市场参考价，实际成交价以正式报价为准';

interface SpecItem { label: string; value: string }
interface SpecGroup { group: string; items: SpecItem[] }
interface Feature { title: string; detail: string }
interface ProductSeed {
  name: string;
  slug: string;
  category: string;
  description: string;
  features: Feature[];
  specs: SpecGroup[];
  price: { min: number; max: number; unit: string; note?: string };
  scenarios: string[];
  img: { cover: string; images: string[] };
}

// 分类常量
const CAT_HUAWEI_NET = '华为网络产品系列';
const CAT_SERVER = '服务器及AI算力服务器系列';
const CAT_PC = '电脑设备系列';
const CAT_HIK = '海康威视监控解决方案系列';
const CAT_IFLYTEK = '科大讯飞智能产品系列';
const CAT_SEEWO = '希沃教育信息化产品系列';

// 价格格式化为易读区间字符串
const fmtPrice = (p: ProductSeed['price']) => ({
  min: p.min,
  max: p.max,
  unit: p.unit,
  note: p.note ?? PRICE_NOTE,
  updatedAt: PRICE_DATE,
});

const catalog: ProductSeed[] = [
  // ============================================================
  // 一、华为网络产品系列（7 款）
  // ============================================================
  {
    name: '华为 CloudEngine S5735-L24T4S-A1 千兆接入交换机',
    slug: 'huawei-s5735-l24t4s-a1',
    category: CAT_HUAWEI_NET,
    description:
      '面向企业园区网接入层的千兆三层以太网交换机，提供24个千兆电口与4个万兆SFP+上行口，支持iStack智能堆叠与SVF超级虚拟交换网，满足办公、校园、酒店等场景的高密度终端接入需求。',
    features: [
      { title: '高性能转发', detail: '交换容量672Gbps，包转发率126Mpps，千兆接入万兆上行无阻塞' },
      { title: '灵活堆叠', detail: '支持iStack智能堆叠，多台设备虚拟化为一台，统一配置管理' },
      { title: '绿色节能', detail: '端口自动休眠与智能风扇调速，整机功耗低至24W' },
      { title: '简易运维', detail: '支持SVF超级虚拟交换网，接入设备即插即用、集中管控' },
    ],
    specs: [
      {
        group: '核心性能',
        items: [
          { label: '交换容量', value: '672 Gbps / 6.72 Tbps' },
          { label: '包转发率', value: '108 / 126 Mpps' },
          { label: 'MAC地址表', value: '32K' },
          { label: 'VLAN数量', value: '4K' },
        ],
      },
      {
        group: '端口规格',
        items: [
          { label: '下行端口', value: '24 × 10/100/1000Base-T 电口' },
          { label: '上行端口', value: '4 × 万兆 SFP+' },
          { label: '管理端口', value: '1 × Console（RJ45）、1 × USB' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '外形尺寸（宽×深×高）', value: '442 × 220 × 43.6 mm（1U）' },
          { label: '整机重量', value: '≤ 3.5 kg' },
          { label: '电源输入', value: 'AC 100–240V，50/60Hz' },
          { label: '典型功耗', value: '24 W' },
          { label: '工作温度', value: '-5℃ ～ +45℃' },
        ],
      },
    ],
    price: { min: 3200, max: 4500, unit: '元/台' },
    scenarios: ['中小型企业办公网接入', '校园网楼栋接入层部署', '酒店与商业综合体终端接入'],
    img: imgSet(
      'Huawei enterprise network switch, 1U rackmount metal chassis in dark gray, 24 gigabit ethernet RJ45 ports and 4 SFP+ fiber uplink slots on front panel, LED status indicators',
      'extreme close-up of the RJ45 ports and SFP+ fiber slots with glowing green status LEDs',
    ),
  },
  {
    name: '华为 CloudEngine S5735-L48P4X-A1 千兆PoE接入交换机',
    slug: 'huawei-s5735-l48p4x-a1',
    category: CAT_HUAWEI_NET,
    description:
      '高密度千兆PoE+接入交换机，48个千兆电口全线支持802.3at供电，740W大功率PoE预算，搭配4个万兆SFP+上行，是无线AP、IP摄像机、IP电话等终端的一线接入理想之选。',
    features: [
      { title: '全线PoE供电', detail: '48口全支持802.3at标准，单口最大30W，整机PoE功率740W' },
      { title: '万兆上行', detail: '4个万兆SFP+端口，保障高带宽回传链路' },
      { title: '智能供电管理', detail: '支持PoE分时供电与优先级管理，保障关键设备不断电' },
      { title: '电信级可靠', detail: '支持ERPS环网保护，故障50ms快速倒换' },
    ],
    specs: [
      {
        group: '核心性能',
        items: [
          { label: '交换容量', value: '688 Gbps / 6.88 Tbps' },
          { label: '包转发率', value: '144 / 166 Mpps' },
          { label: 'PoE标准', value: 'IEEE 802.3af / at（PoE+）' },
          { label: 'PoE功率预算', value: '740 W' },
        ],
      },
      {
        group: '端口规格',
        items: [
          { label: '下行端口', value: '48 × 10/100/1000Base-T（PoE+）' },
          { label: '上行端口', value: '4 × 万兆 SFP+' },
          { label: '管理端口', value: '1 × Console（RJ45）、1 × USB' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '外形尺寸（宽×深×高）', value: '442 × 420 × 43.6 mm（1U）' },
          { label: '整机重量', value: '≤ 7.7 kg' },
          { label: '电源输入', value: 'AC 100–240V，50/60Hz' },
          { label: '工作温度', value: '-5℃ ～ +45℃' },
        ],
      },
    ],
    price: { min: 6800, max: 9500, unit: '元/台' },
    scenarios: ['园区无线AP集中接入', '视频监控摄像机供电接入', '企业IP电话与会议终端接入'],
    img: imgSet(
      'Huawei enterprise PoE network switch, 1U rackmount, 48 gigabit RJ45 ports in two rows, 4 SFP+ uplink slots, dark gray metal chassis with LED indicators',
      'extreme close-up of dual-row RJ45 PoE ports with amber and green status LEDs',
    ),
  },
  {
    name: '华为 CloudEngine S6730-H24X6C 万兆核心交换机',
    slug: 'huawei-s6730-h24x6c',
    category: CAT_HUAWEI_NET,
    description:
      '新一代万兆盒式核心交换机，提供24个万兆SFP+与6个100GE QSFP28端口，搭载自研芯片与VxLAN虚拟化能力，可作为中大型园区网核心或数据中心接入层设备。',
    features: [
      { title: '超大容量', detail: '交换容量2.4Tbps，6个100GE上行端口满足未来5年演进' },
      { title: '网络虚拟化', detail: '支持VxLAN与BGP-EVPN，一张物理网承载多张逻辑业务网' },
      { title: '智能运维', detail: '支持Telemetry秒级数据采集与iPCA随路质量检测' },
      { title: '高可靠设计', detail: '双电源冗余与前后风道设计，保障核心层稳定运行' },
    ],
    specs: [
      {
        group: '核心性能',
        items: [
          { label: '交换容量', value: '2.4 Tbps / 4.8 Tbps' },
          { label: '包转发率', value: '1260 Mpps' },
          { label: 'MAC地址表', value: '256K' },
          { label: 'ARP表项', value: '128K' },
        ],
      },
      {
        group: '端口规格',
        items: [
          { label: '业务端口', value: '24 × 万兆 SFP+' },
          { label: '上行端口', value: '6 × 100GE QSFP28（兼容40GE）' },
          { label: '管理端口', value: '1 × Console、1 × 管理网口、1 × USB' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '外形尺寸（宽×深×高）', value: '442 × 420 × 43.6 mm（1U）' },
          { label: '电源', value: '1+1 可插拔冗余电源' },
          { label: '散热', value: '前后风道，3+1 冗余风扇' },
          { label: '工作温度', value: '-5℃ ～ +45℃' },
        ],
      },
    ],
    price: { min: 45000, max: 68000, unit: '元/台' },
    scenarios: ['大中型企业园区网核心层', '数据中心万兆服务器接入', '校园网骨干汇聚'],
    img: imgSet(
      'Huawei high-end data center core switch, 1U rackmount, 24 SFP+ fiber ports and 6 QSFP28 100G slots on front panel, premium dark metal chassis',
      'extreme close-up of SFP+ fiber optic ports and QSFP28 100G slots with status LEDs',
    ),
  },
  {
    name: '华为 CloudEngine S12700E-4 园区核心交换机',
    slug: 'huawei-s12700e-4',
    category: CAT_HUAWEI_NET,
    description:
      '旗舰级框式园区核心交换机，4个业务槽位，整机交换容量高达57.6Tbps，支持高密万兆/40GE/100GE线卡，面向大型政企园区、高校、医院构建高可靠核心网络。',
    features: [
      { title: '电信级架构', detail: '主控、交换网板、电源全冗余，99.999%可靠性' },
      { title: '超大容量', detail: '整机交换容量57.6Tbps，支持100GE平滑演进' },
      { title: '有线无线融合', detail: '内置随板AC能力，可管理6K无线AP' },
      { title: 'iMaster NCE协同', detail: '配合NCE-Campus实现SDN自动化与智能运维' },
    ],
    specs: [
      {
        group: '核心性能',
        items: [
          { label: '整机交换容量', value: '57.6 Tbps' },
          { label: '包转发率', value: '14400 Mpps' },
          { label: '业务槽位', value: '4 个' },
          { label: '主控槽位', value: '2 个（1:1 冗余）' },
        ],
      },
      {
        group: '扩展能力',
        items: [
          { label: '线卡类型', value: '48口千兆 / 48口万兆 / 8口100GE 等' },
          { label: '无线管理', value: '随板AC，最大管理 6K AP' },
          { label: '虚拟化', value: 'CSS2 集群、VxLAN、BGP-EVPN' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '外形尺寸（宽×深×高）', value: '442 × 517 × 441.7 mm（10U）' },
          { label: '电源', value: 'N+N / N+1 冗余（最大4个3000W）' },
          { label: '工作温度', value: '0℃ ～ +45℃' },
        ],
      },
    ],
    price: { min: 120000, max: 180000, unit: '元/套', note: '含税市场参考价（主机框+双主控+双电源基础配置），板卡另计，实际以正式报价为准' },
    scenarios: ['大型政企园区网络核心', '高校校园网骨干核心', '三甲医院内网核心交换'],
    img: imgSet(
      'Huawei flagship modular chassis core network switch, large 10U rackmount chassis with multiple line card slots, dual supervisor modules, premium black and dark gray enterprise design',
      'extreme close-up of modular line card slots and dual supervisor modules with status LEDs',
    ),
  },
  {
    name: '华为 USG6325E 下一代防火墙',
    slug: 'huawei-usg6325e',
    category: CAT_HUAWEI_NET,
    description:
      '面向中型企业与分支机构的下一代防火墙，集防火墙、IPS、防病毒、URL过滤、VPN于一体，基于AI的威胁检测引擎可精准识别未知威胁，构筑企业边界安全第一道防线。',
    features: [
      { title: '全面威胁防御', detail: '集成IPS/AV/URL过滤/反僵尸网络，IPS特征库12000+' },
      { title: 'AI智能检测', detail: '基于AI的恶意文件检测，未知威胁检出率提升60%' },
      { title: '高性能加密', detail: 'IPSec VPN吞吐量1.5Gbps，支持国密SM2/SM3/SM4' },
      { title: '云管协同', detail: '可接入iMaster NCE统一策略下发与日志分析' },
    ],
    specs: [
      {
        group: '核心性能',
        items: [
          { label: '防火墙吞吐量', value: '6 Gbps' },
          { label: '并发连接数', value: '400 万' },
          { label: '每秒新建连接', value: '8 万' },
          { label: 'IPS吞吐量', value: '2.2 Gbps' },
        ],
      },
      {
        group: '接口规格',
        items: [
          { label: '固定接口', value: '8 × GE Combo + 2 × 10GE SFP+' },
          { label: '扩展槽位', value: '2 × WSIC（可选8GE/8SFP卡）' },
          { label: 'VPN隧道数', value: 'IPSec 4000 条 / SSL 500 并发' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '外形尺寸（宽×深×高）', value: '442 × 421 × 43.6 mm（1U）' },
          { label: '电源', value: '可选双电源冗余' },
          { label: '工作温度', value: '0℃ ～ +45℃' },
        ],
      },
    ],
    price: { min: 18000, max: 28000, unit: '元/台', note: '含税市场参考价（主机，含1年特征库升级服务），实际以正式报价为准' },
    scenarios: ['中型企业互联网出口防护', '政企分支安全互联', '等保二级/三级合规建设'],
    img: imgSet(
      'Huawei next-generation firewall security appliance, 1U rackmount dark chassis, combo ethernet ports and SFP+ slots on front panel, security LED indicators',
      'extreme close-up of firewall combo ports and SFP+ slots with glowing status LEDs',
    ),
  },
  {
    name: '华为 AirEngine 5760-51 室内Wi-Fi 6无线AP',
    slug: 'huawei-airengine-5760-51',
    category: CAT_HUAWEI_NET,
    description:
      '支持Wi-Fi 6（802.11ax）标准的室内放装型无线接入点，整机速率高达5.37Gbps，内置智能天线与AI漫游技术，为高密办公、智慧教室、酒店客房提供极致无线体验。',
    features: [
      { title: 'Wi-Fi 6高速率', detail: '2.4GHz+5GHz双频，整机速率5.37Gbps，支持160MHz频宽' },
      { title: '智能天线', detail: '内置动态变焦智能天线，信号随需而动，覆盖提升20%' },
      { title: '2.5GE上行', detail: '配备2.5GE电口，突破千兆瓶颈，发挥Wi-Fi 6性能' },
      { title: 'AI漫游', detail: '智能引导终端漫游，漫游切换时延低至10ms' },
    ],
    specs: [
      {
        group: '无线规格',
        items: [
          { label: '协议标准', value: 'IEEE 802.11ax（Wi-Fi 6），兼容11a/b/g/n/ac' },
          { label: '整机速率', value: '5.37 Gbps（0.575G + 4.8G）' },
          { label: '工作频段', value: '2.4GHz（4×4 MIMO）+ 5GHz（4×4 MIMO）' },
          { label: '最大接入用户', value: '1024' },
        ],
      },
      {
        group: '接口规格',
        items: [
          { label: '上行接口', value: '1 × 2.5GE 电口（PoE in）+ 1 × GE' },
          { label: '供电方式', value: '802.3at PoE / DC 12V' },
          { label: '天线', value: '内置智能天线' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '外形尺寸（直径×高）', value: '220 × 50 mm' },
          { label: '整机重量', value: '1.2 kg' },
          { label: '最大功耗', value: '21.7 W' },
          { label: '工作温度', value: '-10℃ ～ +50℃' },
        ],
      },
    ],
    price: { min: 2500, max: 3600, unit: '元/台' },
    scenarios: ['企业高密办公无线覆盖', '高校智慧教室无线接入', '酒店客房与会议厅覆盖'],
    img: imgSet(
      'Huawei AirEngine ceiling-mount Wi-Fi 6 wireless access point, white circular minimalist design with smooth surface and subtle status LED ring',
      'extreme close-up of the access point edge showing LED indicator ring and ventilation design',
    ),
  },
  {
    name: '华为 NetEngine AR6280 企业级路由器',
    slug: 'huawei-ar6280',
    category: CAT_HUAWEI_NET,
    description:
      '面向大型企业总部与数据中心的模块化路由器，双主控双电源冗余设计，转发性能高达60Mpps，支持SD-WAN与丰富业务插卡，是企业广域互联的核心枢纽。',
    features: [
      { title: '高性能转发', detail: '自研芯片，转发性能60Mpps，满足总部多业务汇聚' },
      { title: 'SD-WAN就绪', detail: '支持混合链路接入与智能选路，专线成本降低40%' },
      { title: '高可靠架构', detail: '双主控、双电源、风扇冗余，关键部件热插拔' },
      { title: '灵活扩展', detail: '8个SIC槽位，支持LAN/WAN/语音/安全等多业务插卡' },
    ],
    specs: [
      {
        group: '核心性能',
        items: [
          { label: '转发性能', value: '60 Mpps' },
          { label: '整机交换容量', value: '320 Gbps' },
          { label: '路由表容量', value: 'IPv4: 400K / IPv6: 200K' },
          { label: 'SIC扩展槽位', value: '8 个' },
        ],
      },
      {
        group: '接口规格',
        items: [
          { label: '固定接口', value: '2 × GE Combo WAN + 8 × GE LAN' },
          { label: '扩展插卡', value: '可选 E1/T1、异步串口、FXS/FXO、4G LTE 等' },
          { label: 'VPN能力', value: 'IPSec / SSL / GRE / L2TP' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '外形尺寸（宽×深×高）', value: '442 × 420 × 88.2 mm（2U）' },
          { label: '电源', value: '1+1 冗余，AC 100–240V' },
          { label: '工作温度', value: '0℃ ～ +45℃' },
        ],
      },
    ],
    price: { min: 35000, max: 52000, unit: '元/台', note: '含税市场参考价（主机+双电源基础配置），业务插卡另计，实际以正式报价为准' },
    scenarios: ['企业总部广域网出口', 'SD-WAN分支互联中心节点', '政府纵向网汇聚接入'],
    img: imgSet(
      'Huawei enterprise modular router, 2U rackmount chassis, dual power supply modules, WAN and LAN ethernet ports with expansion slot panels, professional dark gray design',
      'extreme close-up of router modular slots and ethernet ports with link status LEDs',
    ),
  },

  // ============================================================
  // 二、服务器及AI算力服务器系列（6 款）
  // ============================================================
  {
    name: '超聚变 FusionServer 2288H V6 2U双路机架服务器',
    slug: 'fusionserver-2288h-v6',
    category: CAT_SERVER,
    description:
      '2U双路主流机架服务器，搭载第三代英特尔至强可扩展处理器，32个DDR4内存插槽，支持灵活存储与GPU扩展配置，广泛适用于虚拟化、数据库、云计算等企业核心业务。',
    features: [
      { title: '强劲算力', detail: '2颗至强可扩展处理器，单颗最高40核，性能较前代提升46%' },
      { title: '海量内存', detail: '32个DDR4插槽，最大支持8TB，支持傲腾持久内存' },
      { title: '灵活存储', detail: '最多支持20个3.5英寸或45个2.5英寸硬盘，NVMe可选' },
      { title: '智能管理', detail: 'iBMC远程管理，故障预测准确率达93%，运维效率倍增' },
    ],
    specs: [
      {
        group: '核心配置',
        items: [
          { label: '处理器', value: '2 × 第三代英特尔至强可扩展（最高40核/270W）' },
          { label: '内存', value: '32 × DDR4 DIMM，最大8TB，3200MT/s' },
          { label: '芯片组', value: 'Intel C621A' },
          { label: 'GPU支持', value: '最大4个双宽或14个单宽GPU' },
        ],
      },
      {
        group: '存储与接口',
        items: [
          { label: '硬盘支持', value: '最大20 × 3.5" 或 45 × 2.5"，支持NVMe SSD' },
          { label: 'RAID', value: 'RAID 0/1/5/6/10/50/60，带超级电容保护' },
          { label: 'PCIe扩展', value: '最大14个PCIe 4.0插槽' },
          { label: '网络', value: '板载2 × GE + 2 × 10GE（可选OCP 3.0）' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '外形尺寸（宽×深×高）', value: '447 × 790 × 86.1 mm（2U）' },
          { label: '电源', value: '1+1冗余，900W/1500W/2000W白金电源可选' },
          { label: '工作温度', value: '5℃ ～ +45℃' },
        ],
      },
    ],
    price: { min: 42000, max: 85000, unit: '元/台', note: '含税市场参考价（随CPU/内存/硬盘配置浮动），实际以正式报价为准' },
    scenarios: ['企业虚拟化与私有云平台', '数据库与ERP核心承载', '云计算资源池节点'],
    img: imgSet(
      'FusionServer 2U rackmount server, sleek black and silver chassis with ventilation grille front panel, hot-swap drive bays, professional data center equipment',
      'extreme close-up of server hot-swap drive bays and front panel status indicators',
    ),
  },
  {
    name: '超聚变 FusionServer 2488H V6 2U四路机架服务器',
    slug: 'fusionserver-2488h-v6',
    category: CAT_SERVER,
    description:
      '2U四路高性能机架服务器，4颗至强可扩展处理器与48个内存插槽，在紧凑空间内提供超强计算密度，是内存数据库、虚拟化整合与关键业务应用的理想平台。',
    features: [
      { title: '四路强算', detail: '4颗至强可扩展处理器，整机最高112核224线程' },
      { title: '超大内存', detail: '48个DDR4插槽，最大12TB容量，适配SAP HANA场景' },
      { title: '高密设计', detail: '2U空间实现四路算力，相比4U机型节省50%机柜空间' },
      { title: '可靠运行', detail: '全冗余电源风扇，支持内存镜像与故障在线修复' },
    ],
    specs: [
      {
        group: '核心配置',
        items: [
          { label: '处理器', value: '4 × 第三代英特尔至强可扩展（最高28核/250W）' },
          { label: '内存', value: '48 × DDR4 DIMM，最大12TB' },
          { label: '互联总线', value: 'UPI 3路，11.2GT/s' },
        ],
      },
      {
        group: '存储与接口',
        items: [
          { label: '硬盘支持', value: '最大25 × 2.5"，支持NVMe SSD' },
          { label: 'RAID', value: 'RAID 0/1/5/6/10/50/60' },
          { label: 'PCIe扩展', value: '最大11个PCIe 4.0插槽' },
          { label: '网络', value: '2 × OCP 3.0扩展位（GE/10GE/25GE可选）' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '外形尺寸（宽×深×高）', value: '447 × 790 × 86.1 mm（2U）' },
          { label: '电源', value: '2+2冗余，1500W/2000W白金电源' },
          { label: '工作温度', value: '5℃ ～ +40℃' },
        ],
      },
    ],
    price: { min: 150000, max: 280000, unit: '元/台', note: '含税市场参考价（随配置浮动），实际以正式报价为准' },
    scenarios: ['SAP HANA内存数据库', '大规模虚拟化整合', '金融核心业务系统'],
    img: imgSet(
      'high-performance 4-socket 2U rackmount server, premium black chassis with dense ventilation grille, front drive bays and diagnostic LCD panel, data center equipment',
      'extreme close-up of server front drive bays and diagnostic status display',
    ),
  },
  {
    name: '华为 Atlas 800 推理服务器（型号 3010）',
    slug: 'huawei-atlas-800-3010',
    category: CAT_SERVER,
    description:
      '面向AI推理场景的高密度算力服务器，最大支持8张Atlas 300I Pro推理卡，整机INT8算力高达1120 TOPS，为智慧城市、智慧交通、金融风控提供实时AI推理能力。',
    features: [
      { title: '超强推理算力', detail: '8张Atlas 300I Pro推理卡，整机INT8算力1120 TOPS' },
      { title: '高密低耗', detail: '2U空间提供8卡算力，单卡典型功耗仅72W' },
      { title: '视频解析专家', detail: '整机支持640路高清视频实时分析' },
      { title: '全栈AI生态', detail: '完美适配MindSpore、TensorFlow、PyTorch主流框架' },
    ],
    specs: [
      {
        group: '核心配置',
        items: [
          { label: '处理器', value: '2 × 英特尔至强可扩展处理器' },
          { label: 'AI算力卡', value: '最大8 × Atlas 300I Pro（昇腾310P）' },
          { label: 'AI算力', value: 'INT8：1120 TOPS / FP16：560 TFLOPS' },
          { label: '内存', value: '16 × DDR4 DIMM，最大2TB' },
        ],
      },
      {
        group: '存储与接口',
        items: [
          { label: '硬盘支持', value: '最大8 × 2.5" SAS/SATA' },
          { label: 'PCIe扩展', value: '10 × PCIe 4.0 插槽' },
          { label: '网络', value: '2 × GE + 2 × 10GE，OCP 3.0可选' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '外形尺寸（宽×深×高）', value: '447 × 790 × 86.1 mm（2U）' },
          { label: '电源', value: '1+1冗余，2000W白金电源' },
          { label: '工作温度', value: '5℃ ～ +40℃' },
        ],
      },
    ],
    price: { min: 180000, max: 320000, unit: '元/台', note: '含税市场参考价（随推理卡数量浮动），实际以正式报价为准' },
    scenarios: ['智慧城市视频结构化分析', '智慧交通卡口违法识别', '金融智能风控实时推理'],
    img: imgSet(
      'Huawei Atlas AI inference server, 2U rackmount with GPU accelerator cards visible, high-tech black chassis with blue accent lighting, data center AI computing equipment',
      'extreme close-up of AI accelerator card slots and cooling vents with blue LED accents',
    ),
  },
  {
    name: '华为 Atlas 800 训练服务器（型号 9010）',
    slug: 'huawei-atlas-800-9010',
    category: CAT_SERVER,
    description:
      '旗舰级AI训练服务器，搭载8颗昇腾910 AI处理器，整机FP16算力高达2.24 PFLOPS，配合100GE高速互联，为大模型训练、自动驾驶研发、科学计算提供澎湃算力。',
    features: [
      { title: '澎湃训练算力', detail: '8颗昇腾910处理器，FP16算力2.24 PFLOPS' },
      { title: '高速互联', detail: '8 × 100GE RoCE接口，参数面通信效率业界领先' },
      { title: '液冷可选', detail: '支持冷板式液冷，整机PUE低至1.15' },
      { title: '大模型利器', detail: '支持千亿参数大模型分布式训练，线性度达85%' },
    ],
    specs: [
      {
        group: '核心配置',
        items: [
          { label: 'AI处理器', value: '8 × 昇腾 910（达芬奇架构）' },
          { label: 'AI算力', value: 'FP16：2.24 PFLOPS / INT8：4.48 POPS' },
          { label: 'HBM显存', value: '8 × 32GB，共256GB' },
          { label: '通用处理器', value: '2 × 英特尔至强可扩展处理器' },
        ],
      },
      {
        group: '互联与存储',
        items: [
          { label: '参数面互联', value: '8 × 100GE RoCE v2' },
          { label: '业务面接口', value: '4 × 25GE' },
          { label: '本地存储', value: '最大8 × 2.5" NVMe SSD' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '外形尺寸（宽×深×高）', value: '447 × 790 × 175 mm（4U）' },
          { label: '供电', value: '4 × 3000W热插拔电源，2+2冗余' },
          { label: '散热', value: '风冷 / 冷板式液冷可选' },
        ],
      },
    ],
    price: { min: 980000, max: 1350000, unit: '元/台', note: '含税市场参考价，实际以项目正式报价为准' },
    scenarios: ['AI大模型训练与微调', '自动驾驶算法研发', '高校科研计算平台'],
    img: imgSet(
      'Huawei Atlas 900 AI training server, large 4U rackmount supercomputer with multiple NPU modules, futuristic black chassis with blue LED accent strips, high-performance computing equipment',
      'extreme close-up of AI processor modules with heat sinks and blue status lighting',
    ),
  },
  {
    name: '联想 ThinkSystem SR650 2U机架服务器',
    slug: 'lenovo-thinksystem-sr650',
    category: CAT_SERVER,
    description:
      '业界标杆级2U双路机架服务器，支持两颗第三代至强可扩展处理器与24个内存插槽，以卓越的可靠性、灵活的配置组合和XClarity智能管理，成为企业通用计算首选。',
    features: [
      { title: '均衡性能', detail: '2颗至强可扩展处理器，最高40核，兼顾性能与成本' },
      { title: '业界领先可靠性', detail: '连续多年ITIC可靠性调查x86服务器排名第一' },
      { title: 'XClarity管理', detail: '集中化管理平台，批量部署效率提升75%' },
      { title: '灵活配置', detail: '丰富硬盘/GPU/网卡组合，按需定制业务配置' },
    ],
    specs: [
      {
        group: '核心配置',
        items: [
          { label: '处理器', value: '2 × 第三代英特尔至强可扩展（最高40核）' },
          { label: '内存', value: '24 × DDR4 DIMM，最大6TB，3200MT/s' },
          { label: 'GPU支持', value: '最大3个双宽GPU' },
        ],
      },
      {
        group: '存储与接口',
        items: [
          { label: '硬盘支持', value: '最大20 × 3.5" 或 32 × 2.5"，支持NVMe' },
          { label: 'RAID', value: '硬件RAID 0/1/5/6/10/50/60' },
          { label: 'PCIe扩展', value: '最大8个PCIe 4.0插槽' },
          { label: '网络', value: '1 × OCP 3.0 + PCIe扩展网卡' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '外形尺寸（宽×深×高）', value: '445 × 746 × 86.5 mm（2U）' },
          { label: '电源', value: '1+1冗余，750W/1100W/1800W白金/钛金' },
          { label: '工作温度', value: '5℃ ～ +45℃（ASHRAE A3）' },
        ],
      },
    ],
    price: { min: 38000, max: 78000, unit: '元/台', note: '含税市场参考价（随配置浮动），实际以正式报价为准' },
    scenarios: ['企业虚拟化与VDI桌面云', '中小型数据库应用', '分布式存储节点'],
    img: imgSet(
      'Lenovo ThinkSystem 2U rackmount server, matte black chassis with Lenovo branding style, front ventilation grille and hot-swap drive bays, enterprise data center equipment',
      'extreme close-up of ThinkSystem server drive bays and front USB/management ports',
    ),
  },
  {
    name: '戴尔 PowerEdge R750 2U机架服务器',
    slug: 'dell-poweredge-r750',
    category: CAT_SERVER,
    description:
      '戴尔第15代主流机架服务器，双路第三代至强可扩展处理器，32个DDR4插槽，全面支持PCIe Gen4与NVMe，以iDRAC9智能管理和网络弹性架构服务企业数字化转型。',
    features: [
      { title: 'PCIe Gen4加持', detail: '全PCIe 4.0通道，I/O带宽翻倍，NVMe性能飙升' },
      { title: 'iDRAC9智能管理', detail: '免代理远程管理，支持遥测数据流式分析' },
      { title: '网络弹性架构', detail: '硅片级信任根与固件加密验证，防篡改可追溯' },
      { title: '绿色计算', detail: '多矢量散热2.0，能效比业界领先，降低TCO' },
    ],
    specs: [
      {
        group: '核心配置',
        items: [
          { label: '处理器', value: '2 × 第三代英特尔至强可扩展（最高40核）' },
          { label: '内存', value: '32 × DDR4 DIMM，最大8TB RDIMM' },
          { label: 'GPU支持', value: '最大3个双宽或8个单宽GPU' },
        ],
      },
      {
        group: '存储与接口',
        items: [
          { label: '硬盘支持', value: '最大12 × 3.5" 或 28 × 2.5"，24 × NVMe直连可选' },
          { label: 'RAID', value: 'PERC 11代，RAID 0/1/5/6/10/50/60' },
          { label: 'PCIe扩展', value: '最大8个PCIe 4.0插槽' },
          { label: '网络', value: 'OCP 3.0插槽 + 板载双口25GE可选' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '外形尺寸（宽×深×高）', value: '434 × 736.3 × 86.8 mm（2U）' },
          { label: '电源', value: '1+1冗余，800W/1100W/1400W/2400W白金/钛金' },
          { label: '管理', value: 'iDRAC9 with Lifecycle Controller' },
        ],
      },
    ],
    price: { min: 45000, max: 90000, unit: '元/台', note: '含税市场参考价（随配置浮动），实际以正式报价为准' },
    scenarios: ['企业核心应用与数据库', '软件定义数据中心', 'AI推理与边缘计算'],
    img: imgSet(
      'Dell PowerEdge R750 2U rackmount server, iconic curved silver front bezel with hexagonal ventilation pattern, black chassis, enterprise data center equipment',
      'extreme close-up of PowerEdge front bezel hexagonal grille and drive bay indicators',
    ),
  },

  // ============================================================
  // 三、电脑设备系列（5 款）
  // ============================================================
  {
    name: '华为 MateStation B520 商用台式机',
    slug: 'huawei-matestation-b520',
    category: CAT_PC,
    description:
      '面向政企办公的紧凑型商用台式机，搭载第12代酷睿处理器，8L小巧机身支持Wi-Fi 6与华为超级终端协同，通过严苛军规测试，为现代办公提供高效可靠的桌面算力。',
    features: [
      { title: '小巧强芯', detail: '8L紧凑机身容纳第12代酷睿i5-12400，桌面空间节省60%' },
      { title: '超级终端', detail: '与华为手机/平板一碰协同，文件互传、跨屏编辑' },
      { title: '军规品质', detail: '通过13项军规测试与MTBF 100万小时认证' },
      { title: '静音散热', detail: '鲨鱼鳍风扇+立体风道，满载噪音低至22dB' },
    ],
    specs: [
      {
        group: '核心配置',
        items: [
          { label: '处理器', value: '英特尔酷睿 i5-12400（6核12线程，最高4.4GHz）' },
          { label: '内存', value: '16GB DDR4 3200MHz（双插槽，最大64GB）' },
          { label: '硬盘', value: '512GB NVMe PCIe SSD（支持扩展2.5" HDD）' },
          { label: '显卡', value: 'Intel UHD Graphics 730' },
        ],
      },
      {
        group: '接口与网络',
        items: [
          { label: '前置接口', value: '1 × USB-C、2 × USB-A 3.2、耳机孔' },
          { label: '后置接口', value: '4 × USB-A、HDMI、DP、VGA、RJ45、串口' },
          { label: '无线网络', value: 'Wi-Fi 6 + 蓝牙5.1' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '机箱容积', value: '8 L' },
          { label: '外形尺寸（宽×深×高）', value: '93 × 293 × 315 mm' },
          { label: '整机重量', value: '约4.2 kg' },
          { label: '电源', value: '180W，能效≥88%' },
        ],
      },
    ],
    price: { min: 3899, max: 5299, unit: '元/台', note: '含税市场参考价（随配置浮动，不含显示器），实际以正式报价为准' },
    scenarios: ['政企日常办公桌面', '政务窗口服务终端', '财务与人事业务处理'],
    img: imgSet(
      'Huawei MateStation compact business desktop PC tower, small 8L form factor, minimalist dark gray metal case with subtle front grille, modern office computer',
      'extreme close-up of front panel USB-C ports and power button with breathing LED',
    ),
  },
  {
    name: '华为 MateBook X Pro 2024 轻薄旗舰笔记本',
    slug: 'huawei-matebook-x-pro-2024',
    category: CAT_PC,
    description:
      '980g超轻薄旗舰商务本，搭载英特尔酷睿Ultra 9处理器与14.2英寸3.1K柔性OLED触控屏，配备华为鲨鱼鳍散热与超级终端能力，为高端商务人士打造移动生产力旗舰。',
    features: [
      { title: '极致轻薄', detail: '航空级镁合金机身，仅重980g、厚13.5mm' },
      { title: '旗舰屏幕', detail: '14.2英寸3.1K OLED触控屏，ΔE<1专业级色准' },
      { title: 'AI算力', detail: '酷睿Ultra 9 185H，NPU加持本地AI应用加速' },
      { title: '超级中转站', detail: '跨设备文件暂存流转，手机PC素材自由拖拽' },
    ],
    specs: [
      {
        group: '核心配置',
        items: [
          { label: '处理器', value: '英特尔酷睿 Ultra 9 185H（16核22线程）' },
          { label: '内存', value: '32GB LPDDR5x 7467MHz' },
          { label: '硬盘', value: '2TB NVMe PCIe SSD' },
          { label: '显卡', value: 'Intel Arc 核显' },
        ],
      },
      {
        group: '屏幕与交互',
        items: [
          { label: '屏幕', value: '14.2英寸 OLED，3120×2080，120Hz' },
          { label: '色域', value: '100% DCI-P3，ΔE<1' },
          { label: '摄像头', value: '1080P AI慧眼摄像头' },
          { label: '音频', value: '6扬声器，Huawei Sound' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '整机重量', value: '约 980 g' },
          { label: '机身厚度', value: '13.5 mm' },
          { label: '电池', value: '70Wh，支持90W超级快充' },
          { label: '接口', value: '2 × 雷电4、1 × USB-C、摄像头物理开关' },
        ],
      },
    ],
    price: { min: 12499, max: 14999, unit: '元/台' },
    scenarios: ['企业高管移动办公', '商务差旅演示汇报', '创意设计与内容创作'],
    img: imgSet(
      'Huawei MateBook X Pro ultra-thin premium laptop, 14 inch, sleek silver aluminum-magnesium body, edge-to-edge OLED display showing elegant wallpaper, minimalist luxury business laptop',
      'extreme close-up of laptop hinge and keyboard edge showing premium metal craftsmanship',
    ),
  },
  {
    name: '联想启天 M650 商用台式机',
    slug: 'lenovo-qitian-m650',
    category: CAT_PC,
    description:
      '专为中国政企打造的商用台式机，第13代酷睿处理器搭配稳定可靠的整机设计，支持USB管控、机箱入侵报警等安全特性，并通过百万小时MTBF认证，广泛适配行业办公。',
    features: [
      { title: '稳定可靠', detail: 'MTBF 100万小时认证，7×24小时连续稳定运行' },
      { title: '安全管控', detail: 'USB端口分级管控+机箱入侵报警，防止数据外泄' },
      { title: '强劲性能', detail: '第13代酷睿i5-13500，14核20线程从容应对多任务' },
      { title: '灵活部署', detail: '支持立卧两用与背挂显示器安装，适配各类工位' },
    ],
    specs: [
      {
        group: '核心配置',
        items: [
          { label: '处理器', value: '英特尔酷睿 i5-13500（14核20线程）' },
          { label: '内存', value: '16GB DDR4 3200MHz（最大64GB）' },
          { label: '硬盘', value: '512GB SSD + 1TB HDD 双硬盘' },
          { label: '显卡', value: 'Intel UHD Graphics 770（可选独立显卡）' },
        ],
      },
      {
        group: '接口与安全',
        items: [
          { label: '前置接口', value: '2 × USB 3.2、1 × USB-C、耳机孔' },
          { label: '后置接口', value: '4 × USB、HDMI、VGA、DP、RJ45、串口' },
          { label: '安全特性', value: 'TPM 2.0芯片、USB管控、机箱锁孔' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '机箱容积', value: '13.6 L 塔式' },
          { label: '外形尺寸（宽×深×高）', value: '165 × 302 × 346 mm' },
          { label: '电源', value: '260W，能效85%' },
          { label: '认证', value: 'MTBF 100万小时、3C、节能、十环' },
        ],
      },
    ],
    price: { min: 3599, max: 4899, unit: '元/台', note: '含税市场参考价（不含显示器），实际以正式报价为准' },
    scenarios: ['政府事业单位办公', '银行柜台业务终端', '学校机房与电教室'],
    img: imgSet(
      'Lenovo business desktop tower PC, matte black 13L chassis with classic front ventilation design, professional office computer with optical drive bay',
      'extreme close-up of front USB ports and power button of the business desktop tower',
    ),
  },
  {
    name: '戴尔 OptiPlex 7020 商用台式机',
    slug: 'dell-optiplex-7020',
    category: CAT_PC,
    description:
      '全球政企广泛采用的商用台式机平台，第14代酷睿处理器与DDR5内存带来充沛性能，模块化免工具设计与Dell Optimizer智能调优，为企业IT提供易部署、易管理的桌面终端。',
    features: [
      { title: '新一代性能', detail: '第14代酷睿i5-14500+DDR5内存，性能提升显著' },
      { title: '免工具维护', detail: '模块化设计，硬盘内存升级无需工具，运维高效' },
      { title: '智能调优', detail: 'Dell Optimizer根据使用习惯智能分配性能与音频' },
      { title: '绿色低碳', detail: '机身采用50%回收塑料，EPEAT金牌与能源之星认证' },
    ],
    specs: [
      {
        group: '核心配置',
        items: [
          { label: '处理器', value: '英特尔酷睿 i5-14500（14核20线程，最高5.0GHz）' },
          { label: '内存', value: '16GB DDR5 5600MHz（4插槽，最大128GB）' },
          { label: '硬盘', value: '512GB PCIe 4.0 NVMe SSD' },
          { label: '显卡', value: 'Intel UHD Graphics 770（可选RTX 3050）' },
        ],
      },
      {
        group: '接口与扩展',
        items: [
          { label: '前置接口', value: '2 × USB 3.2、1 × USB-C 3.2、音频口' },
          { label: '后置接口', value: '4 × USB 3.2、2 × DP 1.4、RJ45' },
          { label: '扩展槽', value: '1 × PCIe x16、1 × PCIe x1、2 × M.2' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '机型形态', value: 'MT塔式 / SFF小机箱可选' },
          { label: '外形尺寸（MT宽×深×高）', value: '169 × 300.8 × 367 mm' },
          { label: '电源', value: '260W / 300W，80 PLUS白金可选' },
          { label: '安全', value: 'TPM 2.0、Kensington锁孔、机箱入侵开关' },
        ],
      },
    ],
    price: { min: 3999, max: 5599, unit: '元/台', note: '含税市场参考价（不含显示器），实际以正式报价为准' },
    scenarios: ['外资企业标准化办公', '呼叫中心坐席终端', '研发测试与财务工作站'],
    img: imgSet(
      'Dell OptiPlex business desktop tower PC, black chassis with triangular ventilation pattern on front panel, clean professional design, modern office computer',
      'extreme close-up of OptiPlex front panel triangular vent pattern and USB-C port',
    ),
  },
  {
    name: '华为 MateView 28.2英寸4K+专业显示器',
    slug: 'huawei-mateview-28',
    category: CAT_PC,
    description:
      '28.2英寸3:2生产力比例专业显示器，3840×2560分辨率与98% DCI-P3广色域，支持无线投屏与USB-C一线连，独特升降旋转支架，为办公创作提供沉浸式视觉体验。',
    features: [
      { title: '4K+生产力屏', detail: '28.2英寸3:2比例，比16:9多显示18.5%纵向内容' },
      { title: '专业色彩', detail: '98% DCI-P3广色域，ΔE<1出厂逐台校色' },
      { title: '无线投屏', detail: '华为手机一碰投屏，支持Desktop Mode桌面模式' },
      { title: '一线连办公', detail: 'USB-C 65W反向供电，一线传输视频数据与电力' },
    ],
    specs: [
      {
        group: '显示规格',
        items: [
          { label: '屏幕尺寸', value: '28.2 英寸，3:2 比例' },
          { label: '分辨率', value: '3840 × 2560（4K+）' },
          { label: '色域/色准', value: '98% DCI-P3，ΔE<1' },
          { label: '亮度/对比度', value: '500nit（HDR400）/ 1200:1' },
        ],
      },
      {
        group: '接口与功能',
        items: [
          { label: '视频接口', value: '1 × USB-C（65W）、1 × HDMI、1 × MiniDP' },
          { label: 'USB扩展', value: '2 × USB-A 3.0、1 × 3.5mm音频' },
          { label: '无线功能', value: '无线投屏（支持Desktop Mode）' },
          { label: '音频', value: '双5W扬声器 + 双麦克风' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '支架功能', value: '升降110mm、俯仰-5°~+18°' },
          { label: '外观', value: '铝合金一体化机身，94%屏占比' },
          { label: '认证', value: '莱茵低蓝光、无频闪双重护眼认证' },
        ],
      },
    ],
    price: { min: 3199, max: 3999, unit: '元/台' },
    scenarios: ['设计创作与影像处理', '金融数据多窗口分析', '高管办公室桌面显示'],
    img: imgSet(
      'Huawei MateView premium 28 inch 4K professional monitor, ultra-slim aluminum frame, minimalist height-adjustable stand, nearly borderless display showing colorful gradient wallpaper',
      'extreme close-up of monitor slim aluminum frame edge and premium metal stand base',
    ),
  },

  // ============================================================
  // 四、海康威视监控解决方案系列（5 款）
  // ============================================================
  {
    name: '海康威视 DS-2CD3T46WDV3-I3 400万星光级筒型摄像机',
    slug: 'hikvision-2cd3t46wd-i3',
    category: CAT_HIK,
    description:
      '400万像素星光级红外筒型网络摄像机，采用1/3英寸背照式CMOS与智能补光技术，0.005Lux微光环境仍可全彩成像，IP67防护适应户外全天候部署，是周界与园区监控的主力机型。',
    features: [
      { title: '星光级夜视', detail: '0.005Lux低照度，F1.6大光圈，夜间成像清晰明亮' },
      { title: '智能侦测', detail: '支持人车分类侦测、越界与区域入侵报警，误报率低' },
      { title: '高效编码', detail: 'H.265+智能编码，带宽与存储占用降低50%' },
      { title: '宽动态强', detail: '120dB宽动态，逆光环境下人脸细节清晰可辨' },
    ],
    specs: [
      {
        group: '图像性能',
        items: [
          { label: '传感器', value: '1/3" Progressive Scan CMOS' },
          { label: '最大分辨率', value: '2560 × 1440（400万）@ 20fps' },
          { label: '最低照度', value: '彩色 0.005Lux @ F1.6，0Lux with IR' },
          { label: '宽动态', value: '120 dB' },
        ],
      },
      {
        group: '镜头与补光',
        items: [
          { label: '镜头', value: '4mm/6mm/8mm/12mm 可选（水平视场角79°~38°）' },
          { label: '红外距离', value: '最远 30 m' },
          { label: '编码标准', value: 'H.265+ / H.265 / H.264' },
        ],
      },
      {
        group: '接口与环境',
        items: [
          { label: '网络接口', value: '1 × RJ45 10M/100M' },
          { label: '供电', value: 'DC 12V / PoE（802.3af）' },
          { label: '防护等级', value: 'IP67' },
          { label: '工作温度', value: '-30℃ ～ +60℃' },
        ],
      },
    ],
    price: { min: 380, max: 520, unit: '元/台' },
    scenarios: ['园区周界入侵防范', '工厂车间生产监控', '小区道路与出入口监控'],
    img: imgSet(
      'Hikvision bullet security camera, white cylindrical aluminum housing with sun shield, infrared LED array around lens, outdoor surveillance camera, professional security equipment',
      'extreme close-up of camera lens surrounded by infrared LED array and IR-cut glass',
    ),
  },
  {
    name: '海康威视 DS-2DC4223IW-D 400万23倍智能球机',
    slug: 'hikvision-2dc4223iw-d',
    category: CAT_HIK,
    description:
      '400万像素23倍光学变焦红外网络智能球机，150米红外夜视搭配360°连续旋转云台，支持人脸抓拍与智能跟踪，满足广场、园区、工地等大范围场景的远距离细节监控。',
    features: [
      { title: '23倍光学变焦', detail: '4.8-110mm焦距，百米外人脸车牌细节清晰' },
      { title: '150米红外', detail: '大功率红外灯智能补光，黑夜如白昼' },
      { title: '智能跟踪', detail: '人车目标自动锁定跟踪，联动抓拍取证' },
      { title: '360°巡航', detail: '水平360°连续旋转，支持256个预置位巡航' },
    ],
    specs: [
      {
        group: '图像性能',
        items: [
          { label: '传感器', value: '1/2.8" Progressive Scan CMOS' },
          { label: '最大分辨率', value: '2560 × 1440（400万）@ 25fps' },
          { label: '最低照度', value: '彩色 0.005Lux @ F1.6' },
          { label: '变焦能力', value: '23倍光学变焦 + 16倍数字变焦' },
        ],
      },
      {
        group: '云台与补光',
        items: [
          { label: '镜头焦距', value: '4.8 – 110 mm' },
          { label: '云台范围', value: '水平360°连续旋转 / 垂直-15°~+90°' },
          { label: '红外距离', value: '最远 150 m' },
          { label: '预置位', value: '256 个，支持8条巡航扫描' },
        ],
      },
      {
        group: '接口与环境',
        items: [
          { label: '网络接口', value: '1 × RJ45 10M/100M' },
          { label: '供电', value: 'DC 12V / PoE+（802.3at）' },
          { label: '防护等级', value: 'IP66，TVS 6000V防雷' },
          { label: '工作温度', value: '-30℃ ～ +65℃' },
        ],
      },
    ],
    price: { min: 2800, max: 3900, unit: '元/台' },
    scenarios: ['城市广场大范围监控', '建筑工地安全管控', '校园操场与园区制高点'],
    img: imgSet(
      'Hikvision PTZ dome speed dome security camera, white spherical housing with dark tinted dome cover, wall mount bracket, professional outdoor surveillance equipment',
      'extreme close-up of PTZ camera dome showing the zoom lens through tinted glass',
    ),
  },
  {
    name: '海康威视 DS-2CD7A47FWD-XZS 400万AI全结构化筒机',
    slug: 'hikvision-2cd7a47-xzs',
    category: CAT_HIK,
    description:
      '搭载深度学习算法的AI全结构化筒型摄像机，400万像素支持人脸、人体、机动车、非机动车多目标同步抓拍与结构化属性提取，为平安城市与雪亮工程提供数据智能。',
    features: [
      { title: '全结构化抓拍', detail: '人脸/人体/机动车/非机动车四目标同步抓拍识别' },
      { title: '深度学习算法', detail: '属性提取准确率高，支持口罩人脸识别' },
      { title: '双光谱成像', detail: '白光全彩+红外双补光模式，按需智能切换' },
      { title: '高倍变焦镜头', detail: '2.8-12mm电动变焦，远程调试免登高' },
    ],
    specs: [
      {
        group: 'AI能力',
        items: [
          { label: '目标类型', value: '人脸 / 人体 / 机动车 / 非机动车' },
          { label: '同时抓拍', value: '最大同时检测32张人脸' },
          { label: '人脸属性', value: '性别、年龄、眼镜、口罩、帽子等' },
          { label: '车辆属性', value: '车牌、车型、颜色、品牌识别' },
        ],
      },
      {
        group: '图像性能',
        items: [
          { label: '传感器', value: '1/1.8" Progressive Scan CMOS' },
          { label: '最大分辨率', value: '2688 × 1520（400万）@ 25fps' },
          { label: '镜头', value: '2.8–12mm 电动变焦，F1.2' },
          { label: '最低照度', value: '彩色 0.0005Lux @ F1.2' },
        ],
      },
      {
        group: '接口与环境',
        items: [
          { label: '网络接口', value: '1 × RJ45 10M/100M/1000M' },
          { label: '报警接口', value: '2入2出，音频1入1出' },
          { label: '供电', value: 'DC 12V / PoE（802.3af）' },
          { label: '防护等级', value: 'IP67，工作温度 -30℃ ～ +60℃' },
        ],
      },
    ],
    price: { min: 4500, max: 6200, unit: '元/台' },
    scenarios: ['平安城市人脸卡口', '雪亮工程重点场所布控', '智慧社区人车管理'],
    img: imgSet(
      'Hikvision AI-powered bullet security camera with large motorized zoom lens, premium white aluminum housing with black front face plate, dual illuminator array, professional smart surveillance device',
      'extreme close-up of motorized zoom lens and dual illuminator LED array on camera face',
    ),
  },
  {
    name: '海康威视 DS-8664N-I8 64路8盘位网络硬盘录像机',
    slug: 'hikvision-8664n-i8',
    category: CAT_HIK,
    description:
      '64路高接入能力NVR，256Mbps接入带宽与8盘位大容量存储，支持4K超高清输出与RAID数据保护，内置智能分析算法，是中大型园区与楼宇监控系统的可靠存储中枢。',
    features: [
      { title: '64路大容量', detail: '支持64路IPC接入，256Mbps接入带宽' },
      { title: '8盘位存储', detail: '单盘支持10TB，整机最大80TB，支持RAID 0/1/5/10' },
      { title: '4K双输出', detail: '双HDMI异源输出，支持4K超高清解码上墙' },
      { title: '智能检索', detail: '支持人车目标快速检索，录像回放效率提升10倍' },
    ],
    specs: [
      {
        group: '接入性能',
        items: [
          { label: '视频接入', value: '64 路，最大支持1200万像素IPC' },
          { label: '接入带宽', value: '256 Mbps 接入 / 256 Mbps 转发' },
          { label: '解码能力', value: '2 × 12MP / 4 × 4K / 16 × 1080P' },
          { label: '智能分析', value: '支持周界防范、人脸比对报警联动' },
        ],
      },
      {
        group: '存储与接口',
        items: [
          { label: '硬盘盘位', value: '8 × SATA，单盘最大10TB' },
          { label: 'RAID支持', value: 'RAID 0 / 1 / 5 / 6 / 10' },
          { label: '视频输出', value: '2 × HDMI（4K）、1 × VGA' },
          { label: '网络接口', value: '2 × 千兆RJ45' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '外形尺寸（宽×深×高）', value: '445 × 470 × 90 mm（2U）' },
          { label: '整机功耗', value: '≤ 40W（不含硬盘）' },
          { label: '工作温度', value: '-10℃ ～ +55℃' },
        ],
      },
    ],
    price: { min: 4200, max: 5800, unit: '元/台', note: '含税市场参考价（不含硬盘），实际以正式报价为准' },
    scenarios: ['中大型园区集中存储', '写字楼宇监控中心', '连锁门店视频汇聚'],
    img: imgSet(
      'Hikvision 2U rackmount network video recorder NVR, black metal chassis with 8 front hard drive bays, LCD status display and control buttons, professional surveillance storage equipment',
      'extreme close-up of NVR hot-swap hard drive bays with status LEDs and LCD panel',
    ),
  },
  {
    name: '海康威视 iSecure Center 综合安防管理平台',
    slug: 'hikvision-isecure-center',
    category: CAT_HIK,
    description:
      '面向中大型企业的综合安防一体化管理平台，统一接入视频、门禁、报警、访客、停车、考勤等子系统，以"一图一库一平台"实现安防业务融合与智能化运营。',
    features: [
      { title: '多系统融合', detail: '视频/门禁/报警/停车/访客/考勤统一平台管理' },
      { title: '可视化运营', detail: 'AR实景地图与电子地图联动，警情直观呈现' },
      { title: '弹性扩容', detail: '支持从百路级到万路级平滑扩展，集群高可用' },
      { title: '开放集成', detail: '提供标准API与SDK，可与第三方系统无缝对接' },
    ],
    specs: [
      {
        group: '平台能力',
        items: [
          { label: '视频接入规模', value: '单域支持 10000 路（集群可扩展）' },
          { label: '门禁接入', value: '支持 2000 门点管理' },
          { label: '并发能力', value: '支持 512 用户并发访问' },
          { label: '部署形态', value: '软硬一体机 / 纯软件部署' },
        ],
      },
      {
        group: '核心模块',
        items: [
          { label: '视频监控', value: '实时预览、录像回放、智能分析、电视墙' },
          { label: '一卡通', value: '门禁、考勤、消费、访客、梯控' },
          { label: '停车场', value: '车牌识别、余位引导、无人值守缴费' },
          { label: '报警管理', value: '入侵报警、紧急求助、报警联动预案' },
        ],
      },
      {
        group: '运行环境',
        items: [
          { label: '服务器要求', value: '至强8核 / 32GB内存 / RAID存储（按规模配置）' },
          { label: '操作系统', value: 'openEuler / CentOS / Windows Server' },
          { label: '客户端', value: 'B/S + C/S + 移动App' },
        ],
      },
    ],
    price: { min: 80000, max: 300000, unit: '元/套', note: '含税市场参考价（按接入路数与模块授权浮动），实际以项目方案报价为准' },
    scenarios: ['智慧园区一体化安防', '三甲医院安防综合管理', '大型制造基地安防平台'],
    img: imgSet(
      'modern security operations center with large video wall displaying multiple camera feeds and analytics dashboards, blue ambient lighting, professional monitoring workstations, hi-tech control room',
      'close-up of monitoring workstation screen showing security management dashboard with camera grid and maps',
    ),
  },

  // ============================================================
  // 五、科大讯飞智能产品系列（4 款）
  // ============================================================
  {
    name: '科大讯飞智能办公本 X3',
    slug: 'iflytek-office-note-x3',
    category: CAT_IFLYTEK,
    description:
      '10.65英寸E Ink墨水屏智能办公本，搭载八麦克风阵列与讯飞星火大模型，实现会议实时转写、手写智能识别与文档智能处理，是商务人士会议纪要与移动办公的AI助手。',
    features: [
      { title: 'AI会议转写', detail: '八麦阵列精准拾音，会议语音实时转文字，准确率98%' },
      { title: '星火大模型', detail: '会议纪要自动生成、待办提取、文档智能问答' },
      { title: '纸感书写', detail: 'E Ink墨水屏+Wacom电磁笔，还原真实纸笔书写体验' },
      { title: '轻薄长续航', detail: '5.4mm厚度、415g重量，一次充电使用数周' },
    ],
    specs: [
      {
        group: '核心配置',
        items: [
          { label: '屏幕', value: '10.65 英寸 E Ink 墨水屏，300PPI' },
          { label: '处理器', value: '八核 2.0GHz' },
          { label: '存储', value: '4GB RAM + 64GB ROM' },
          { label: '麦克风', value: '八麦克风阵列（4+4）' },
        ],
      },
      {
        group: 'AI能力',
        items: [
          { label: '语音转写', value: '支持12种方言、7种外语实时转写' },
          { label: '手写识别', value: 'OCR手写体识别，支持中英混写' },
          { label: '大模型', value: '讯飞星火大模型 V4.0' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '外形尺寸（宽×长×厚）', value: '193.7 × 249 × 5.4 mm' },
          { label: '整机重量', value: '约 415 g' },
          { label: '电池', value: '4600mAh，支持数周续航' },
          { label: '接口', value: 'USB-C' },
        ],
      },
    ],
    price: { min: 4999, max: 5499, unit: '元/台' },
    scenarios: ['商务会议纪要记录', '政企高管移动办公', '访谈与培训内容整理'],
    img: imgSet(
      'iFLYTEK smart office E-ink tablet with stylus pen, 10 inch large e-paper display showing handwritten notes, ultra-thin dark gray body with leather cover, premium business device',
      'extreme close-up of E-ink screen with electromagnetic stylus writing Chinese calligraphy',
    ),
  },
  {
    name: '科大讯飞AI学习机 T20 Pro',
    slug: 'iflytek-study-t20-pro',
    category: CAT_IFLYTEK,
    description:
      '面向中小学生的AI个性化学习机，13.3英寸2.5K类纸护眼屏，搭载讯飞星火大模型实现AI 1对1答疑辅导、作文批改与学情诊断，覆盖小初高全学科同步学习资源。',
    features: [
      { title: 'AI 1对1辅导', detail: '星火大模型加持，难题逐步引导式讲解而非直接给答案' },
      { title: '精准学情诊断', detail: '少量测试题即可定位知识薄弱点，生成专属学习路径' },
      { title: '作文智能批改', detail: '中英文作文逐句批改，从立意到文采多维度评分' },
      { title: '类纸护眼屏', detail: '13.3英寸2.5K类纸屏，莱茵多项护眼认证' },
    ],
    specs: [
      {
        group: '核心配置',
        items: [
          { label: '屏幕', value: '13.3 英寸 2.5K 类纸护眼屏，90Hz' },
          { label: '处理器', value: '八核 AI 处理器' },
          { label: '存储', value: '8GB RAM + 256GB ROM' },
          { label: '摄像头', value: '前置1600万智慧眼 + 后置1300万' },
        ],
      },
      {
        group: '学习资源',
        items: [
          { label: '覆盖学段', value: '小学 / 初中 / 高中 全学科' },
          { label: '同步资源', value: '主流教材版本同步课程与题库' },
          { label: 'AI功能', value: '1对1答疑、作文批改、口语评测、学情报告' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '电池', value: '10150mAh' },
          { label: '整机重量', value: '约 690 g' },
          { label: '护眼认证', value: '莱茵低蓝光 / 无频闪 / 类纸显示认证' },
          { label: '管控', value: '绿色上网与应用时长家长管控' },
        ],
      },
    ],
    price: { min: 7999, max: 8999, unit: '元/台' },
    scenarios: ['中小学生课后自主学习', '家庭辅导与作业批改', '假期查漏补缺提升'],
    img: imgSet(
      'iFLYTEK AI learning tablet for students, 13 inch large screen with stylus, showing colorful educational interface with math exercises, white and blue friendly design, home study desk scene',
      'extreme close-up of tablet screen showing AI tutoring interface with handwritten math solution',
    ),
  },
  {
    name: '科大讯飞双屏翻译机',
    slug: 'iflytek-dual-screen-translator',
    category: CAT_IFLYTEK,
    description:
      '创新双屏设计的旗舰翻译机，主客双屏面对面交流更高效，支持85种语言在线翻译与16种语言离线翻译，覆盖商务洽谈、出入境服务、涉外接待等跨语言沟通场景。',
    features: [
      { title: '双屏交互', detail: '主客双屏实时显示双方文字，面对面交流自然高效' },
      { title: '85种语言', detail: '覆盖全球200多个国家和地区，含小语种在线翻译' },
      { title: '离线可用', detail: '16种语言离线翻译包，无网络环境照常沟通' },
      { title: '行业术语', detail: '支持外贸、医疗、法律等16大行业专业术语翻译' },
    ],
    specs: [
      {
        group: '核心配置',
        items: [
          { label: '主屏', value: '5.05 英寸触控屏' },
          { label: '客屏', value: '2.4 英寸显示客屏' },
          { label: '存储', value: '2GB RAM + 32GB ROM' },
          { label: '麦克风', value: '4麦克风阵列，支持降噪' },
        ],
      },
      {
        group: '翻译能力',
        items: [
          { label: '在线翻译', value: '85 种语言（覆盖200+国家和地区）' },
          { label: '离线翻译', value: '16 种语言' },
          { label: '拍照翻译', value: '支持32种语言拍照识别翻译' },
          { label: '会话模式', value: '双屏会话、演讲翻译、同声字幕' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '电池', value: '2380mAh，待机时间长达10天' },
          { label: '网络', value: '4G全网通 / Wi-Fi / 蓝牙' },
          { label: '接口', value: 'USB-C' },
        ],
      },
    ],
    price: { min: 3999, max: 4499, unit: '元/台' },
    scenarios: ['外贸商务洽谈', '出入境窗口服务', '涉外会议与陪同翻译'],
    img: imgSet(
      'iFLYTEK dual-screen smart translator device, sleek handheld device with two displays showing bilingual conversation, premium black body with gold accents, professional translation equipment',
      'extreme close-up of translator dual screens displaying Chinese and English conversation text',
    ),
  },
  {
    name: '科大讯飞智慧课堂教学系统',
    slug: 'iflytek-smart-classroom',
    category: CAT_IFLYTEK,
    description:
      '软硬件一体化的智慧课堂解决方案，融合AI互动教学、课堂实时评测与学情大数据分析，支持教师备授课、师生互动、精准讲评全流程数字化，助力课堂教学提质增效。',
    features: [
      { title: 'AI互动课堂', detail: '全班答题实时统计，知识点掌握度即时可视' },
      { title: '智能备授课', detail: '百万级资源库智能推荐，课件一键生成与美化' },
      { title: '学情大数据', detail: '汇聚课堂与作业数据，生成班级与个人学情画像' },
      { title: '语音评测', detail: '中英文口语跟读评测，发音问题精准定位' },
    ],
    specs: [
      {
        group: '系统组成',
        items: [
          { label: '教师端', value: '智慧课堂教学软件 + 智能授课终端' },
          { label: '学生端', value: '学生平板 / 答题器（按方案配置）' },
          { label: '云平台', value: '教学资源云 + 学情分析云' },
          { label: '显示设备', value: '适配86英寸交互智能平板（可选希沃/鸿合）' },
        ],
      },
      {
        group: '核心功能',
        items: [
          { label: '互动形式', value: '抢答、随机选人、分组PK、投票、弹幕' },
          { label: '评测题型', value: '选择/判断/填空/主观题拍照上传' },
          { label: '学情报告', value: '课前预习、课中互动、课后作业全链路分析' },
        ],
      },
      {
        group: '部署要求',
        items: [
          { label: '网络环境', value: '教室无线AP全覆盖（Wi-Fi 5以上）' },
          { label: '部署方式', value: '公有云 SaaS / 区域私有化部署可选' },
          { label: '适配学段', value: '小学 / 初中 / 高中' },
        ],
      },
    ],
    price: { min: 150000, max: 400000, unit: '元/间', note: '含税市场参考价（按终端数量与部署方式浮动），实际以项目方案报价为准' },
    scenarios: ['中小学常态化智慧课堂', '区县教育资源均衡化', '精准教学改革试点校'],
    img: imgSet(
      'smart classroom scene with teacher using large interactive display and students with tablets raising hands, modern bright classroom with educational technology, warm lighting',
      'close-up of teacher hand operating interactive teaching software on large classroom touchscreen',
    ),
  },

  // ============================================================
  // 六、希沃教育信息化产品系列（5 款）
  // ============================================================
  {
    name: '希沃交互智能平板 F系列 86英寸（FG86EC）',
    slug: 'seewo-fg86ec',
    category: CAT_SEEWO,
    description:
      '86英寸4K交互智能平板，40点红外触控搭配3.2mm防眩光钢化玻璃，内置Android与可选Windows双系统，千万级教育资源预装，是中小学智慧教室的核心显示交互终端。',
    features: [
      { title: '4K高清大屏', detail: '86英寸3840×2160分辨率，178°广视角，后排清晰可见' },
      { title: '40点触控', detail: '红外40点触控，±1mm书写精度，多人同时书写不冲突' },
      { title: '双重护眼', detail: '防眩光钢化玻璃+硬件低蓝光，守护师生视力健康' },
      { title: '教学资源', detail: '预装希沃白板5，千万级课件资源即取即用' },
    ],
    specs: [
      {
        group: '显示规格',
        items: [
          { label: '屏幕尺寸', value: '86 英寸，16:9' },
          { label: '分辨率', value: '3840 × 2160（4K UHD）' },
          { label: '触控', value: '红外40点触控，书写精度 ±1mm' },
          { label: '玻璃', value: '3.2mm 防眩光钢化玻璃，莫氏7级硬度' },
        ],
      },
      {
        group: '核心配置',
        items: [
          { label: '安卓系统', value: 'Android 13，8核CPU，4GB+32GB' },
          { label: 'OPS电脑', value: '可选插拔式Windows模块（i5/i7）' },
          { label: '音响', value: '2.1声道，2 × 15W + 20W低音' },
          { label: '无线', value: 'Wi-Fi 6 + 蓝牙5.2，支持无线投屏' },
        ],
      },
      {
        group: '接口与规格',
        items: [
          { label: '前置接口', value: 'USB-C × 1、USB 3.0 × 2、HDMI × 1、触控USB' },
          { label: '后置接口', value: 'HDMI × 2、USB × 2、RJ45、RS232' },
          { label: '外形尺寸（宽×高×厚）', value: '1957 × 1160 × 87 mm' },
          { label: '整机功耗', value: '≤ 400W，待机 ≤ 0.5W' },
        ],
      },
    ],
    price: { min: 18500, max: 26000, unit: '元/台', note: '含税市场参考价（不含OPS模块），实际以正式报价为准' },
    scenarios: ['中小学智慧教室', '高校阶梯教室与研讨室', '培训机构互动课堂'],
    img: imgSet(
      'Seewo 86 inch interactive flat panel display for classroom, large 4K touchscreen on wall mount showing colorful educational interface, slim black bezel with front speaker bar, modern classroom equipment',
      'extreme close-up of interactive display with fingers touching screen showing teaching software toolbar',
    ),
  },
  {
    name: '希沃云班牌 SK06',
    slug: 'seewo-sk06',
    category: CAT_SEEWO,
    description:
      '21.5英寸智慧云班牌，支持人脸识别考勤与走班排课显示，集班级文化展示、课程信息、通知公告、家校互动于一体，是新高考走班制与智慧校园建设的标准配置。',
    features: [
      { title: '人脸考勤', detail: '200ms极速人脸识别，支持走班动态考勤统计' },
      { title: '走班排课', detail: '对接教务系统，课程表与考场信息自动更新' },
      { title: '班级文化', detail: '班级风采、荣誉榜、值日表轮播展示' },
      { title: '家校互通', detail: '家长留言与通知公告直达班牌，沟通零距离' },
    ],
    specs: [
      {
        group: '显示规格',
        items: [
          { label: '屏幕尺寸', value: '21.5 英寸，1920 × 1080' },
          { label: '触控', value: '10点电容触控' },
          { label: '摄像头', value: '200万宽动态，支持人脸识别' },
          { label: '亮度', value: '300nit，自动亮度调节' },
        ],
      },
      {
        group: '核心配置',
        items: [
          { label: '处理器', value: '四核 Cortex-A55' },
          { label: '存储', value: '2GB RAM + 16GB ROM' },
          { label: '系统', value: 'Android 11' },
          { label: '读卡器', value: '支持IC/ID卡刷卡考勤' },
        ],
      },
      {
        group: '安装与供电',
        items: [
          { label: '安装方式', value: '壁挂式（预留86盒安装位）' },
          { label: '网络', value: 'RJ45有线 / Wi-Fi' },
          { label: '供电', value: 'DC 12V / PoE' },
          { label: '工作温度', value: '0℃ ～ +40℃' },
        ],
      },
    ],
    price: { min: 2800, max: 3600, unit: '元/台' },
    scenarios: ['中小学走班考勤管理', '班级文化与信息展示', '考场编排信息发布'],
    img: imgSet(
      'Seewo smart class board digital signage, 21 inch wall-mounted touchscreen beside classroom door showing class schedule and photos, white bezel with front camera, modern school corridor scene',
      'extreme close-up of class board screen showing attendance interface with student face recognition',
    ),
  },
  {
    name: '希沃常态化录播主机（RV系列）',
    slug: 'seewo-rv-recording-host',
    category: CAT_SEEWO,
    description:
      '面向常态化教学录播的一体化主机，支持4路1080P高清信号接入与AI智能导播切换，自动跟踪教师与学生画面，搭配拾音阵列实现无感录制，让每间教室轻松拥有录播能力。',
    features: [
      { title: 'AI智能导播', detail: '自动跟踪师生画面智能切换，无需专人值守' },
      { title: '4路高清', detail: '支持教师全景/特写、学生全景/特写4路信号' },
      { title: '无感录制', detail: '上课自动开启录制，课程结束自动归档上传' },
      { title: '资源平台对接', detail: '无缝对接区域教育资源平台，一键直播点播' },
    ],
    specs: [
      {
        group: '录播能力',
        items: [
          { label: '视频输入', value: '4 × 1080P（SDI/网络流混合接入）' },
          { label: '录制格式', value: 'MP4，H.264/H.265编码' },
          { label: '导播模式', value: 'AI自动导播 / 手动导播 / 半自动' },
          { label: '跟踪方式', value: '图像分析自动跟踪（免穿戴）' },
        ],
      },
      {
        group: '音频与存储',
        items: [
          { label: '音频输入', value: '2 × 吊麦阵列接入，AI降噪拾音' },
          { label: '本地存储', value: '2TB（可扩展），支持NAS挂载' },
          { label: '直播协议', value: 'RTMP / RTSP，支持万人并发平台对接' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '形态', value: '1U机架式主机' },
          { label: '网络', value: '2 × 千兆RJ45' },
          { label: '功耗', value: '≤ 45W' },
          { label: '工作温度', value: '0℃ ～ +40℃' },
        ],
      },
    ],
    price: { min: 22000, max: 35000, unit: '元/套', note: '含税市场参考价（含主机+图像分析，摄像机与吊麦按方案配置），实际以正式报价为准' },
    scenarios: ['中小学常态化录播教室', '专递课堂与名师课堂', '教师教研与优课评选'],
    img: imgSet(
      'Seewo classroom recording system server, compact 1U rackmount device with display screen showing camera views, installed in classroom with ceiling cameras, modern educational recording equipment',
      'close-up of recording host screen showing multi-view teacher and student camera feeds',
    ),
  },
  {
    name: '希沃白板 5 互动教学软件',
    slug: 'seewo-whiteboard-5',
    category: CAT_SEEWO,
    description:
      '专为教学设计的一站式互动课件制作与授课软件，内置千万级教学资源与学科工具，支持云课件多端同步、课堂活动互动与AI备课，是教师日常备授课的国民级应用。',
    features: [
      { title: '海量资源', detail: '千万级课件、题库、微课资源，覆盖全学段全学科' },
      { title: '学科工具', detail: '数学画板、物理仿真实验、化学方程式等学科利器' },
      { title: '课堂活动', detail: '分组竞争、趣味分类等互动模板，课堂氛围拉满' },
      { title: 'AI备课', detail: '输入课题自动生成课件框架与教学活动建议' },
    ],
    specs: [
      {
        group: '软件功能',
        items: [
          { label: '备课模式', value: '课件编辑、学科工具、资源搜索、AI生成' },
          { label: '授课模式', value: '批注、板中板、计时器、课堂活动' },
          { label: '云同步', value: '云课件空间，学校/家庭多端同步' },
          { label: '移动授课', value: '手机扫码遥控翻页、拍照上传' },
        ],
      },
      {
        group: '资源与学科',
        items: [
          { label: '资源规模', value: '1000万+ 课件与试题资源' },
          { label: '学科工具', value: '语文/数学/英语/物理/化学/地理等' },
          { label: '题库', value: '覆盖主流教材版本的同步题库' },
        ],
      },
      {
        group: '运行环境',
        items: [
          { label: '支持平台', value: 'Windows / Android / iOS / macOS' },
          { label: '适配硬件', value: '希沃及主流品牌交互智能平板' },
          { label: '授权方式', value: '账号授权，个人版 / 校园版' },
        ],
      },
    ],
    price: { min: 299, max: 999, unit: '元/账号/年', note: '含税市场参考价（个人版），校园版按校区规模授权1万-5万元/年，实际以正式报价为准' },
    scenarios: ['中小学教师日常备课授课', '区域教育资源共建共享', '教师信息化能力培训'],
    img: imgSet(
      'teacher using Seewo whiteboard teaching software on large touchscreen, colorful interactive courseware with drag-and-drop activities on screen, bright modern classroom, educational software interface',
      'close-up of interactive courseware editing interface with subject tools and resource library panels',
    ),
  },
  {
    name: '希沃学习平板 XP21J',
    slug: 'seewo-xp21j',
    category: CAT_SEEWO,
    description:
      '专为学生课堂与课后学习设计的10.1英寸护眼平板，搭载希沃学教应用生态，支持课堂互动答题、电子作业、学情反馈与家长管控，纸感护眼屏守护学生视力。',
    features: [
      { title: '课堂互动', detail: '与希沃白板无缝联动，答题统计实时反馈' },
      { title: '纸感护眼', detail: '10.1英寸类纸屏，莱茵低蓝光与无频闪认证' },
      { title: '绿色管控', detail: '应用白名单+使用时长管控，防止沉迷游戏' },
      { title: '电子作业', detail: '作业在线提交批改，错题自动归集举一反三' },
    ],
    specs: [
      {
        group: '核心配置',
        items: [
          { label: '屏幕', value: '10.1 英寸 1920 × 1200 类纸护眼屏' },
          { label: '处理器', value: '八核 2.0GHz' },
          { label: '存储', value: '4GB RAM + 64GB ROM（支持TF卡扩展）' },
          { label: '摄像头', value: '前置500万 + 后置800万' },
        ],
      },
      {
        group: '学习功能',
        items: [
          { label: '课堂应用', value: '互动答题、屏幕广播、学生演示' },
          { label: '作业系统', value: '电子作业、自动批改、错题本' },
          { label: '管控能力', value: '应用白名单、时长管理、远程锁屏' },
        ],
      },
      {
        group: '物理规格',
        items: [
          { label: '电池', value: '7000mAh' },
          { label: '整机重量', value: '约 460 g' },
          { label: '网络', value: 'Wi-Fi 5 / 蓝牙5.0' },
          { label: '防护', value: '防摔硅胶保护套（标配）' },
        ],
      },
    ],
    price: { min: 1999, max: 2599, unit: '元/台' },
    scenarios: ['智慧课堂学生终端', '课后个性化作业辅导', '区域智慧教育试点'],
    img: imgSet(
      'Seewo student learning tablet, 10 inch tablet with colorful protective case showing homework app interface, stylus pen beside, bright and friendly educational device for students',
      'extreme close-up of tablet screen showing interactive homework quiz interface with stylus',
    ),
  },
];

// ============================================================
// 执行入口
// ============================================================
async function main() {
  console.log('🚀 开始导入产品目录（6 大分类 / 32 款）...');

  // 旧版演示产品置为 inactive，避免旧分类混入筛选器
  const legacy = await prisma.product.updateMany({
    where: {
      slug: {
        in: ['smart-vehicle-management', 'vehicle-network-security', 'smart-mobility-platform'],
      },
    },
    data: { status: 'inactive' },
  });
  if (legacy.count > 0) console.log(`  ✓ 旧版演示产品下线: ${legacy.count} 条`);

  let order = 0;
  for (const p of catalog) {
    order += 1;
    const data = {
      name: p.name,
      slug: p.slug,
      category: p.category,
      description: p.description,
      features: JSON.stringify(p.features),
      specs: JSON.stringify(p.specs),
      priceInfo: JSON.stringify(fmtPrice(p.price)),
      scenarios: JSON.stringify(p.scenarios),
      coverImage: p.img.cover,
      images: JSON.stringify(p.img.images),
      sortOrder: order,
      status: 'active',
    };
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: data,
      create: data,
    });
  }

  // 统计输出
  const groups: Record<string, number> = {};
  for (const p of catalog) groups[p.category] = (groups[p.category] ?? 0) + 1;
  console.log(`  ✓ 产品导入完成: ${catalog.length} 条`);
  for (const [cat, count] of Object.entries(groups)) {
    console.log(`    - ${cat}: ${count} 款`);
  }
}

main()
  .catch((e) => {
    console.error('❌ 产品目录导入失败:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
