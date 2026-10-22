/**
 * 前沿内容种子脚本（幂等，可重复执行）
 * 为新闻/产品/方案/职位/留言/投递六个栏目各注入 10 条 2026 前沿主题内容
 * 主题围绕公司主业：智能交通、车联网安全、智慧停车、信控 AI，延伸至
 * 车路云一体化、低空经济、交通大模型、数据要素等 2026 年行业热点
 *
 * 执行：cd backend && npx tsx prisma/seed_frontier_content.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 固定时间锚点（2026-08 内分散，保证"最新"排序稳定且有时效感）
const T = (day: number, hour = 9) => new Date(2026, 7, day, hour, 30);

async function seedNews() {
  const items = [
    {
      title: '五部门启动第二批车路云一体化应用试点城市申报，规模化部署进入加速期',
      slug: 'v2x-pilot-cities-second-batch-2026',
      summary: '工信部、公安部、住建部等五部门联合启动第二批车路云一体化应用试点城市申报，明确要求路侧设施覆盖率与云控平台互联互通，行业从示范验证迈向规模化部署。',
      content: '工业和信息化部、公安部、自然资源部、住房城乡建设部、交通运输部五部门近期联合发文，启动第二批车路云一体化应用试点城市申报工作。\n\n与首批试点相比，本轮申报更强调三项硬指标：一是重点城区路侧感知与通信设施覆盖率不低于 60%；二是云控基础平台须实现跨品牌车辆与多厂家路侧设备的互联互通；三是要求形成可持续的商业运营闭环。\n\n业内普遍认为，这标志着车路云一体化从"示范验证期"正式进入"规模化部署期"。据中国智能网联汽车产业创新联盟测算，2026—2030 年车路云相关路侧与云控市场规模合计将超过 4000 亿元。\n\n新蓝恒成 XL-V2X 车路云协同平台已支持多厂家 RSU/OBU 协议适配与云控平台标准化对接，可为申报城市提供整体技术支撑。',
      category: '行业资讯',
      tags: '车路云一体化,V2X,智能网联,政策解读',
      publishedAt: T(28),
    },
    {
      title: 'L3 级自动驾驶准入试点扩围，车企与路侧协同安全要求同步升级',
      slug: 'l3-autonomous-driving-pilot-expansion-2026',
      summary: '多部委推进 L3 级自动驾驶准入与上路通行试点扩围，同步明确车路协同环境下的安全冗余要求，路侧感知与云控监管成为准入评估重要一环。',
      content: '近期，L3 级有条件自动驾驶车辆准入与上路通行试点进一步扩大范围，多个省市公布新增试点路段。\n\n值得关注的是，本轮试点评估细则中首次将"车路协同安全冗余"纳入加分项：在路侧感知覆盖路段，车辆可将路侧感知结果作为本车感知系统的冗余校验来源，从而降低单车智能的感知长尾风险。\n\n与之配套，公安交管部门同步强化了对自动驾驶车辆的运行监管要求，包括实时位置上报、最小风险策略（MRM）触发记录留存、事故数据黑匣子（EDR/DSSAD）数据调取接口等。\n\n这意味着"单车智能 + 车路协同 + 云控监管"三位一体的技术路线正在获得监管层面的正式认可，路侧与云控侧的安全合规能力将成为产业链竞争的新焦点。',
      category: '行业资讯',
      tags: '自动驾驶,L3,车路协同,安全监管',
      publishedAt: T(26),
    },
    {
      title: '交通大模型进入工程化落地期：从"对话问答"走向"信控决策闭环"',
      slug: 'traffic-llm-engineering-deployment-2026',
      summary: '2026 年交通行业大模型从概念验证转向工程化落地，头部城市已实现大模型参与信号配时方案生成与效果评估的决策闭环，平均路口延误进一步下降。',
      content: '经过 2024—2025 年的概念验证期，交通行业大模型在 2026 年明显进入工程化落地阶段。\n\n从各地公开的建设情况看，交通大模型的价值重心正从早期的"知识问答、报告生成"等辅助场景，转向"信号配时方案生成、交通事件处置建议、施工组织评估"等决策支持场景。部分先行城市已实现"大模型生成配时方案—仿真平台预评估—小范围灰度下发—效果回流再训练"的完整闭环。\n\n工程化落地的关键不在模型本身，而在三点：高质量交通语料与时空数据供给、与仿真/信控系统的标准化接口、以及面向交管业务的安全护栏机制。\n\n新蓝恒成 XL-TrafficGPT 交通大模型已与 XL-Traffic-Agent 信控智能体引擎打通，支持配时方案的自然语言交互式调优，欢迎业内伙伴交流。',
      category: '行业资讯',
      tags: '交通大模型,AI,信号控制,决策闭环',
      publishedAt: T(24),
    },
    {
      title: '低空经济元年之后：城市级无人机交通管理（UTM）平台建设集中启动',
      slug: 'low-altitude-utm-platform-construction-2026',
      summary: '低空经济进入基础设施建设年，多个城市集中启动城市级无人机交通管理平台招标，空域数字化、动态容量管理与有人/无人融合运行成为核心能力要求。',
      content: '自低空经济写入政府工作报告以来，2026 年被业内视为低空基础设施建设的关键年份。上半年，深圳、合肥、杭州、成都等多个城市陆续启动城市级无人机交通管理（UTM）平台或低空智联网平台的招标建设。\n\n从招标文件看，本轮平台建设的共性需求集中在四个方面：一是低空空域的数字化建模与网格化管理；二是无人机飞行计划的申报审批与动态冲突解脱；三是政务巡检、物流配送、应急医疗等多场景的统一调度；四是对"黑飞"目标的探测、识别与处置联动。\n\n低空交通管理与传统民航空管的核心差异在于"高密度、高频次、强动态"，这与城市地面交通信号管控在方法论上高度相通。新蓝恒成正将十余年城市路网管控经验迁移至低空场景，相关平台产品已进入试点部署阶段。',
      category: '行业资讯',
      tags: '低空经济,UTM,无人机,空域管理',
      publishedAt: T(21),
    },
    {
      title: '新蓝恒成发布 XL-Traffic-Agent 3.0：信控智能体全面接入交通大模型',
      slug: 'xl-traffic-agent-v3-llm-release',
      summary: 'XL-Traffic-Agent 3.0 正式发布，信控智能体引擎与交通大模型深度融合，支持自然语言配时调优、方案自动归因分析与多智能体协同寻优，已在多个城市试点路口完成灰度验证。',
      content: '新蓝恒成今日正式发布 XL-Traffic-Agent 信控智能体引擎 3.0 版本。\n\n本版本的核心升级是将多智能体强化学习引擎与 XL-TrafficGPT 交通大模型深度融合：大模型负责理解交管业务意图、生成候选配时策略并解释方案逻辑；强化学习智能体负责在仿真环境中对方案进行大规模并行寻优；二者通过标准化策略接口协同工作。\n\n在试点路口的灰度验证中，3.0 版本实现了三项能力提升：配时方案生成效率从小时级缩短到分钟级；方案可解释性显著增强，一线民警可直接阅读方案归因说明；高峰期平均路口延误在 2.0 版本基础上进一步下降 8%—12%。\n\n目前该版本已开放老用户升级通道，并提供 90 天试点路口免费灰度服务。',
      category: '公司动态',
      tags: '信控智能体,交通大模型,产品发布,AI',
      publishedAt: T(19),
    },
    {
      title: 'XL-Parking-OS 完成第 20 城落地，城市级停车"一张网"接入泊位突破 80 万',
      slug: 'xl-parking-os-20-cities-800k-berths',
      summary: 'XL-Parking-OS 智慧停车云脑完成第 20 个城市级项目交付，累计接入泊位突破 80 万个，路内泊位周转率平均提升 41%，"全市一个停车场"运营模式获多地认可。',
      content: '近日，随着西南某省会城市项目通过验收，XL-Parking-OS 智慧停车云脑累计完成 20 个城市级项目交付，接入泊位总数突破 80 万个。\n\n从运营数据看，接入"一张网"管理的城市普遍实现了三项改善：路内泊位平均周转率提升 41%，重点区域"巡位绕行"交通量下降约 15%，停车欠费追缴率提升至 92% 以上。\n\n2026 年上半年交付的项目中，"充停一体化"成为新亮点：平台统一纳管路内泊位、公共停车场与充电车位，新能源车主可在同一入口完成"找位—停车—充电—缴费"全流程，充电桩利用率平均提升 35%。\n\n下半年，公司将持续推进县域城市停车一体化市场，让中小城市也能以轻量化成本用上城市级停车云脑。',
      category: '公司动态',
      tags: '智慧停车,城市一张网,充停一体化,项目交付',
      publishedAt: T(17),
    },
    {
      title: '数据要素×交通运输：首批交通数据资产入表与场内交易案例落地',
      slug: 'data-element-transportation-asset-trading-2026',
      summary: '随着"数据要素×"三年行动深入推进，多地交通投资集团与停车运营企业完成交通数据资产入表，停车热力、路况车速等数据产品在场内交易所挂牌成交。',
      content: '财政部《企业数据资源相关会计处理暂行规定》全面实施以来，2026 年上半年交通运输领域集中出现了一批数据资产入表与交易案例。\n\n从公开信息看，多个城市的交通投资集团已将"路内停车泊位周转数据""公交客流 OD 数据""路网车速数据"等完成合规评估后入表，部分数据产品已在数据交易所挂牌成交，买方涵盖导航地图厂商、商业选址机构、保险精算公司与科研院所。\n\n交通数据要素化的难点在于三点：数据确权与合规授权链条长、个人隐私与公共安全边界敏感、时空数据质量治理成本高。这要求平台侧具备从采集、治理、脱敏到产品化封装的全链路能力。\n\n新蓝恒成 XL-DataHub 交通数据要素治理平台已支持数据资产目录、质量评估、脱敏分级与产品封装全流程管理，并在两个停车运营集团完成落地。',
      category: '行业资讯',
      tags: '数据要素,数据资产,交通运输,数据交易',
      publishedAt: T(14),
    },
    {
      title: '新蓝恒成通过 CMMI 5 级与 DSMM 三级双认证，研发与数据安全能力获权威认可',
      slug: 'xinlan-cmmi5-dsmm3-certified-2026',
      summary: '新蓝恒成近期先后通过 CMMI 5 级（软件能力成熟度最高级）与 DSMM 数据安全能力成熟度三级认证，标志公司在软件研发过程与数据全生命周期安全管理两方面达到行业先进水平。',
      content: '近日，新蓝恒成先后通过 CMMI 5 级评估与 DSMM（数据安全能力成熟度模型）三级认证。\n\nCMMI 5 级是软件能力成熟度的最高等级，要求组织具备基于量化数据的过程优化与缺陷预防能力。评估组对公司研发过程的量化管理、根因分析与持续改进机制给予了高度评价。\n\nDSMM 三级认证则围绕数据采集、传输、存储、处理、交换、销毁全生命周期展开，重点审查了公司在智慧停车、信控平台等业务中涉及的车辆轨迹、支付信息等敏感数据的保护能力。\n\n双认证的取得，为公司承接城市级交通数据平台、车路云一体化等对研发质量与数据安全均有高门槛要求的项目提供了资质保障。',
      category: '公司动态',
      tags: '资质认证,CMMI,DSMM,数据安全',
      publishedAt: T(12),
    },
    {
      title: '5G-A 通感一体规模商用：车联网感知补盲迎来低时延新基建',
      slug: '5ga-integrated-sensing-v2x-2026',
      summary: '5G-A 通感一体基站在多个城市车联网示范区规模部署，通信与雷达感知一体化能力为低能见度、遮挡场景下的车辆感知补盲提供了新型基础设施。',
      content: '随着 5G-Advanced（5G-A）进入规模商用阶段，"通感一体"（ISAC）成为车联网基础设施建设的重要技术路线。\n\n通感一体基站在提供通信能力的同时，复用通信信号实现类雷达的目标探测能力，可在不额外部署专用传感器的前提下，对覆盖区域内的车辆、行人、非机动车进行连续感知。在雨雾低能见度、交叉路口遮挡等传统视觉感知薄弱场景中，该技术可作为路侧感知体系的有效补盲手段。\n\n目前多个车联网先导区已启动通感一体基站的规模部署，并与既有 RSU、雷视一体机等设施协同组网。测试数据显示，在典型十字遮挡场景中，融合通感一体数据后可将弱势交通参与者漏检率降低 60% 以上。\n\n新蓝恒成路侧感知融合平台已预留通感一体数据接入接口，支持与现有感知体系的即插即用式融合。',
      category: '行业资讯',
      tags: '5G-A,通感一体,车联网,感知补盲',
      publishedAt: T(10),
    },
    {
      title: '新蓝恒成与湖南高校共建"交通大模型与车路协同"联合实验室',
      slug: 'xinlan-university-joint-lab-traffic-llm',
      summary: '新蓝恒成与省内重点高校签约共建"交通大模型与车路协同联合实验室"，围绕多智能体信控、车路云安全、低空交通管控三大方向开展产学研协同攻关。',
      content: '为强化前沿技术储备，新蓝恒成近日与省内重点高校签署协议，共建"交通大模型与车路协同联合实验室"。\n\n联合实验室首期确立三大研究方向：一是基于多智能体强化学习与交通大模型融合的路网级信控协同优化；二是车路云一体化环境下的身份认证、入侵检测与隐私计算；三是面向低空经济的无人机交通管理关键技术。\n\n根据协议，高校团队负责基础算法研究与高水平论文产出，新蓝恒成提供真实业务场景、脱敏交通数据与工程化验证环境，并设立专项奖学金支持研究生参与课题。实验室实行双主任制，研究成果的知识产权由双方共享。\n\n首批 6 名联合培养研究生已于本月入驻公司 AI 实验室，首个联合课题"基于大模型的信控方案归因分析"已完成开题。',
      category: '公司动态',
      tags: '产学研,联合实验室,交通大模型,车路协同',
      publishedAt: T(7),
    },
  ];

  let created = 0;
  for (const it of items) {
    const exists = await prisma.news.findUnique({ where: { slug: it.slug } });
    if (exists) continue;
    await prisma.news.create({
      data: {
        ...it,
        coverImage: created % 2 === 0 ? '/images/car_mockup_deep_blue.png' : '/images/logo_shield.png',
        status: 'published',
        viewCount: 80 + Math.floor(Math.random() * 400),
      },
    });
    created++;
  }
  return { total: items.length, created };
}

async function seedProducts() {
  const F = (arr: { title: string; detail: string }[]) => JSON.stringify(arr);
  const items = [
    {
      name: 'XL-V2X-Cloud 车路云一体化协同平台',
      slug: 'xl-v2x-cloud',
      category: '车路协同',
      description: '面向车路云一体化试点城市建设的云控基础平台，打通"路侧感知—边缘计算—云端协同—车端服务"全链路，支持多厂家 RSU/OBU 协议适配与跨品牌车辆接入，满足试点城市互联互通验收要求。',
      features: F([
        { title: '多协议适配', detail: '内置主流 RSU/OBU 厂家协议库，支持国标 T/CSAE 系列消息集，新厂家接入周期 ≤2 周' },
        { title: '云控三级架构', detail: '边缘云—区域云—中心云三级协同，支持百万级终端接入与毫秒级协同决策下发' },
        { title: '标准化互认', detail: '通过行业云控平台互联互通测试，满足试点城市跨区互认要求' },
      ]),
      sortOrder: 10,
    },
    {
      name: 'XL-TrafficGPT 交通大模型',
      slug: 'xl-trafficgpt',
      category: '交通大模型',
      description: '基于交通领域语料与时空数据微调的垂直行业大模型，与信控智能体引擎深度打通，支持自然语言配时调优、方案归因分析、警情处置建议生成，让大模型从"问答助手"走向"决策闭环"。',
      features: F([
        { title: '决策闭环', detail: '与 XL-Traffic-Agent 打通，配时方案"生成—仿真—灰度—回流"全流程闭环' },
        { title: '可解释输出', detail: '每条方案附归因说明与预期 KPI 变化，一线业务人员零门槛理解' },
        { title: '安全护栏', detail: '内置交通工程规则约束层，杜绝违反工程常识的方案输出' },
      ]),
      sortOrder: 11,
    },
    {
      name: 'XL-UTM 低空智联网监管平台',
      slug: 'xl-utm',
      category: '低空经济',
      description: '城市级无人机交通管理平台，提供空域数字化建模、飞行计划申报审批、动态冲突解脱、多场景统一调度与"黑飞"处置联动能力，将十余年地面路网管控方法论迁移至低空场景。',
      features: F([
        { title: '空域数字化', detail: '城市低空空域网格化建模，支持动态容量评估与航路航线规划' },
        { title: '融合运行调度', detail: '政务巡检、物流配送、应急医疗多场景统一计划申报与冲突解脱' },
        { title: '反制联动', detail: '对接无线电监测与光电设备，实现"黑飞"目标探测—识别—处置闭环' },
      ]),
      sortOrder: 12,
    },
    {
      name: 'XL-DataHub 交通数据要素治理平台',
      slug: 'xl-datahub',
      category: '数据要素',
      description: '面向交通数据资产化的全链路治理平台，覆盖数据资产目录、质量评估、合规脱敏、产品封装与场内交易对接，已在停车运营集团与交投集团完成数据资产入表落地。',
      features: F([
        { title: '资产目录', detail: '交通数据资源自动盘点与分级分类，形成可入表的数据资产目录' },
        { title: '合规脱敏', detail: '车辆轨迹、人脸车牌等敏感字段的场景化脱敏与可用性平衡' },
        { title: '产品封装', detail: 'API/报告/指数三类数据产品形态封装，直连数据交易所挂牌流程' },
      ]),
      sortOrder: 13,
    },
    {
      name: 'XL-EdgeCore 路侧边缘计算单元',
      slug: 'xl-edgecore',
      category: '智能硬件',
      description: '部署于路口/路段的边缘计算节点，集成雷视融合感知、本地信控决策与 V2X 消息转发能力，支持 5G-A 通感一体数据接入，断网场景下可自治运行保障路口不失控。',
      features: F([
        { title: '雷视融合', detail: '雷达+视频+通感一体多源融合，全天候目标检出率 ≥99%' },
        { title: '边缘自治', detail: '云端失联时自动切换本地智能配时，路口控制不中断' },
        { title: '国产化可选', detail: '提供国产化芯片与操作系统版本，满足信创项目要求' },
      ]),
      sortOrder: 14,
    },
    {
      name: 'XL-CyberShield 车联网纵深防御系统',
      slug: 'xl-cybershield',
      category: '信息安全',
      description: '覆盖"车—路—云—网"四层的车联网安全纵深防御体系，包含车载入侵检测、V2X 消息鉴权、云控平台态势感知与 PKI 证书管理，满足准入试点对车路协同安全冗余的监管要求。',
      features: F([
        { title: 'V2X 消息鉴权', detail: '基于国密算法的 V2X 消息签名验签，防止伪造路侧消息诱导车辆' },
        { title: '态势感知', detail: '车路云三侧安全日志汇聚分析，异常行为分钟级发现与溯源' },
        { title: 'PKI 管理', detail: '车端/路端证书全生命周期管理，支持亿级证书并发签发' },
      ]),
      sortOrder: 15,
    },
    {
      name: 'XL-DigitalTwin 数字孪生路网平台',
      slug: 'xl-digitaltwin',
      category: '数字孪生',
      description: '宏中微一体化交通数字孪生平台，支持城市级路网的实时在线仿真与信控方案预评估，为交通大模型提供方案验证环境，可在方案下发前预测 15—120 分钟路网演化。',
      features: F([
        { title: '在线仿真', detail: '实时数据驱动的在线仿真，方案预评估与真实路网误差 <10%' },
        { title: '宏中微一体', detail: '宏观 OD—中观走廊—微观路口三层模型联动，兼顾规模与精度' },
        { title: '预案沙盘', detail: '大型活动、恶劣天气、施工占道等场景的预案推演沙盘' },
      ]),
      sortOrder: 16,
    },
    {
      name: 'XL-MaaS 一体化出行服务平台',
      slug: 'xl-maas',
      category: '智慧出行',
      description: '整合公交、地铁、骑行、网约车、停车充电的一体化出行服务平台，支持多方式联程规划、一票制联程支付与碳普惠积分，助力城市绿色出行分担率提升。',
      features: F([
        { title: '联程规划', detail: '跨方式门到门联程规划，综合时间/费用/碳排放多目标优选' },
        { title: '联程支付', detail: '一次规划、一票支付，覆盖公共交通与市场化出行服务' },
        { title: '碳普惠', detail: '绿色出行行为量化核证，对接地方碳普惠平台积分兑换' },
      ]),
      sortOrder: 17,
    },
    {
      name: 'XL-ChargingPark 充停一体化运营系统',
      slug: 'xl-chargingpark',
      category: '智慧停车',
      description: '面向停车运营企业的充停一体化 SaaS，统一纳管路内泊位、公共场库与充电设施，支持"找位—停车—充电—缴费"一站式体验与油车占位智能管控，充电桩利用率平均提升 35%。',
      features: F([
        { title: '统一纳管', detail: '泊位与充电桩同一平台管理，状态实时互通' },
        { title: '占位管控', detail: '视频+地锁联动识别油车占位与满电超时，自动计费驱离' },
        { title: '收益分析', detail: '按场站/时段/用户群的充停收益多维分析与定价建议' },
      ]),
      sortOrder: 18,
    },
    {
      name: 'XL-RoboTaxi-Ops 自动驾驶运营监管平台',
      slug: 'xl-robotaxi-ops',
      category: '自动驾驶',
      description: '面向地方政府与运营企业的自动驾驶车队运营监管平台，提供车辆运行实时监控、MRM 事件回溯、远程接管审计与运营 KPI 分析，满足准入试点对运行数据留存与调取的监管要求。',
      features: F([
        { title: '运行监管', detail: '车辆位置/状态/自动驾驶模式实时监控，异常即时告警' },
        { title: '事件回溯', detail: '最小风险策略触发与事故场景的多源数据融合回溯' },
        { title: '合规审计', detail: '对接监管数据接口，自动生成试点要求的周期合规报告' },
      ]),
      sortOrder: 19,
    },
  ];

  let created = 0;
  for (const it of items) {
    const exists = await prisma.product.findUnique({ where: { slug: it.slug } });
    if (exists) continue;
    await prisma.product.create({
      data: {
        ...it,
        coverImage: created % 2 === 0 ? '/images/car_mockup_deep_blue.png' : '/images/car_mockup_iron_grey.png',
        images: '[]',
        status: 'active',
      },
    });
    created++;
  }
  return { total: items.length, created };
}

async function seedSolutions() {
  const items = [
    {
      title: '车路云一体化试点城市整体建设方案',
      slug: 'v2x-pilot-city-construction',
      industry: '城市交通',
      content: '面向申报与建设车路云一体化应用试点的城市，提供从顶层规划到持续运营的全周期方案：\n· 顶层设计：依据五部门试点要求编制建设方案与实施路径，明确路侧覆盖率、互联互通、商业闭环等验收指标。\n· 路侧建设：雷视一体机+边缘计算单元+RSU 标准化部署，重点城区覆盖率达标的同时控制单路口建设成本。\n· 云控平台：边缘云—区域云—中心云三级云控架构，支持多品牌车辆接入与跨区互认。\n· 场景运营：红绿灯信息推送、绿波车速引导、弱势交通参与者预警等十大标准场景落地，同步探索数据运营与增值服务商业模式。\n· 安全合规：PKI 证书体系与纵深防御方案同步建设，满足监管与安全评估要求。',
      sortOrder: 10,
    },
    {
      title: '低空经济无人机交通管理解决方案',
      slug: 'low-altitude-utm-solution',
      industry: '低空经济',
      content: '面向低空经济先行城市的无人机交通管理整体方案，复用城市路网管控方法论解决低空"高密度、高频次、强动态"管理难题：\n· 空域数字化：城市低空空域网格化建模，真高 120—300 米分层划设，形成可计算的数字空域底座。\n· 计划管理：飞行计划在线申报、自动审批与动态冲突解脱，政务类计划实现分钟级批复。\n· 融合调度：政务巡检、物流配送、应急医疗、文旅航拍多场景统一调度，优先等级动态调整。\n· 监管联动：对接无线电监测、光电跟踪与反制设备，"黑飞"目标探测—识别—处置全流程联动。\n· 数据服务：飞行热力、航线利用率等数据产品反哺空域规划优化。',
      sortOrder: 11,
    },
    {
      title: '高速公路车路协同与准全天候通行方案',
      slug: 'highway-v2x-all-weather',
      industry: '公路交通',
      content: '面向高速运营集团的车路协同与恶劣天气保畅方案：\n· 全天候感知：雷视融合+通感一体基站补盲，雨雾夜间场景事件检出率 ≥95%。\n· 主动管控：事故/抛洒物/团雾秒级发现，联动情报板、限速标志与导航平台分级预警。\n· 编队通行：为货运编队、自动驾驶卡车提供专用道协同管控与绿波通行服务。\n· 准全天候通行：恶劣天气下基于车路协同的引导车带道与编队放行，年均封闭时长下降 40% 以上。\n· 平急两用：日常服务通行效率，应急状态切换为救援通道保障模式。',
      sortOrder: 12,
    },
    {
      title: '城市 NOA 自动驾驶测试运行监管方案',
      slug: 'urban-noa-testing-supervision',
      industry: '自动驾驶',
      content: '面向承接 L3/L4 自动驾驶准入与示范运营试点的城市监管部门：\n· 准入支撑：试点路段风险评估、路侧设施符合性测试与准入评估技术服务。\n· 运行监管：测试与运营车辆实时位置、驾驶模式、接管记录全量留存，满足监管调取要求。\n· 事件处置：MRM 触发、事故、违停等事件的自动发现、派单与多部门联动处置。\n· 安全审计：DSSAD 数据解析与事故场景重建，支撑责任认定与规则迭代。\n· 公众沟通：示范运营数据可视化大屏与公众开放日展示，提升社会接受度。',
      sortOrder: 13,
    },
    {
      title: '数据要素驱动的城市交通治理现代化方案',
      slug: 'data-driven-urban-traffic-governance',
      industry: '数据要素',
      content: '面向交通投资集团、停车运营企业与大数据局的交通数据要素化方案：\n· 资源盘点：交通数据资源全面清查与分级分类，形成数据资产目录。\n· 合规入表：数据合规评估、成本归集与会计处理支持，完成数据资产入表。\n· 治理脱敏：轨迹、车牌等敏感数据的质量治理与场景化脱敏。\n· 产品运营：路况指数、停车热力、客流 OD 等数据产品封装，对接交易所挂牌交易。\n· 反哺治理：数据产品收益反哺交通治理投入，形成"数据—治理—收益"可持续闭环。',
      sortOrder: 14,
    },
    {
      title: '公交优先与 MaaS 一体化出行方案',
      slug: 'transit-priority-maas-integration',
      industry: '公共交通',
      content: '面向公交都市建设城市的"公交优先+MaaS"组合方案：\n· 信号优先：基于车辆定位的主动式公交信号优先，高峰线路行程车速提升 15%—25%。\n· 专用道管控：公交专用道占用视频巡检与自动取证，保障路权落地。\n· 联程出行：公交地铁+骑行+网约车+停车充电门到门联程规划与一票制支付。\n· 需求响应：基于 OD 客流数据的线路优化与需求响应式公交调度。\n· 绿色激励：碳普惠积分体系提升公共交通吸引力，助力绿色出行分担率考核达标。',
      sortOrder: 15,
    },
    {
      title: '重大活动交通保障智慧指挥方案',
      slug: 'major-event-traffic-command',
      industry: '城市交通',
      content: '面向大型赛事、会展、演唱会等重大活动交通组织保障：\n· 预案沙盘：数字孪生环境中推演进场/散场人流车流，优化交通组织方案。\n· 圈层管控：核心/管控/疏导三圈层分级管控策略，信号配时与诱导牌一键切换预案。\n· 车队保障：嘉宾、运动员、应急车队线路信号绿波与全程视频跟随。\n· 态势总览：指挥大屏实时聚合路况、停车余量、公交运力与事件处置进度。\n· 复盘评估：活动后自动生成保障评估报告，沉淀至预案库持续迭代。',
      sortOrder: 16,
    },
    {
      title: '学校医院周边交通微治理方案',
      slug: 'school-hospital-micro-governance',
      industry: '城市交通',
      content: '面向交警大队的学校、医院等拥堵热点"微治理"专项方案：\n· 精准诊断：多源数据识别接送学潮汐、就医高峰等拥堵成因，一点一策。\n· 组织优化：护学通道、即停即走泊位、单行微循环等低成本组织优化设计。\n· 信控适配：上下学时段专用配时方案自动切换，与周边路口协同防溢出。\n· 预约就医停车：医院泊位预约与周边场库联动诱导，减少门前巡位绕行。\n· 效果跟踪：治理前后延误、排队长度等指标自动对比，支撑长效管理。',
      sortOrder: 17,
    },
    {
      title: '货运车辆主动安全防御与运输监管方案',
      slug: 'freight-active-safety-supervision',
      industry: '物流运输',
      content: '面向物流园区与货运企业的车辆主动安全方案：\n· 车载防御：ADAS+DMS+盲区监测多设备融合，疲劳驾驶与前向碰撞风险实时预警。\n· 在途监管：冷链温湿度、危化品状态、偏航超速等运输过程全维监控。\n· 园区协同：园区预约排队、月台调度与在途车辆 ETA 联动，减少排队占道。\n· 保险联动：安全驾驶评分对接保险 UBI 定价，安全行为直接转化为保费优惠。\n· 政企互通：数据格式符合交通部监管平台对接标准，一次建设双重合规。',
      sortOrder: 18,
    },
    {
      title: '县域智慧停车一体化轻量建设方案',
      slug: 'county-smart-parking-lightweight',
      industry: '智慧停车',
      content: '面向县域城市的轻量化智慧停车方案，破解中小城市"预算有限、人才有限"的建设困境：\n· 轻量建设：高位视频+地磁灵活选型，单泊位建设成本较传统方案下降 40%。\n· 云端托管：SaaS 化部署免本地机房，县级平台与市级"一张网"无缝对接。\n· 自助运营：巡检车+PDA+无人值守组合，运营人力需求下降 50%。\n· 惠民体验：无感支付、信用先离后付、就医接送学专属优惠等本地化运营工具。\n· 投资回收：提供 BOT/ROT 等合作模式与收益测算，支撑项目可持续运营。',
      sortOrder: 19,
    },
  ];

  let created = 0;
  for (const it of items) {
    const exists = await prisma.solution.findUnique({ where: { slug: it.slug } });
    if (exists) continue;
    await prisma.solution.create({
      data: {
        ...it,
        coverImage: created % 2 === 0 ? '/images/car_mockup_iron_grey.png' : '/images/car_mockup_deep_blue.png',
        status: 'active',
      },
    });
    created++;
  }
  return { total: items.length, created };
}

async function seedJobs() {
  const items = [
    {
      title: '大模型算法工程师（交通方向）',
      department: 'AI 实验室',
      location: '长沙',
      type: 'full-time',
      description: '负责 XL-TrafficGPT 交通大模型的训练、微调与工程化落地。\n主要工作：1. 交通领域语料与时空数据的清洗、构建与指令微调；2. RAG/Agent 架构设计，实现配时方案生成与归因分析等决策场景；3. 模型评测体系搭建，覆盖准确率、幻觉率与业务安全性；4. 与信控智能体团队协同推进决策闭环上线。',
      requirements: '1. 硕士以上学历，计算机/人工智能/交通工程相关专业\n2. 熟悉主流开源大模型的微调与部署，有完整项目落地经验\n3. 熟悉 RAG、Function Calling、Agent 编排等工程范式\n4. 熟悉 Python + PyTorch，了解 vLLM/TGI 等推理框架\n5. 有交通/政务等垂直行业大模型经验者优先',
    },
    {
      title: '车路云一体化系统架构师',
      department: '研发中心',
      location: '长沙',
      type: 'full-time',
      description: '负责 XL-V2X-Cloud 车路云一体化协同平台的总体架构设计与技术演进。\n主要工作：1. 边缘云—区域云—中心云三级架构设计与容量规划；2. 多厂家 RSU/OBU 协议适配层的标准化设计；3. 高并发时空数据接入与实时协同决策链路性能优化；4. 参与试点城市项目的技术方案评审与交付支持。',
      requirements: '1. 本科以上学历，5 年以上分布式系统架构经验\n2. 熟悉车联网 T/CSAE 消息集与 V2X 协议栈\n3. 熟悉 Kafka/Flink 等实时数据技术栈与云原生架构\n4. 有车路云一体化试点项目经验者优先\n5. 具备良好的技术文档撰写与跨团队沟通能力',
    },
    {
      title: '低空交通管理平台开发工程师',
      department: '研发部',
      location: '长沙',
      type: 'full-time',
      description: '负责 XL-UTM 低空智联网监管平台的核心模块开发。\n主要工作：1. 空域数字化建模与飞行计划审批引擎开发；2. 动态冲突检测与解脱算法工程实现；3. 对接无线电监测、光电跟踪等设备的数据接入层；4. 参与低空场景调度算法的产品化封装。',
      requirements: '1. 本科以上学历，3 年以上后端开发经验，熟悉 Go 或 Java\n2. 熟悉 GIS/时空索引（如 H3、PostGIS）开发\n3. 熟悉实时计算与高并发系统设计\n4. 有空管、无人机云系统或交通管控平台经验者优先\n5. 了解民航局无人机云交换系统（UOM）接口规范者优先',
    },
    {
      title: '数据治理工程师（交通数据要素方向）',
      department: '数据平台部',
      location: '长沙',
      type: 'full-time',
      description: '负责 XL-DataHub 交通数据要素治理平台的数据治理体系建设。\n主要工作：1. 交通数据分级分类标准与资产目录体系建设；2. 数据质量规则引擎与质量评估模型开发；3. 轨迹、车牌等敏感数据脱敏策略设计与实现；4. 支撑客户数据资产入表与数据产品封装项目交付。',
      requirements: '1. 本科以上学历，3 年以上数据治理/数据仓库经验\n2. 熟悉 DAMA 数据治理体系与 DCMM 评估框架\n3. 熟悉 SQL 与至少一种大数据技术栈（Hive/Spark/Flink）\n4. 了解数据资产入表政策与数据交易流程者优先\n5. 有交通或政务数据治理项目经验者优先',
    },
    {
      title: '边缘计算嵌入式工程师',
      department: '硬件研发部',
      location: '长沙',
      type: 'full-time',
      description: '负责 XL-EdgeCore 路侧边缘计算单元的嵌入式软件开发。\n主要工作：1. 雷视融合感知算法的嵌入式部署与性能优化；2. 边缘侧信控决策模块与 V2X 消息栈开发；3. 断网自治与远程 OTA 升级机制实现；4. 国产化芯片平台的适配与移植。',
      requirements: '1. 本科以上学历，3 年以上嵌入式 Linux 开发经验\n2. 熟悉 C/C++，熟悉 ARM 平台开发与交叉编译\n3. 熟悉 NVIDIA Jetson 或国产 NPU 平台推理部署\n4. 熟悉 CAN/以太网通信，了解 V2X 协议者优先\n5. 有交通路侧设备或车载 ECU 开发经验者优先',
    },
    {
      title: '自动驾驶仿真测试工程师',
      department: 'AI 实验室',
      location: '长沙',
      type: 'full-time',
      description: '负责信控智能体与车路协同算法的仿真评测体系建设。\n主要工作：1. 基于 SUMO/Carla 搭建微观与宏中观联合仿真环境；2. 设计覆盖长尾场景的信控与协同测试用例库；3. 自动化评测流水线开发，输出延误、排队、安全冲突等 KPI；4. 支撑算法灰度发布前的仿真准入评估。',
      requirements: '1. 本科以上学历，交通工程/自动化/计算机相关专业\n2. 熟练使用 SUMO/VISSIM 或 Carla/LGSVL 至少一种仿真工具\n3. 熟悉 Python 自动化测试框架与 CI/CD 流水线\n4. 了解强化学习评测方法或自动驾驶场景库标准者优先\n5. 工作严谨，具备良好的实验设计能力',
    },
    {
      title: '网络安全研究员（车联网方向）',
      department: '安全部',
      location: '长沙',
      type: 'full-time',
      description: '负责车联网与车路云环境的安全研究、渗透测试与防护方案落地。\n主要工作：1. 车载系统、RSU、云控平台的渗透测试与漏洞挖掘；2. V2X 消息伪造、证书攻击等新型威胁的攻防研究；3. XL-CyberShield 纵深防御产品的检测规则迭代；4. 跟踪 UN R155/R156 等法规，输出合规咨询建议。',
      requirements: '1. 本科以上学历，3 年以上安全研究或渗透测试经验\n2. 熟悉常见漏洞原理与利用链，有 CVE/CNVD 编号者优先\n3. 熟悉汽车电子电气架构与 CAN/Ethernet 车载协议\n4. 熟悉国密算法与 PKI 体系者优先\n5. 具备良好的报告撰写与客户沟通能力',
    },
    {
      title: '售前解决方案专家（智慧交通）',
      department: '解决方案部',
      location: '长沙',
      type: 'full-time',
      description: '负责智慧交通、车路云一体化项目的售前技术支持与方案编制。\n主要工作：1. 客户需求调研与痛点分析，输出针对性解决方案；2. 试点城市申报方案、招投标技术文件编制；3. 现场述标与技术答疑，配合销售完成商务闭环；4. 沉淀行业方案模板与竞争分析材料。',
      requirements: '1. 本科以上学历，3 年以上智慧交通/车联网售前经验\n2. 熟悉信控、停车、车路协同至少一个细分领域的技术体系\n3. 熟悉政府采购流程与招投标文件编制规范\n4. 具备优秀的方案撰写与演讲表达能力\n5. 能适应中短期出差，有试点城市申报经验者优先',
    },
    {
      title: '数字孪生可视化工程师',
      department: '研发部',
      location: '长沙',
      type: 'full-time',
      description: '负责 XL-DigitalTwin 数字孪生路网平台与指挥中心大屏的三维可视化开发。\n主要工作：1. 基于 WebGL/Three.js/Cesium 的城市级路网三维场景渲染；2. 实时车流、信控状态、事件告警的动态可视化表达；3. 大规模时空数据渲染性能优化（LOD、实例化、数据分片）；4. 与仿真团队协作实现预案推演的可视化沙盘。',
      requirements: '1. 本科以上学历，3 年以上 WebGL/三维可视化开发经验\n2. 熟悉 Three.js/Cesium，了解着色器编程\n3. 熟悉 GeoJSON/3D Tiles 等空间数据格式\n4. 有智慧城市、交通大屏或数字孪生项目经验者优先\n5. 具备良好的视觉审美与性能优化意识',
    },
    {
      title: '项目交付经理（智慧停车方向）',
      department: '交付部',
      location: '长沙',
      type: 'full-time',
      description: '负责城市级智慧停车项目的全周期交付管理。\n主要工作：1. 制定项目计划，统筹硬件施工、软件部署与数据接入；2. 协调业主、运营商、施工队多方关系，管控范围与变更；3. 组织系统联调、试运行与验收交付；4. 沉淀交付 SOP 与县域轻量建设模式的最佳实践。',
      requirements: '1. 本科以上学历，3 年以上智慧城市/停车项目交付经验\n2. 熟悉项目管理方法论，持 PMP 或信息系统项目管理师证书者优先\n3. 熟悉高位视频、地磁、巡检车等停车硬件施工工艺\n4. 具备优秀的现场协调与风险管理能力\n5. 能适应项目阶段性驻场出差',
    },
  ];

  let created = 0;
  const ids: number[] = [];
  for (const it of items) {
    const exists = await prisma.job.findFirst({
      where: { title: it.title, department: it.department },
    });
    if (exists) {
      ids.push(exists.id);
      continue;
    }
    const job = await prisma.job.create({ data: { ...it, status: 'open' } });
    ids.push(job.id);
    created++;
  }
  return { total: items.length, created, ids };
}

async function seedMessages() {
  const items = [
    {
      name: '王处长',
      phone: '13907310001',
      email: 'wangchu@citytransport.gov.cn',
      company: '某市交通运输局',
      content: '我市正在筹备申报第二批车路云一体化应用试点城市，想了解贵司在云控平台建设与多厂家设备互联互通方面的实施经验，请安排技术团队来我局做一次交流。',
      status: 'pending',
    },
    {
      name: '陈总工',
      phone: '13907310002',
      email: 'chenzg@expressway-group.com',
      company: '某高速公路集团',
      content: '我们关注贵司的高速公路准全天候通行方案，省内两条团雾高发路段希望先做试点，请提供方案建议书与典型案例数据，下周可安排现场勘查。',
      status: 'pending',
    },
    {
      name: '刘经理',
      phone: '13907310003',
      email: 'lium@urban-investment.com',
      company: '某市城市投资集团',
      content: '集团拟将路内停车泊位与充电数据做资产入表，咨询贵司 XL-DataHub 平台在数据合规评估与交易所挂牌方面的落地案例，请尽快联系。',
      status: 'pending',
    },
    {
      name: '赵主任',
      phone: '13907310004',
      email: 'zhaozh@gov-datalake.gov.cn',
      company: '某市大数据中心',
      content: '我市低空经济示范区建设启动，需招标城市级无人机交通管理平台，看到贵司发布了 XL-UTM 产品，希望获取产品白皮书并约时间演示空域数字化建模能力。',
      status: 'pending',
    },
    {
      name: '孙队长',
      phone: '13907310005',
      email: 'sundui@traffic-police.gov.cn',
      company: '某市公安局交警支队',
      content: '支队辖区有 6 所学校周边早晚高峰拥堵严重，对贵司学校医院周边交通微治理方案很感兴趣，希望先做 1—2 所学校的试点评估，请报价。',
      status: 'pending',
    },
    {
      name: '周院长',
      phone: '13907310006',
      email: 'zhouy@hospital-it.org',
      company: '某三甲医院信息中心',
      content: '我院日均就诊车辆 4000 台次，门前拥堵投诉集中，想咨询预约就医停车与周边场库联动诱导方案，请提供同等级医院的实施案例。',
      status: 'pending',
    },
    {
      name: '吴总',
      phone: '13907310007',
      email: 'wuzong@robotaxi-fleet.com',
      company: '某自动驾驶运营公司',
      content: '我司 Robotaxi 车队明年计划扩至 300 台，监管要求数据留存与实时上报，咨询贵司 XL-RoboTaxi-Ops 平台是否支持多车型接入与 DSSAD 数据解析，请安排售前对接。',
      status: 'pending',
    },
    {
      name: '郑局长',
      phone: '13907310008',
      email: 'zhengju@county-gov.gov.cn',
      company: '某县住房和城乡建设局',
      content: '我县拟启动智慧停车建设但预算有限，看到贵司县域轻量建设方案，想了解 SaaS 托管模式的具体费用构成与周边县域的实施案例，请电话联系。',
      status: 'pending',
    },
    {
      name: '冯经理',
      phone: '13907310009',
      email: 'fengm@logistics-park.com',
      company: '某物流园区运营公司',
      content: '园区日均进出货车 2000 辆，排队占道问题突出，想部署预约排队与月台调度系统，并了解货运主动安全设备的集采价格，请发送产品资料。',
      status: 'pending',
    },
    {
      name: '何教授',
      phone: '13907310010',
      email: 'hejiao@university-lab.edu.cn',
      company: '某高校交通工程学院',
      content: '我们课题组在研究交通大模型评测基准，看到贵司发布 XL-TrafficGPT，希望探讨科研合作与数据共享的可能性，也欢迎贵司工程师来学院做技术讲座。',
      status: 'pending',
    },
  ];

  let created = 0;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const exists = await prisma.message.findFirst({
      where: { name: it.name, phone: it.phone },
    });
    if (exists) continue;
    await prisma.message.create({
      data: {
        ...it,
        createdAt: T(26 - i, 10 + (i % 8)),
      },
    });
    created++;
  }
  return { total: items.length, created };
}

async function seedApplications(jobIds: number[]) {
  if (jobIds.length === 0) return { total: 0, created: 0 };

  // 关联新职位 + 两个既有职位，保证详情页可正常回链
  const picks = [
    { jobId: jobIds[0], name: '李泽言', phone: '13811010001', email: 'lizeyan@example.com', coverLetter: '5 年 NLP/大模型工程经验，主导过政务大模型从微调到底层推理优化的全流程，熟悉 RAG 与 Agent 工程范式，希望参与交通垂直大模型建设。', status: 'pending' },
    { jobId: jobIds[0], name: '王清遥', phone: '13811010002', email: 'wangqingyao@example.com', coverLetter: '硕士期间方向为交通领域知识图谱，发表 2 篇 CCF-A 论文，有交通语料构建与指令微调经验，期待加入 AI 实验室。', status: 'reviewed' },
    { jobId: jobIds[1], name: '张砺锋', phone: '13811010003', email: 'zhanglifeng@example.com', coverLetter: '8 年分布式架构经验，曾负责省级车路协同平台云控层设计，熟悉 T/CSAE 消息集与三级云架构，可接受驻场支持。', status: 'pending' },
    { jobId: jobIds[2], name: '陈暮云', phone: '13811010004', email: 'chenmuyun@example.com', coverLetter: '4 年 Go 后端经验，有无人机云系统计划申报模块开发经历，熟悉 H3 空间索引与实时冲突检测，希望转向低空经济赛道。', status: 'pending' },
    { jobId: jobIds[3], name: '杨知微', phone: '13811010005', email: 'yangzhiwei@example.com', coverLetter: '主导过城商行数据资产入表咨询项目，熟悉 DCMM 评估与分级分类落地，看好交通数据要素化方向。', status: 'reviewed' },
    { jobId: jobIds[4], name: '周砚北', phone: '13811010006', email: 'zhouyanbei@example.com', coverLetter: '6 年嵌入式 Linux 开发，熟悉 Jetson 与瑞芯微 NPU 推理部署，做过路侧雷视一体机固件，期望加入硬件研发部。', status: 'pending' },
    { jobId: jobIds[5], name: '林栖迟', phone: '13811010007', email: 'linqichi@example.com', coverLetter: '交通工程硕士，3 年自动驾驶仿真测试经验，熟练使用 SUMO/Carla，搭建过覆盖 2000+ 长尾场景的评测流水线。', status: 'pending' },
    { jobId: jobIds[6], name: '沈砚秋', phone: '13811010008', email: 'shenyanqiu@example.com', coverLetter: '持有 OSWE，发表过车载以太网安全研究成果（2 个 CNVD 编号），熟悉 R155 合规要求，希望深耕车联网攻防。', status: 'accepted' },
    { jobId: jobIds[8], name: '顾屿森', phone: '13811010009', email: 'guyusen@example.com', coverLetter: '5 年 Three.js/Cesium 开发，负责过省级交通数字孪生大屏，熟悉 3D Tiles 与大规模车流渲染优化。', status: 'reviewed' },
    { jobId: jobIds[9], name: '许南乔', phone: '13811010010', email: 'xunanqiao@example.com', coverLetter: 'PMP 持证，主导过 3 个地市级智慧停车项目交付，熟悉高位视频与地磁施工工艺，可接受项目驻场。', status: 'pending' },
  ];

  let created = 0;
  for (let i = 0; i < picks.length; i++) {
    const it = picks[i];
    if (!it.jobId) continue;
    const exists = await prisma.application.findFirst({
      where: { jobId: it.jobId, name: it.name },
    });
    if (exists) continue;
    await prisma.application.create({
      data: {
        ...it,
        resumeUrl: null,
        createdAt: T(27 - Math.floor(i / 2), 14 + (i % 4)),
      },
    });
    created++;
  }
  return { total: picks.length, created };
}

async function main() {
  console.log('🌱 开始注入前沿内容（幂等）…');

  const news = await seedNews();
  console.log(`  ✓ 新闻：新增 ${news.created}/${news.total}`);

  const products = await seedProducts();
  console.log(`  ✓ 产品：新增 ${products.created}/${products.total}`);

  const solutions = await seedSolutions();
  console.log(`  ✓ 方案：新增 ${solutions.created}/${solutions.total}`);

  const jobs = await seedJobs();
  console.log(`  ✓ 职位：新增 ${jobs.created}/${jobs.total}`);

  const messages = await seedMessages();
  console.log(`  ✓ 留言：新增 ${messages.created}/${messages.total}`);

  const applications = await seedApplications(jobs.ids);
  console.log(`  ✓ 投递：新增 ${applications.created}/${applications.total}`);

  const counts = await Promise.all([
    prisma.news.count(),
    prisma.product.count(),
    prisma.solution.count(),
    prisma.job.count(),
    prisma.message.count(),
    prisma.application.count(),
  ]);
  console.log('\n📊 当前各表总量：');
  console.log(`  新闻=${counts[0]} 产品=${counts[1]} 方案=${counts[2]} 职位=${counts[3]} 留言=${counts[4]} 投递=${counts[5]}`);
}

main()
  .catch((e) => {
    console.error('❌ 种子执行失败：', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
