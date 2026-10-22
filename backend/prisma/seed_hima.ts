/**
 * 鸿蒙智行专区 Seed — 3 款车型（数据源：鸿蒙智行拓展材料261010.pptx）
 *
 * 运行：npx tsx prisma/seed_hima.ts
 * 说明：
 *  - upsert by slug，可重复执行
 *  - 分类统一为「鸿蒙智行」，sortOrder 100+ 独立于现有 IT 产品排序（不会进入首页精选前三）
 *  - 价格与配置以 hima.auto 官方《参数配置表》为准（2026-10-22 抓取；尊界 S800 价格较早期材料上调 2 万），实际成交以正式报价为准
 *  - 图片为 PPT 原图（本地落盘 backend/uploads/products/hima/），禁止外链
 *  - 同时 upsert 专区页 page_configs（hima/hero、hima/seo）
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PRICE_DATE = '2026-10-22';
const CAT = '鸿蒙智行';
const IMG_BASE = '/uploads/products/hima';

interface SpecItem { label: string; value: string }
interface SpecGroup { group: string; items: SpecItem[] }
interface Feature { title: string; detail: string }
interface ProductSeed {
  name: string;
  slug: string;
  description: string;
  features: Feature[];
  specs: SpecGroup[];
  priceInfo: { min: number; max: number; unit: string; note: string };
  scenarios: string[];
  cover: string;
  images: string[];
  sortOrder: number;
}

const himaProducts: ProductSeed[] = [
  // ============================================================
  // 一、尚界 H5（PPT 第 11-12 页）
  // ============================================================
  {
    name: '尚界 H5',
    slug: 'shangjie-h5',
    description:
      '尚界 H5 是鸿蒙智行旗下中型 SUV，提供纯电与增程两种动力形式，全系标配华为乾崑智驾 ADS 5 辅助驾驶系统与鸿蒙座舱，主打「一步到位」的智能化出行体验。',
    features: [
      { title: '华为乾崑智驾 ADS 5', detail: 'Pro 及增程 Pro 搭载基础版，Max+ 及增程 Max+ 搭载高阶版（192 线激光雷达）' },
      { title: '鸿蒙座舱', detail: '全系标配鸿蒙座舱，车机与手机、家居生态无缝流转' },
      { title: '超长续航', detail: '增程版 CLTC 综合续航 1360 km，纯电版 CLTC 纯电续航最高 655 km' },
      { title: '越级空间', detail: '车长 4780 mm、轴距 2840 mm，五座布局，兼顾乘坐空间与装载能力' },
    ],
    // 数据源：hima.auto 官方《尚界 H5 参数配置表》（2026-10-22 抓取）
    // 六款车型顺序：纯电 Pro / 纯电 Pro 长续航 / 纯电 Max+ / 纯电 Max+ 长续航 / 增程 Pro / 增程 Max+
    // 某项未标注版本者表示六款一致；标记：● 有该项配置　○ 该项选装　– 无该项配置
    specs: [
      {
        group: '基本信息',
        items: [
          { label: '配置版本', value: '纯电 Pro ｜ 纯电 Pro 长续航 ｜ 纯电 Max+ ｜ 纯电 Max+ 长续航 ｜ 增程 Pro ｜ 增程 Max+（以下各项未标注版本者，表示六款车型一致）' },
          { label: '配置标记', value: '● 有该项配置　○ 该项选装　– 无该项配置' },
          { label: '建议零售价', value: '纯电 Pro 165,800 元 ｜ 纯电 Pro 长续航 179,800 元 ｜ 纯电 Max+ 185,800 元 ｜ 纯电 Max+ 长续航 199,800 元 ｜ 增程 Pro 159,800 元 ｜ 增程 Max+ 179,800 元' },
          { label: '能源类型', value: 'EV（纯电）× 4 ｜ EVR（增程）× 2' },
          { label: '外漆颜色', value: '● 鎏金黑、月岩灰、云水蓝　○ 陶瓷白、仲夏紫、原野绿、馥蕾红' },
          { label: '内饰颜色', value: '● 韶华杏、夜阑灰、凝夜紫　○ 赤茶橘、琥珀棕' },
        ],
      },
      {
        group: '基本参数',
        items: [
          { label: '车身形式', value: '承载式' },
          { label: '长 × 宽 × 高（mm）', value: '4780 × 1910 × 1657（19 英寸轮胎；20 英寸轮胎车高 1664 mm）' },
          { label: '轴距（mm）', value: '2840' },
          { label: '整备质量（kg）', value: '纯电 Pro 1985 ｜ 纯电 Pro 长续航 1960 ｜ 纯电 Max+ 1985 ｜ 纯电 Max+ 长续航 1960 ｜ 增程 Pro/Max+ 2000' },
          { label: '座位数（个）', value: '5' },
        ],
      },
      {
        group: '储物空间',
        items: [
          { label: '电动前备箱', value: '●（支持 Knock-knock 开启，124 L）× 4 款纯电 ｜ – × 2 款增程' },
          { label: '单开式中央扶手箱', value: '●（8.2 L）' },
          { label: '副驾手套箱', value: '●（7.7 L）' },
          { label: '中控下方开放式储物空间', value: '●（15.1 L）' },
          { label: '后备箱储物容积', value: '●（二排可对折，纯电 601 L~1837 L ｜ 增程 593 L~1829 L）' },
          { label: '后备厢盖板下方储物箱', value: '●（纯电 80 L ｜ 增程 65 L）' },
          { label: '独立杯架', value: '4 个（前排中控处 2 个，后排座椅中央扶手 2 个）' },
        ],
      },
      {
        group: '动力系统',
        items: [
          { label: 'CLTC 综合续航里程（km）', value: '纯电 – ｜ 增程 1360' },
          { label: 'WLTC 综合续航里程（km）', value: '纯电 – ｜ 增程 1165' },
          { label: 'CLTC 纯电续航里程（满电，km）', value: '纯电 Pro 535 ｜ 纯电 Pro 长续航 655 ｜ 纯电 Max+ 525 ｜ 纯电 Max+ 长续航 640 ｜ 增程 Pro/Max+ 235' },
          { label: 'WLTC 纯电续航里程（满电，km）', value: '纯电 – ｜ 增程 200' },
          { label: '0-100 km/h 加速时间（s）', value: '纯电 Pro 7.9 ｜ 纯电 Pro 长续航 7.3 ｜ 纯电 Max+ 7.9 ｜ 纯电 Max+ 长续航 7.3 ｜ 增程 Pro/Max+ 7.8' },
          { label: '100-0 km/h 制动距离（m）', value: '35.12（19 英寸轮胎；20 英寸轮胎 34.23 m）' },
          { label: '转弯半径（m）', value: '纯电 5.4 ｜ 增程 5.5' },
          { label: '最高车速（km/h）', value: '纯电 Pro 190 ｜ 纯电 Pro 长续航 200 ｜ 纯电 Max+ 190 ｜ 纯电 Max+ 长续航 200 ｜ 增程 Pro/Max+ 180' },
          { label: '增程器', value: '增程：1.5 L 四缸增程专用发动机，量产热效率 43.23% ｜ 纯电 –' },
          { label: '驾驶模式', value: '节能/舒适/运动/个性化' },
          { label: '车辆模式', value: '纯电（纯电款）｜ 强制纯电/纯电优先/智能/燃油优先/强制发电（增程款）' },
          { label: '驱动形式', value: '单电机后驱' },
          { label: '电动机', value: '永磁同步' },
          { label: '电动机最大功率（kW）', value: 'Pro 150 ｜ Max+ 180（同款电机因电池电压不同功率略有差异）' },
          { label: '电动机最大扭矩（N·m）', value: '350' },
          { label: '电压平台', value: '400V' },
          { label: '电池类型', value: 'Pro 磷酸铁锂 ｜ Pro 长续航 三元锂 ｜ Max+ 磷酸铁锂 ｜ Max+ 长续航 三元锂 ｜ 增程 Pro/Max+ 磷酸铁锂' },
          { label: '电芯品牌', value: '宁德时代' },
          { label: '电池容量（kWh）', value: '纯电 Pro 64.6 ｜ 纯电 Pro 长续航 80 ｜ 纯电 Max+ 64.6 ｜ 纯电 Max+ 长续航 80 ｜ 增程 Pro/Max+ 32.6' },
          { label: '燃油标号', value: '增程 92# 及以上 ｜ 纯电 –' },
          { label: '油箱容积（L）', value: '增程 50 L，高压油箱 ｜ 纯电 –' },
          { label: '排放标准', value: '增程 国六 b ｜ 纯电 –' },
        ],
      },
      {
        group: '底盘系统',
        items: [
          { label: '前悬架', value: '麦弗逊式独立悬架' },
          { label: '后悬架', value: '五连杆式独立悬架' },
          { label: '电子驻车制动', value: '●' },
          { label: '转向助力模式', value: '●（舒适/标准/运动）' },
          { label: '制动器/制动盘', value: '前、后通风盘式' },
        ],
      },
      {
        group: '安全配置',
        items: [
          { label: '前排安全带', value: '● 双预紧限力 ＋ DLT 动态锁舌' },
          { label: '儿童安全座椅接口', value: '二排 ISOFIX × 2' },
          { label: '全车安全带未系提醒', value: '●' },
          { label: '驾驶员正面气囊', value: '● × 1' },
          { label: '副驾驶员正面气囊', value: '● × 1' },
          { label: '三腔远端气囊', value: '● × 1' },
          { label: '前排（左/右）侧气囊', value: '● × 2' },
          { label: '前后排（左/右）侧气帘', value: '● × 2' },
          { label: 'DVR 行车记录仪', value: '●' },
        ],
      },
      {
        group: '辅助驾驶 · 硬件配置',
        items: [
          { label: '辅助驾驶系统', value: 'Pro/增程 Pro 华为乾崑智驾® ADS 5 基础版 ｜ Max+/增程 Max+ ADS 5 高阶版' },
          { label: '激光雷达', value: 'Pro/增程 Pro – ｜ Max+/增程 Max+ ● 1 个 192 线激光雷达' },
          { label: '毫米波雷达', value: '● 3 个 4D 毫米波雷达' },
          { label: '超声波雷达', value: '● 12 颗' },
          { label: '高感知摄像头', value: 'Pro/增程 Pro 前视 ×2 ＋ 侧视 ×4 ＋ 环视 ×4 ｜ Max+/增程 Max+ 前视 ×2 ＋ 后视 ×1 ＋ 侧视 ×4 ＋ 环视 ×4' },
          { label: '高精度定位', value: '●' },
        ],
      },
      {
        group: '辅助驾驶 · 主动安全',
        items: [
          { label: '全系标配（●）', value: '盲区监测（BSD）、开门预警（DOW）、前向碰撞预警（FCW）、自动紧急制动（AEB）、后向横穿碰撞提示（RCTA）、后向横穿碰撞制动（RCTB）、前向横穿碰撞提示（FCTA）、前向横穿碰撞制动（FCTB）、后向碰撞预警（RCW）、后向自动紧急制动（RAEB）、低速自动紧急制动（LAEB）、车道偏离预警（LDW）、车道保持辅助（LKA）、紧急车道保持辅助（ELKA）、交通标志识别（TSR）、超速告警（TSA）、交通灯识别（TLR）、侧向障碍物防碰撞（LOCP）、防误踩加速踏板' },
          { label: '异形障碍物自动紧急制动（GAEB）', value: 'Pro/增程 Pro – ｜ Max+/增程 Max+ ● 前向' },
          { label: '路面自适应 AEB', value: 'Pro/增程 Pro – ｜ Max+/增程 Max+ ●' },
          { label: '紧急转向辅助（ESA）', value: 'Pro/增程 Pro – ｜ Max+/增程 Max+ ●' },
          { label: '增强型自动紧急转向（eAES）', value: 'Pro 系 – ｜ Max+ 系 ○' },
          { label: '驾驶员失能辅助', value: 'Pro 系 – ｜ Max+ 系 ○' },
        ],
      },
      {
        group: '辅助驾驶 · 泊车',
        items: [
          { label: '360° 全景环视（AVM）', value: '●' },
          { label: '透明底盘', value: '●' },
          { label: '泊车辅助（APA）', value: '●' },
          { label: '遥控泊车辅助（RPA）', value: '● 遥控泊入/泊出辅助（支持垂直、平行、斜列车位）● 遥控直行辅助 ● 离车泊入辅助（Pro 及增程 Pro 仅支持地库车位）' },
          { label: '循迹倒车辅助（RA）', value: 'Pro/增程 Pro – ｜ Max+/增程 Max+ ●' },
          { label: '机械车位泊车辅助', value: 'Pro 系 – ｜ Max+ 系 ○' },
          { label: '园区领航辅助（Campus NCA）', value: 'Pro 系 – ｜ Max+ 系 ○' },
          { label: '代客泊车辅助（AVP）', value: 'Pro/增程 Pro ○ ｜ Max+/增程 Max+ –' },
        ],
      },
      {
        group: '辅助驾驶 · 巡航',
        items: [
          { label: '自适应巡航辅助（ACC）', value: '●' },
          { label: '高速车道巡航辅助（Highway LCC）', value: '●' },
          { label: '高速领航辅助（Highway NCA）', value: '●' },
          { label: '城区车道巡航辅助（City LCC）', value: '●' },
          { label: '城区车道巡航辅助增强（City LCC PLUS）', value: '○' },
          { label: '城区智能变道辅助', value: 'Pro/增程 Pro ○ ｜ Max+/增程 Max+ –' },
          { label: '城区领航辅助（City NCA）', value: 'Pro 系 – ｜ Max+ 系 ○' },
          { label: '车位到车位领航辅助', value: 'Pro 系 – ｜ Max+ 系 ○' },
          { label: '哨兵模式', value: '●' },
        ],
      },
      {
        group: '外部配置',
        items: [
          { label: '轮胎轮毂', value: '● 19 英寸低风阻轮毂（235/55 R19）○ 20 英寸多辐轮毂（245/50 R20 静音）○ 20 英寸黑曜多辐轮毂（含黑曜运动套件）○ 20 英寸多辐星璨轮毂 ○ 20 英寸黑曜多辐星璨轮毂（含黑曜运动套件）' },
          { label: '主动进气格栅', value: '●' },
          { label: '天窗', value: '不可开启式全景天窗 ＋ 电动遮阳帘' },
          { label: '全车玻璃', value: '前风挡双层隔音 ＋ 前门双层隔音 ＋ 全景天窗双层隔音玻璃' },
          { label: '前雨量感应式无骨雨刮', value: '●' },
          { label: '机械式门把手', value: '●' },
          { label: '后备箱开启及关闭方式', value: '电动，支持脚踢电动开启尾门' },
          { label: '无边框外后视镜', value: '● 电动调节/折叠/加热/位置记忆/倒车自动下翻' },
          { label: '防眩目内后视镜', value: '● 手动' },
          { label: '前后挡风除霜功能', value: '●' },
        ],
      },
      {
        group: '灯光配置',
        items: [
          { label: 'L 型灵眸大灯', value: '●' },
          { label: '双平行线贯穿尾灯', value: '●' },
          { label: '辅助驾驶灯', value: '● 4 颗（前 ×2 ＋ 后 ×2）' },
          { label: '发光 Logo 前标', value: '●' },
          { label: '自动远近光切换（HMA）', value: '●' },
          { label: 'LED 转向灯 / LED 侧转向灯', value: '●' },
          { label: 'LED 后组合侧围灯', value: '●' },
          { label: '高位制动灯', value: '●' },
          { label: 'LED 后雾灯', value: '●' },
          { label: '舱内 LED 随动氛围灯', value: '● 256 色' },
          { label: '化妆镜与灯光', value: '●' },
        ],
      },
      {
        group: '内部配置',
        items: [
          { label: '10.25 英寸仪表屏', value: '●' },
          { label: '15.6 英寸 2K 中控屏', value: '●' },
          { label: '15.6 英寸 2K 中控随动屏', value: '○' },
          { label: '26.1 英寸 W-HUD 抬头显示', value: '○' },
          { label: '音响系统', value: '12 扬声器' },
          { label: '星环散射体', value: '●' },
          { label: '车内麦克风', value: '● 4 个（前 2 个，后 2 个）' },
          { label: '多功能方向盘', value: '●（脱手检测、振动提醒、一键开启智驾辅助、支持自定义功能按键）' },
          { label: '手动方向盘可调', value: '●（上下 ＋ 前后）' },
          { label: '方向盘加热', value: '●' },
          { label: '双温区空调', value: '●' },
          { label: 'CN95＋ 活性炭高效空气滤芯', value: '●' },
          { label: '顶棚材质', value: '超纤绒' },
        ],
      },
      {
        group: '座椅配置',
        items: [
          { label: '座椅材质', value: '仿皮' },
          { label: '主驾座椅', value: '12 向电动调节（前后 2 向 ＋ 背靠 2 向 ＋ 高低 2 向 ＋ 电动腰托 4 向 ＋ 坐垫 2 向），最大躺倒角度 155°' },
          { label: '副驾座椅', value: '10 向电动调节（前后 2 向 ＋ 背靠 2 向 ＋ 高低 2 向 ＋ 电动腰托 4 向），最大躺倒角度 155°' },
          { label: '副驾座椅腿托', value: '4 向电动调节' },
          { label: '二排座椅', value: '手动二档靠背可调（椅背角度 27°/32°）' },
          { label: '二排座椅中央扶手', value: '●（含两个杯托）' },
          { label: '座椅通风', value: '●（前排 ＋ 二排左右座椅）' },
          { label: '座椅加热', value: '●（前排 ＋ 二排左右座椅）' },
          { label: '座椅按摩', value: '●（前排）' },
          { label: '主驾座椅记忆 ＋ 迎宾功能', value: '●' },
          { label: '副驾座椅记忆功能', value: '●' },
          { label: '副驾魔吸车载接口（HUAWEI MagLink）', value: '●' },
        ],
      },
      {
        group: '便捷体验',
        items: [
          { label: '手机无线充电', value: '● 1 × HUAWEI Super Charge 50 W' },
          { label: '有线充电', value: '● 3 个：前排 1 × 66 W Type-C ＋ 后排 1 × 66 W ＋ 1 × 15 W Type-C' },
          { label: '舱内数据接口', value: '1 个 DVR TF 卡接口 ＋ 1 个 USB 2.0 接口' },
          { label: '12V 车载电源', value: '●（后备箱 × 1）' },
          { label: 'GPS 导航', value: '●' },
          { label: 'DMS 人脸识别', value: '●' },
          { label: '星闪遥控实体钥匙', value: '○' },
          { label: '手机蓝牙钥匙 / 手机星闪钥匙', value: '●' },
          { label: '手表蓝牙钥匙 / 手表星闪钥匙', value: '●' },
          { label: 'NFC 卡片钥匙 / 机械钥匙', value: '●' },
          { label: '营地供电模式（V2L）', value: '●（220V 交流电，最大功率 6 kW）' },
          { label: '充电桩', value: '○（7 kW 交流或 11 kW 直流，需单独购买）' },
        ],
      },
      {
        group: '原厂售后精品',
        items: [
          { label: '前门照地灯', value: '○' },
          { label: 'ETC', value: '○（前装内置硬件，购车后付费开通）' },
        ],
      },
      {
        group: '配置与价格',
        items: [
          { label: '尚界 H5 纯电 Pro', value: '165,800 元 ｜ 华为乾崑智驾 ADS 5 基础版 ｜ 整备质量 1985 kg' },
          { label: '尚界 H5 纯电 Pro 长续航版', value: '179,800 元 ｜ ADS 5 基础版 ｜ 鸿蒙座舱 ｜ CLTC 纯电续航 655 km ｜ 整备质量 1960 kg' },
          { label: '尚界 H5 纯电 Max+', value: '185,800 元 ｜ ADS 5 高阶版（192 线激光雷达）｜ 鸿蒙座舱 ｜ CLTC 纯电续航 525 km ｜ 整备质量 1985 kg' },
          { label: '尚界 H5 纯电 Max+ 长续航版', value: '199,800 元 ｜ ADS 5 高阶版（192 线激光雷达）｜ 鸿蒙座舱 ｜ CLTC 纯电续航 640 km ｜ 整备质量 1960 kg' },
          { label: '尚界 H5 增程 Pro', value: '159,800 元 ｜ ADS 5 基础版 ｜ 鸿蒙座舱 ｜ CLTC 综合续航 1360 km ｜ 整备质量 2000 kg' },
          { label: '尚界 H5 增程 Max+', value: '179,800 元 ｜ ADS 5 高阶版（192 线激光雷达）｜ 鸿蒙座舱 ｜ CLTC 综合续航 1360 km ｜ 整备质量 2000 kg' },
        ],
      },
    ],
    priceInfo: {
      min: 159800,
      max: 199800,
      unit: '元',
      note: '建议零售价，共 6 款配置（纯电 4 款 / 增程 2 款）；官方在售命名为 Max+',
    },
    scenarios: ['家庭日常通勤', '城市智能驾驶出行', '长途跨城自驾', '限购城市新能源指标用车'],
    cover: `${IMG_BASE}/shangjie-h5-1.jpg`,
    images: [1, 2, 3, 4, 5, 6].map((i) => `${IMG_BASE}/shangjie-h5-${i}.jpg`),
    sortOrder: 101,
  },

  // ============================================================
  // 二、尊界 S800（PPT 第 13-14 页）
  // ============================================================
  {
    name: '尊界 S800',
    slug: 'zunjie-s800',
    description:
      '尊界 S800（MAEXTRO S800）是鸿蒙智行旗舰大型豪华轿车，提供纯电与增程两种能源形式，全系标配华为乾崑智驾 ADS 5 高阶版与华为悦彰非凡系列音响，搭载后轮转向与双腔空气悬架，面向高端商务出行场景。',
    features: [
      { title: '华为乾崑智驾 ADS 5 高阶版', detail: '全系标配，1 个 896 线双光路图像级激光雷达 ＋ 3 个高精度固态激光雷达' },
      { title: '华为悦彰 非凡系列', detail: 'HUAWEI SOUND® ULTIMATE，尊享版 35 扬声器（7.5.4），行政版 43 扬声器（7.5.10）' },
      { title: '豪华座舱布局', detail: '尊享版 5 座 ／ 行政版 4 座（后排双零重力座椅，行政版支持 ActiveSafe）' },
      { title: '双能源选择', detail: '纯电版 CLTC 纯电续航最高 670 km；增程版 CLTC 综合续航最高 1333 km' },
    ],
    // 数据源：hima.auto 官方《尊界 S800 参数配置表》（2026-10-22 抓取）
    // 六款车型顺序：纯电星辉尊享 / 增程星辉尊享 / 增程星耀尊享 / 纯电星辉行政 / 增程星辉行政 / 增程星耀行政
    // 某项未标注版本者表示六款一致；标记：● 有该项配置　○ 该项选装　– 无该项配置
    specs: [
      {
        group: '基本信息',
        items: [
          { label: '配置版本', value: '纯电星辉尊享 ｜ 增程星辉尊享 ｜ 增程星耀尊享 ｜ 纯电星辉行政 ｜ 增程星辉行政 ｜ 增程星耀行政（以下各项未标注版本者，表示六款车型一致）' },
          { label: '配置标记', value: '● 有该项配置　○ 该项选装　– 无该项配置' },
          { label: '全国建议零售价', value: '纯电星辉尊享 728,000 元 ｜ 增程星辉尊享 728,000 元 ｜ 增程星耀尊享 808,000 元 ｜ 纯电星辉行政 838,000 元 ｜ 增程星辉行政 838,000 元 ｜ 增程星耀行政 1,018,000 元' },
          { label: '能源类型', value: 'EV（纯电）× 2 ｜ EVR（增程式混动）× 4' },
          { label: '外漆颜色 + 内饰颜色', value: '单色 ● 星耀黑 + 夜阑墨棕 + 哑光胡桃木内饰；○ 星耀黑 + 煦日浅棕 + 哑光胡桃木 ／ 星耀黑 + 煦日浅棕 + 高光胡桃木 ／ 星耀黑 + 云雾雅白 + 白钢琴漆木 ／ 云霞晖 + 云雾雅白 + 白钢琴漆木；双色 ○ 破晓金黑 + 煦日浅棕 + 哑光胡桃木 ／ 破晓金黑 + 煦日浅棕 + 高光胡桃木 ／ 破晓金黑 + 云雾雅白 + 白钢琴漆木 ／ 旷野棕金 + 煦日浅棕 + 高光胡桃木 ／ 凌云墨白 + 云雾雅白 + 白钢琴漆木 ／ 旷野棕金 + 晨夕白棕 + 高光胡桃木 ／ 破晓金黑 + 晨夕白棕 + 高光胡桃木 ／ 云境银紫 + 霞光白紫 + 白钢琴漆木' },
        ],
      },
      {
        group: '基本参数',
        items: [
          { label: '车身形式', value: '承载式' },
          { label: '长 × 宽 × 高（mm）', value: '5480 × 2000 × 1542' },
          { label: '轴距（mm）', value: '3370' },
          { label: '整备质量（kg）', value: '纯电星辉尊享 2604 ｜ 增程星辉尊享 2770 ｜ 增程星耀尊享 2822 ｜ 纯电星辉行政 2685 ｜ 增程星辉行政 2770 ｜ 增程星耀行政 2851' },
          { label: '座位数（个）', value: '尊享版 5 ｜ 行政版 4' },
        ],
      },
      {
        group: '储物空间',
        items: [
          { label: '前备箱', value: '纯电款 ● ｜ 增程款 –' },
          { label: '副驾隐私储物箱', value: '●（电动开，密码保护，手动关）' },
          { label: '侧滑盖式中央扶手箱（前）', value: '●（手动开关）' },
          { label: '上翻盖式中央扶手箱（前）', value: '●（手动开关）' },
          { label: '抽屉式中央扶手隐私保密箱（前排，朝后开）', value: '尊享版 ●（电动开关，密码保护）｜ 行政版 ●（电动开关，密码保护，指纹保护）' },
          { label: '上翻盖式中央扶手箱（后）', value: '尊享版 ●（中间座椅靠背背面，靠背翻下时可用）｜ 行政版 ●' },
          { label: '四门扶手翻盖式门板储物盒', value: '●' },
          { label: '冰箱上方储物盒', value: '●' },
          { label: '后排双温控车载冰箱', value: '●（制冷：-6~10 ℃；制热：35~50 ℃）' },
          { label: '后备箱储物容积（L）', value: '尊享版 438 ｜ 行政版 445' },
          { label: '前排杯架', value: '●（2 个）' },
          { label: '后排杯架', value: '尊享版 ●（2 个）｜ 行政版 ●（2 个，支持冷暖控制）' },
        ],
      },
      {
        group: '动力系统',
        items: [
          { label: 'CLTC 纯电续航里程（满电，km）', value: '纯电星辉尊享 670 ｜ 增程星辉尊享 400 ｜ 增程星耀尊享 365 ｜ 纯电星辉行政 650 ｜ 增程星辉行政 400 ｜ 增程星耀行政 340' },
          { label: 'CLTC 综合续航里程（满油满电，km）', value: '纯电 – ｜ 增程星辉尊享 1333 ｜ 增程星耀尊享 1200 ｜ 增程星辉行政 1333 ｜ 增程星耀行政 1155' },
          { label: 'WLTC 综合续航里程（满油满电，km）', value: '纯电 – ｜ 增程星辉尊享 1102 ｜ 增程星耀尊享 1000 ｜ 增程星辉行政 1102 ｜ 增程星耀行政 965' },
          { label: '0-100 km/h 加速时间（s）', value: '纯电星辉尊享 4.3 ｜ 增程星辉尊享 4.9 ｜ 增程星耀尊享 4.6 ｜ 纯电星辉行政 4.5 ｜ 增程星辉行政 4.9 ｜ 增程星耀行政 4.7' },
          { label: '最高车速（km/h）', value: '纯电款 210 ｜ 增程款 200' },
          { label: '增程器', value: '纯电 – ｜ 增程 1.5T 四缸增程器' },
          { label: '驾驶模式', value: '尊界/节能/舒适/运动/个性化' },
          { label: '驱动形式', value: '双电机四驱 × 4 ｜ 三电机四驱 × 2（增程星耀尊享、增程星耀行政）' },
          { label: '电机类型', value: '前感应/异步 ＋ 后永磁/同步' },
          { label: '电动机最大功率（kW）', value: '双电机四驱款 前 160 / 后 230 ｜ 三电机四驱款 前 160 / 后 475' },
          { label: '电动机最大扭矩（N·m）', value: '纯电星辉尊享 前 277 / 后 396 ｜ 增程双电机款 前 208 / 后 396 ｜ 三电机款 前 208 / 后 510' },
          { label: '电压平台', value: '华为「巨鲸」800 V 高压电池平台' },
          { label: '电池类型', value: '三元锂电池' },
          { label: '电池容量（kWh）', value: '纯电款 97 ｜ 增程款 65' },
          { label: '充电时间', value: '纯电款 快充 12 分钟（10%-80%）／慢充 11 小时（20%-90%）｜ 增程款 快充 10.5 分钟（10%-80%）／慢充 7 小时（20%-90%）' },
          { label: '燃油标号', value: '增程 95# ｜ 纯电 –' },
          { label: '油箱容积（L）', value: '增程 50 ｜ 纯电 –' },
          { label: '排放标准', value: '增程 国六 b ｜ 纯电 –' },
        ],
      },
      {
        group: '底盘系统',
        items: [
          { label: '前悬架', value: '双叉臂式前独立悬架' },
          { label: '后悬架', value: '多连杆式后独立悬架' },
          { label: '空气悬架', value: '●（双腔）' },
          { label: '连续可变阻尼减振器', value: '●' },
          { label: '车身高低调节范围（mm）', value: '45' },
          { label: '车身高度自动随速调节', value: '●' },
          { label: '预瞄', value: '●（通过车辆融合感知系统实时识别路面情况，实时调节）' },
          { label: '前后通风盘式制动器', value: '●' },
          { label: '电子驻车制动', value: '●' },
          { label: '转向助力模式（舒适/标准/运动）', value: '●' },
          { label: 'R-EPS 随速可变电动助力转向', value: '●' },
          { label: '后轮转向', value: '●（12°）' },
          { label: '转向冗余系统', value: '●' },
          { label: '制动冗余系统', value: '●' },
        ],
      },
      {
        group: '安全配置',
        items: [
          { label: '主副驾双预紧式安全带', value: '●' },
          { label: '后排儿童安全座椅接口', value: '●（2 座）' },
          { label: '全车安全带未系提醒', value: '●' },
          { label: '前排正面气囊', value: '●（2 个）' },
          { label: '前排侧面气囊', value: '●（2 个）' },
          { label: '前排中央气囊', value: '●（1 个）' },
          { label: '前后排头部侧气帘', value: '尊享版 ●（选装隐私巨幕版本：4 个；不选装隐私巨幕版本：2 个）｜ 行政版 ●（4 个）' },
          { label: '后排侧面气囊', value: '●（2 个）' },
          { label: '后排坐垫气囊', value: '尊享版 – ｜ 行政版 ●（2 个）' },
        ],
      },
      {
        group: '驾驶辅助 · 硬件配置',
        items: [
          { label: '驾驶辅助系统', value: '● 华为乾崑智驾® ADS 5 高阶版（全系）' },
          { label: '激光雷达', value: '● 1 个 896 线双光路图像级激光雷达 ＋ 3 个高精度固态激光雷达' },
          { label: '毫米波雷达', value: '● 5 个 4D 毫米波雷达（含 1 套分布式雷达）' },
          { label: '超声波雷达', value: '●（12 个）' },
          { label: '高感知摄像头', value: '●（前视 2 个，后视 1 个，侧视 4 个）' },
          { label: '全景摄像头', value: '●（4 个）' },
          { label: '车外麦克风', value: '●（4 个）' },
          { label: '高精度定位', value: '●' },
          { label: '倒车摄像头电动清洗', value: '●' },
          { label: '转向冗余系统', value: '●' },
          { label: '制动冗余系统', value: '●' },
          { label: '通信冗余系统', value: '●' },
          { label: '供电冗余系统', value: '●' },
          { label: '感知冗余系统', value: '●' },
        ],
      },
      {
        group: '驾驶辅助 · 主动安全',
        items: [
          { label: '全系标配（●）', value: '盲区监测预警（BSD）、开门预警（DOW）、前向碰撞预警（FCW）、自动紧急制动（AEB）、后向横穿碰撞预警（RCTA）、后向横穿碰撞制动（RCTB）、前向横穿碰撞预警（FCTA）、前向横穿碰撞制动（FCTB）、后向碰撞预警（RCW）、后向自动紧急制动（RAEB）、低速自动紧急制动（LAEB）、车道偏离预警（LDW）、车道保持辅助（LKA）、紧急车道保持辅助（ELKA）、交通标志识别（TSR）、超速告警（TSA）、交通信号灯识别（TLR）、侧向障碍物防碰撞（LOCP）、前向异形障碍物自动紧急制动（GAEB）、后向异形障碍物自动紧急制动（GRAEB）、路面自适应 AEB、防误踩加速踏板、驾驶员失能辅助、紧急转向辅助（ESA）、防被追尾辅助' },
          { label: '爆胎稳定控制辅助', value: '星辉款 ●（强）｜ 星耀款 ●（超强）' },
          { label: '增强型自动紧急转向（eAES）', value: '○（辅助驾驶服务软件高阶功能包，需购车后单独购买）' },
        ],
      },
      {
        group: '驾驶辅助 · 泊车',
        items: [
          { label: '360° 全景环视（AVM）', value: '●' },
          { label: '透明底盘', value: '●' },
          { label: '泊车辅助（APA）', value: '●' },
          { label: '遥控泊车辅助（RPA）', value: '●（遥控泊入/泊出辅助：支持垂直、平行、斜列车位；遥控直行辅助；离车泊入辅助）' },
          { label: '循迹倒车辅助（RA）', value: '●' },
          { label: '漫游巡航辅助', value: '○（辅助驾驶服务软件高阶功能包，需购车后单独购买）' },
          { label: '园区领航辅助（Campus NCA）', value: '○（辅助驾驶服务软件高阶功能包，需购车后单独购买）' },
        ],
      },
      {
        group: '驾驶辅助 · 巡航',
        items: [
          { label: '自适应巡航辅助（ACC）', value: '●' },
          { label: '高速车道巡航辅助（Highway LCC）', value: '●' },
          { label: '高速领航辅助（Highway NCA）', value: '●' },
          { label: '城区车道巡航辅助（City LCC）', value: '●' },
          { label: '城区车道巡航辅助增强（City LCC PLUS）', value: '○（辅助驾驶服务软件高阶功能包，需购车后单独购买）' },
          { label: '城区领航辅助（City NCA）', value: '○（辅助驾驶服务软件高阶功能包，需购车后单独购买）' },
          { label: '车位到车位领航辅助', value: '○（辅助驾驶服务软件高阶功能包，需购车后单独购买）' },
          { label: '哨兵模式', value: '●' },
        ],
      },
      {
        group: '外部配置',
        items: [
          { label: '轮胎轮毂', value: '星辉款 ● 20 英寸 30 辐星辉轮毂（265/45 R20 静音轮胎）○ 20 英寸 12 孔晖月轮毂（265/45 R20 静音轮胎）○ 21 英寸 25 孔日耀轮毂（265/40 R21 静音轮胎）｜ 增程星耀行政 ● 21 英寸 25 孔日耀轮毂（265/40 R21 静音轮胎）○ 20 英寸 30 辐星辉轮毂（265/45 R20 静音轮胎）○ 20 英寸 12 孔晖月轮毂（265/45 R20 静音轮胎）' },
          { label: '主动进气格栅', value: '纯电款 ● ｜ 增程款 –' },
          { label: '电动门（支持毫米波防撞、电吸、电开）', value: '●' },
          { label: '天幕', value: '全景双层静音隔热隐私玻璃' },
          { label: '全车玻璃', value: '前风挡双层静音镀银隔热玻璃 ＋ 前排双层静音隔热玻璃 ＋ 后排双层静音隔热隐私玻璃 ＋ 后三角窗双层静音隔热隐私玻璃 ＋ 后风挡双层静音隔热隐私玻璃' },
          { label: '后排隐私光幕（调光玻璃，含三角窗）', value: '增程星耀行政 ● ｜ 其余五款 ○' },
          { label: '天幕遮阳帘', value: '前后独立电动遮阳帘，选配星空顶版本不支持遮阳帘' },
          { label: '后排侧窗遮阳帘（含三角窗）', value: '●（电动）' },
          { label: '后风挡遮阳帘', value: '●（电动）' },
          { label: '半开放式门把手', value: '●' },
          { label: '尾门开启方式', value: '电动开启：按钮、脚踢' },
          { label: '流媒体内后视镜', value: '●' },
          { label: '物理外后视镜', value: '●（外后视镜电动折叠/加热/记忆功能）' },
          { label: '前风挡除霜功能', value: '●' },
          { label: '后风挡除霜功能', value: '●' },
        ],
      },
      {
        group: '灯光配置',
        items: [
          { label: '自适应近光灯（AFS）', value: '●' },
          { label: '自适应矩阵大灯（ADB）', value: '●' },
          { label: '自动远近光切换（HMA）', value: '●' },
          { label: 'LED 转向灯 / LED 侧转向灯', value: '●' },
          { label: '百万像素智慧投影大灯', value: '●' },
          { label: 'LED 后制动灯 / LED 后雾灯', value: '●' },
          { label: '1680 万色流水 LED 氛围灯', value: '●' },
          { label: '前后车门警示灯', value: '●' },
        ],
      },
      {
        group: '内部配置',
        items: [
          { label: '12.3 英寸液晶仪表盘', value: '●' },
          { label: '15.6 英寸中控屏', value: '●' },
          { label: '16 英寸副驾屏', value: '●' },
          { label: 'AR-HUD 抬头显示', value: '●' },
          { label: 'DMS 人脸识别', value: '●' },
          { label: 'CMS 乘员检测', value: '●' },
          { label: '高清行车记录仪', value: '●' },
          { label: '6.58 英寸后排双控制屏', value: '●' },
          { label: '隐私巨幕（含投影仪）＋ 后排智能交互系统', value: '尊享版及行政星辉款 ○（幕布滑轨可伸缩，选配后音响升级至 43 扬声器）｜ 增程星耀行政 ●' },
          { label: '智能星空顶', value: '○（选配后音响升级至 43 扬声器）' },
          { label: '声学系统', value: 'HUAWEI SOUND® ULTIMATE 华为悦彰音响 非凡系列' },
          { label: '音响布局', value: '尊享版 7.5.4 ｜ 行政版 7.5.10' },
          { label: '发声单元', value: '尊享版 ●（35 个车内扬声器）｜ 行政版 ●（43 个车内扬声器）' },
          { label: '星环散射体', value: '●' },
          { label: '功放功率（W）', value: '尊享版 2460 ｜ 行政版 2920' },
          { label: '四阵列麦克风 × 4', value: '●' },
          { label: '独立音区', value: '●' },
          { label: '怀挡式换挡杆', value: '●' },
          { label: '多功能方向盘 ＋ 方向盘脱手感应 HOD', value: '●' },
          { label: '电动方向盘可调', value: '●（上下、前后）' },
          { label: '方向盘加热', value: '●' },
          { label: '全四区独立空调', value: '●' },
          { label: 'AQS 空气质量自动控制 ＋ 内外 PM2.5 监测', value: '●' },
          { label: '负离子发生器', value: '●（前后双发生器）' },
          { label: 'CN95+ 活性炭高效空气滤芯', value: '●' },
          { label: '香氛系统', value: '●（出厂标配 3 款香氛，使用完需单独购买）' },
          { label: '可吸附降解材料空气净化系统', value: '●' },
        ],
      },
      {
        group: '座椅配置',
        items: [
          { label: '座椅材质', value: '全粒面半苯胺真皮（座椅正面）' },
          { label: '前排主驾调节', value: '●（18 向电动调节）' },
          { label: '前排副驾调节', value: '●（14 向电动调节，支持对折）' },
          { label: '后排双零重力座椅', value: '尊享版 ● ｜ 行政版 ●（支持 ActiveSafe 主动安全功能）' },
          { label: '后排双零重力座椅调节', value: '尊享版 ●（16 向电动调节）｜ 行政版 ●（20 向电动调节）' },
          { label: '座椅通风', value: '●（主副驾：靠背、坐垫）●（后排双零重力座椅：靠背、坐垫）' },
          { label: '座椅加热', value: '尊享版 ●（主副驾：靠背、坐垫）●（后排零重力座椅环抱式加热：靠背、坐垫、中央扶手（中间靠背反面）、门板）｜ 行政版 ●（主副驾：靠背、坐垫）●（后排零重力座椅环抱式加热：靠背、坐垫、腿托、中央扶手、门板）' },
          { label: '座椅按摩', value: '尊享版 ●（主驾：靠背、坐垫）●（副驾：靠背）●（后排零重力座椅：靠背、坐垫）｜ 行政版 ●（主驾：靠背、坐垫）●（副驾：靠背）●（后排零重力座椅：靠背、坐垫、腿托）' },
          { label: '主动侧翼支撑', value: '尊享版 ●（主驾）｜ 行政版 ●（主驾、后排双零重力座椅）' },
          { label: '主驾/副驾座椅记忆 ＋ 舒适性记忆功能', value: '●' },
          { label: '航空小桌板', value: '尊享版 – ｜ 行政版 ●（后排左右各一，收纳于后排中央扶手）' },
          { label: '魔吸车载接口（HUAWEI MagLink）', value: '●' },
        ],
      },
      {
        group: '便捷体验',
        items: [
          { label: '手机无线充电', value: '● 前 2 后 2 共计 4 个 50 W 快充' },
          { label: '有线充电', value: '● 前 2 后 2 共计 4 个 66 W TypeC 快充' },
          { label: '舱内数据接口', value: '1 个 DVR TF 卡接口 ＋ 1 个 USB 2.0 接口' },
          { label: '12 V 车载电源', value: '●（2 个：扶手箱 × 1，后备箱 × 1）' },
          { label: '车载卫星导航', value: '●' },
          { label: '移动通信', value: '●（双卡双待高速通信）' },
          { label: '卫星通信', value: '●' },
          { label: '星闪实体钥匙', value: '●（1 个）' },
          { label: 'NFC 卡片钥匙', value: '●（2 个）' },
          { label: '手机蓝牙 / UWB / 星闪钥匙', value: '●' },
          { label: '手表蓝牙 / UWB / 星闪钥匙', value: '●' },
          { label: '营地供电模式（V2L）', value: '●（反向输出 220 V 交流电，最大功率 6 kW）' },
          { label: '救援供电模式（V2V）', value: '●（通过专用 V2V 连接线给另外一台电动车充电，最大支持 6 kW）' },
          { label: '充电桩', value: '○（非标配，需单独购买 7 kW 交流充电桩）' },
          { label: 'ETC', value: '○' },
        ],
      },
      {
        group: '配置与价格',
        items: [
          { label: '纯电 星辉尊享版', value: '728,000 元 ｜ EV / 5 座 ｜ 双电机四驱 ｜ 华为悦彰 非凡系列 35 扬 ｜ CLTC 纯电续航 670 km' },
          { label: '增程 星辉尊享版', value: '728,000 元 ｜ EVR / 5 座 ｜ 双电机四驱 ｜ 华为悦彰 非凡系列 35 扬 ｜ CLTC 纯电续航 400 km ｜ CLTC 综合续航 1333 km' },
          { label: '增程 星耀尊享版', value: '808,000 元 ｜ EVR / 5 座 ｜ 三电机四驱 ｜ 华为悦彰 非凡系列 35 扬 ｜ CLTC 纯电续航 365 km ｜ CLTC 综合续航 1200 km' },
          { label: '纯电 星辉行政版', value: '838,000 元 ｜ EV / 4 座 ｜ 双电机四驱 ｜ 华为悦彰 非凡系列 43 扬 ｜ CLTC 纯电续航 650 km' },
          { label: '增程 星辉行政版', value: '838,000 元 ｜ EVR / 4 座 ｜ 双电机四驱 ｜ 华为悦彰 非凡系列 43 扬 ｜ CLTC 纯电续航 400 km ｜ CLTC 综合续航 1333 km' },
          { label: '增程 星耀行政版', value: '1,018,000 元 ｜ EVR / 4 座 ｜ 三电机四驱 ｜ 华为悦彰 非凡系列 43 扬 ｜ CLTC 纯电续航 340 km ｜ CLTC 综合续航 1155 km' },
        ],
      },
    ],
    priceInfo: {
      min: 728000,
      max: 1018000,
      unit: '元',
      note: '全国建议零售价，共 6 款配置（纯电 2 款 / 增程 4 款）',
    },
    scenarios: ['高端商务接待', '政企行政用车', '长途跨城出行', '旗舰智能驾驶体验'],
    cover: `${IMG_BASE}/zunjie-s800-1.jpg`,
    images: [1, 2, 3, 4, 5].map((i) => `${IMG_BASE}/zunjie-s800-${i}.jpg`),
    sortOrder: 102,
  },

  // ============================================================
  // 三、EHV 增程版（PPT 第 15-16 页；名称照录 PPT 原文「EHV增程版」）
  // ============================================================
  {
    name: 'EHV 增程版',
    slug: 'ehv-extended-range',
    description:
      'EHV 增程版是鸿蒙智行旗下大型七座 MPV（增程动力），车长 5359 mm、轴距 3250 mm，搭载华为乾崑智驾全域冗余安全设计、华为智擎双电机四驱与双腔空气悬挂，兼顾商务接待与家庭多人出行。',
    features: [
      { title: '乾崑智驾 ADS', detail: '全系标配华为乾崑智驾® ADS 高阶版；Max+ 及以上配备感知/转向/制动/通信/供电/计算/交互/定位全域冗余安全设计' },
      { title: '华为智擎双电机四驱', detail: '后同步 200 kW + 前异步 150 kW，配合双腔空气悬挂与主动后轮转向' },
      { title: '尊享座舱', detail: '全系三联屏（仪表 12.3 英寸＋中控/副屏 17.2 英寸），Ultra+ 搭载华为悦彰非凡系列 35 扬' },
      { title: '超大七座空间', detail: '5359 × 2009 × 1859 mm 车身（Max 车高 1879 mm），轴距 3250 mm，七座布局' },
    ],
    // 以下为智界 V9 官方《参数配置表》内容（来源 hima.auto/zhijie/v9/configuration/）
    // 四款车型顺序：Max / Max+ / Ultra / Ultra+；某项未标注版本者表示四款一致
    // 标记说明：● 有该项配置　○ 该项选装　– 无该项配置
    specs: [
      {
        group: '基本信息',
        items: [
          { label: '配置版本', value: 'Max ｜ Max+ ｜ Ultra ｜ Ultra+（以下各项未标注版本者，表示四款车型一致）' },
          { label: '配置标记', value: '● 有该项配置　○ 该项选装　– 无该项配置' },
          { label: '建议零售价', value: 'Max 389,800 元 ｜ Max+ 429,800 元 ｜ Ultra 459,800 元 ｜ Ultra+ 519,800 元' },
          { label: '能源类型', value: 'EVR（增程式混动）' },
          { label: '外观颜色', value: '● 鎏金黑、雪域白、深海蓝　○ 辉光紫' },
          { label: '内饰颜色', value: '● 韶华杏　● 赤茶橘　○ 绒霞紫' },
        ],
      },
      {
        group: '基本参数',
        items: [
          { label: '长 × 宽 × 高（mm）', value: 'Max 5359 × 2009 × 1879 ｜ Max+/Ultra/Ultra+ 5359 × 2009 × 1859' },
          { label: '轴距（mm）', value: '3250' },
          { label: '整备质量（kg）', value: 'Max 2790 ｜ Max+ 2870 ｜ Ultra/Ultra+ 2940' },
          { label: '座位数（个）', value: '7（2 + 2 + 3）' },
        ],
      },
      {
        group: '动力系统',
        items: [
          { label: '驱动形式', value: 'Max 单电机后驱 ｜ Max+/Ultra/Ultra+ 双电机四驱' },
          { label: '0-100 km/h 加速时间（s）', value: 'Max 9.3 ｜ Max+/Ultra/Ultra+ 5.9' },
          { label: '电池容量（kWh）', value: '53.4' },
          { label: '电池类型', value: '三元锂电池' },
          { label: 'CLTC 纯电续航里程（km）', value: 'Max 305 ｜ Max+/Ultra/Ultra+ 285' },
          { label: 'CLTC 综合工况续航里程（满电，km）', value: 'Max 1320 ｜ Max+/Ultra/Ultra+ 1230' },
          { label: '电池技术平台', value: '华为巨鲸电池平台' },
          { label: '电机类型', value: 'Max 后永磁同步 ｜ Max+/Ultra/Ultra+ 后永磁同步 ＋ 前交流异步' },
          { label: '前电机最大功率（kW）', value: 'Max – ｜ Max+/Ultra/Ultra+ 155' },
          { label: '后电机最大功率（kW）', value: '227' },
          { label: '快充充电时长（20%-80%）', value: '15 min' },
          { label: '增程器', value: '1.5T 四缸增程器' },
          { label: '燃油标号', value: '92# 及以上' },
          { label: '油箱容积（L）', value: '60 L，高压油箱' },
        ],
      },
      {
        group: '智能座舱',
        items: [
          { label: '鸿蒙系统', value: '●' },
          { label: '12.3 英寸仪表屏', value: '●' },
          { label: '17.2 英寸中控屏', value: '●' },
          { label: '17.2 英寸副驾屏', value: '●' },
          { label: 'W-HUD 抬头显示', value: 'Max – ｜ Max+/Ultra/Ultra+ ●' },
          { label: '21.4 英寸后排娱乐屏', value: 'Max ○ ｜ Max+/Ultra/Ultra+ ●' },
          { label: 'MagLink MINI LCD 控制屏', value: '●' },
          { label: '高清行车记录仪', value: '●' },
          { label: 'DMS 人脸识别', value: '●' },
          { label: 'CMS 乘员检测', value: 'Max ●（前排）＋○（后排）｜ Max+/Ultra/Ultra+ ●（前排 + 后排）' },
          { label: '声学系统', value: 'Max/Max+/Ultra 华为悦彰 卓越系列 HUAWEI SOUND® SUPERIOR ｜ Ultra+ 华为悦彰 非凡系列 HUAWEI SOUND® ULTIMATE' },
          { label: '音响布局', value: 'Max/Max+/Ultra 7.3.4 ｜ Ultra+ 9.3.8' },
          { label: '发声单元', value: 'Max/Max+/Ultra ● 25 个车内扬声器 ｜ Ultra+ ● 35 个车内扬声器' },
          { label: '星环散射体', value: '●' },
          { label: '功放功率', value: 'Max/Max+/Ultra 2080 W ｜ Ultra+ 2920 W' },
          { label: '车内麦克风', value: '● 6 个' },
          { label: '车外麦克风', value: '● 6 个' },
        ],
      },
      {
        group: '辅助驾驶 · 配置',
        items: [
          { label: '辅助驾驶系统', value: '华为乾崑智驾® ADS 高阶版' },
          { label: '激光雷达', value: '● 1 个 896 线双光路图像级激光雷达 ＋ 3 个高精度固态激光雷达' },
          { label: '毫米波雷达（个）', value: '5 个 4D 毫米波雷达（含 1 套分布式毫米波雷达）' },
          { label: '超声波雷达（个）', value: '12' },
          { label: '高感知摄像头（个）', value: '前视 × 2 ＋ 侧视 × 4 ＋ 环视 × 4 ＋ 后视 × 1' },
          { label: '倒车摄像头电动清洗', value: '●' },
          { label: '高精度定位', value: 'Max – ｜ Max+/Ultra/Ultra+ ●' },
          { label: '感知冗余系统', value: 'Max – ｜ Max+/Ultra/Ultra+ ●' },
          { label: '转向冗余系统', value: 'Max – ｜ Max+/Ultra/Ultra+ ●' },
          { label: '制动冗余系统', value: 'Max – ｜ Max+/Ultra/Ultra+ ●' },
          { label: '通信冗余系统', value: 'Max – ｜ Max+/Ultra/Ultra+ ●' },
          { label: '供电冗余系统', value: 'Max – ｜ Max+/Ultra/Ultra+ ●' },
          { label: '计算冗余系统', value: 'Max – ｜ Max+/Ultra/Ultra+ ●' },
          { label: '交互冗余系统', value: 'Max – ｜ Max+/Ultra/Ultra+ ●' },
          { label: '定位冗余系统', value: 'Max – ｜ Max+/Ultra/Ultra+ ●' },
        ],
      },
      {
        group: '辅助驾驶 · 主动安全',
        items: [
          { label: '盲区监测预警（BSD）', value: '●' },
          { label: '开门预警（DOW）', value: '●' },
          { label: '前向碰撞预警（FCW）', value: '●' },
          { label: '自动紧急制动（AEB）', value: '●' },
          { label: '后向横穿碰撞预警（RCTA）', value: '●' },
          { label: '后向横穿碰撞制动（RCTB）', value: '●' },
          { label: '前向横穿碰撞预警（FCTA）', value: '●' },
          { label: '前向横穿碰撞制动（FCTB）', value: '●' },
          { label: '后向碰撞预警（RCW）', value: '●' },
          { label: '后向自动紧急制动（RAEB）', value: '●' },
          { label: '低速自动紧急制动（LAEB）', value: '●' },
          { label: '车道偏离预警（LDW）', value: '●' },
          { label: '车道保持辅助（LKA）', value: '●' },
          { label: '紧急车道保持辅助（ELKA）', value: '●' },
          { label: '交通标志识别（TSR）', value: '●' },
          { label: '超速告警（TSA）', value: '●' },
          { label: '交通信号灯识别（TLR）', value: '●' },
          { label: '侧向障碍物防碰撞（LOCP）', value: '●' },
          { label: '前向异形障碍物自动紧急制动（GAEB）', value: '●' },
          { label: '后向异形障碍物自动紧急制动（GRAEB）', value: '●' },
          { label: '路面自适应 AEB', value: '●' },
          { label: '防误踩加速踏板', value: '●' },
          { label: '紧急转向辅助（ESA）', value: '●' },
          { label: '增强型自动紧急转向（eAES）', value: '○' },
        ],
      },
      {
        group: '辅助驾驶 · 泊车',
        items: [
          { label: '360° 全景环视（AVM）', value: '●' },
          { label: '透明底盘', value: '●' },
          { label: '泊车辅助（APA）', value: '●' },
          { label: '遥控泊车辅助（RPA）', value: '● 遥控泊入/泊出辅助（支持垂直、平行、斜列车位）＋遥控直行辅助＋离车泊入辅助' },
          { label: '循迹倒车辅助（RA）', value: '●' },
          { label: '园区领航辅助（Campus NCA）', value: '○' },
        ],
      },
      {
        group: '辅助驾驶 · 巡航',
        items: [
          { label: '自适应巡航辅助（ACC）', value: '●' },
          { label: '高速车道巡航辅助（Highway LCC）', value: '●' },
          { label: '高速领航辅助（Highway NCA）', value: '●' },
          { label: '城区车道巡航辅助（City LCC）', value: '●' },
          { label: '城区车道巡航辅助增强（City LCC PLUS）', value: '○' },
          { label: '城区领航辅助（City NCA）', value: '○' },
          { label: '车位到车位领航辅助', value: '○' },
        ],
      },
      {
        group: '辅助驾驶 · 其他',
        items: [{ label: '哨兵模式', value: '●' }],
      },
      {
        group: '底盘系统',
        items: [
          { label: '前悬架', value: '双叉臂式前独立悬架' },
          { label: '后悬架', value: '后 H 臂多连杆悬架' },
          { label: '空气悬架', value: 'Max – ｜ Max+/Ultra/Ultra+ ●（双腔）' },
          { label: '连续可变阻尼减振器', value: '●' },
          { label: '车身高度调节范围（mm）', value: 'Max – ｜ Max+/Ultra/Ultra+ 100' },
          { label: '车身高度自动随速调节', value: 'Max – ｜ Max+/Ultra/Ultra+ ●' },
          { label: '预瞄', value: '●' },
          { label: '前后通风盘式制动器', value: '●' },
          { label: '电子驻车制动', value: '●' },
          { label: 'R-EPS 随速可变电动助力转向', value: '●' },
          { label: '后轮转向', value: '●（±7°）' },
        ],
      },
      {
        group: '安全配置',
        items: [
          { label: '主驾主动式安全带', value: 'Max – ｜ Max+/Ultra/Ultra+ ●' },
          { label: '主副驾双预紧式安全带', value: '●' },
          { label: '儿童安全座椅接口', value: '二排、三排 ISOFIX 儿童安全座椅接口 × 4' },
          { label: '全车安全带未系提醒', value: '●' },
          { label: '一排正面气囊 × 2', value: '●' },
          { label: '一排侧面气囊 × 2', value: '●' },
          { label: '一排双腔远端气囊 × 1', value: '●' },
          { label: '二排气囊 × 2', value: 'Max/Max+/Ultra ●（侧面气囊）｜ Ultra+ ●（侧面气囊）＋○（选装尊享零重力座椅版本，含 2 个二排全维包裹安全气囊）' },
          { label: '二排坐垫气囊 × 2', value: '●' },
          { label: '三排侧面气囊 × 2', value: '●' },
          { label: '覆盖全车乘员的贯穿式侧气帘 × 2', value: '●' },
          { label: '碰撞解锁模块（CPM）', value: '●' },
        ],
      },
      {
        group: '外部配置',
        items: [
          { label: '轮毂轮胎', value: '● 19 英寸多辐星耀轮毂（255/55 R19 静音轮胎）　○ 20 英寸多辐星辉轮毂（255/50 R20 静音轮胎）' },
          { label: '主动进气格栅', value: '●' },
          { label: '前保格栅', value: 'Max/Max+/Ultra ● ｜ Ultra+ ● 繁星电镀格栅' },
          { label: '前排门', value: 'Max/Max+ ●（电弹门）｜ Ultra/Ultra+ ●（电弹 ＋ 电吸 ＋ 电动）' },
          { label: '后排电动滑移门', value: '●' },
          { label: '天窗', value: '前后全景双层静音隔热隐私玻璃 ＋ 电动遮阳帘' },
          { label: '全车玻璃', value: '前风挡双层静音镀银隔热玻璃、第一排双层静音玻璃、前排三角窗双层静音玻璃、第二排双层静音隔热隐私玻璃、第三排双层静音隔热隐私玻璃、后风挡隔热隐私玻璃' },
          { label: '智能隐私光幕玻璃（含二排和三排）', value: 'Max – ｜ Max+/Ultra ○ ｜ Ultra+ ●' },
          { label: '二排侧窗遮阳帘', value: '●' },
          { label: '前风挡除霜功能', value: '●' },
          { label: '后风挡除霜功能', value: '●' },
          { label: '尾门开启方式', value: '电动开启：尾门按钮、侧窗按钮、脚踢' },
          { label: '流媒体内后视镜', value: 'Max ○ ｜ Max+/Ultra/Ultra+ ●' },
          { label: '外后视镜电动折叠/加热/记忆功能', value: '●' },
        ],
      },
      {
        group: '内部配置',
        items: [
          { label: '顶棚', value: 'Max ● 织物 ｜ Max+/Ultra/Ultra+ ● 超纤麂皮绒' },
          { label: '前排水晶旋钮', value: '●' },
          { label: '美妆镜', value: 'Max ● 2 个（前排）＋○ 二排 2 个（后排娱乐屏套装）｜ Max+/Ultra/Ultra+ ● 4 个（前排 2 个，二排 2 个）' },
          { label: '怀挡式换挡杆', value: '●' },
          { label: '多功能方向盘', value: '●' },
          { label: '方向盘脱手感应 HOD', value: '●' },
          { label: '方向盘加热', value: '●' },
          { label: '方向盘可调', value: 'Max ● 手动（上下 ＋ 前后）｜ Max+/Ultra/Ultra+ ● 电动（上下 ＋ 前后）' },
          { label: '自动三温区空调', value: '●' },
          { label: 'AQS 空气质量自动控制', value: '●' },
          { label: 'PM2.5 监测', value: '●' },
          { label: '前/后双负离子发生器', value: '●' },
          { label: 'MOFs 可吸附降解材料', value: '●' },
          { label: 'UVC 紫外线杀菌模块', value: '●' },
          { label: 'CN95 抗菌抑菌滤芯', value: '●' },
          { label: '车载制氧系统（含二氧化碳检测）', value: 'Max – ｜ Max+/Ultra ○ ｜ Ultra+ ●' },
          { label: '车载恒冷智能大冰箱', value: 'Max ○ ｜ Max+/Ultra/Ultra+ ●' },
        ],
      },
      {
        group: '灯光配置',
        items: [
          { label: '自适应近光灯（AFS）', value: '●' },
          { label: '自适应远近光切换（HMA）', value: '●' },
          { label: 'LED 转向灯', value: '●' },
          { label: '百万像素智慧投影大灯', value: 'Max/Max+/Ultra – ｜ Ultra+ ●' },
          { label: '智能交互式侧门光毯', value: 'Max/Max+/Ultra – ｜ Ultra+ ●' },
          { label: '前门迎宾灯', value: '●' },
          { label: 'ADS 灯', value: '●' },
          { label: 'LED 后制动灯', value: '●' },
          { label: 'LED 后雾灯', value: '●' },
          { label: '1680 万色流水 LED 氛围灯', value: '●' },
        ],
      },
      {
        group: '座椅配置',
        items: [
          { label: '座椅面料', value: 'Max/Max+ 一排/二排全粒面 Nappa 头层真皮 ｜ Ultra/Ultra+ 一排/二排/三排全粒面 Nappa 头层真皮' },
          { label: '主/副驾座椅调节', value: '●（12 向电动调节）' },
          { label: '主/副驾座椅靠背小桌板', value: '●' },
          { label: '副驾位后排可调节按键', value: '●（6 向电动调节）' },
          { label: '二排双零重力座椅（含碰撞时座椅被动回位）', value: '●' },
          { label: '二排旋转双零重力座椅', value: 'Max/Max+ – ｜ Ultra/Ultra+ ●（含 HySoft 超软丝棉 ＋ 半苯胺真皮扶手 ＋ 石墨烯加热（扶手/脚托/足底）＋ 主动侧翼支撑 ＋ 碰撞前座椅主动回位）' },
          { label: '二排尊享双零重力座椅', value: 'Max/Max+/Ultra – ｜ Ultra+ ○（全维包裹安全气囊）' },
          { label: '二排右侧超长舒躺模式', value: '●' },
          { label: '三排座椅（含碰撞前座椅主动回位）', value: '可前后电动调节，靠背角度电动调节' },
          { label: '座椅通风', value: '●（前排 ＋ 二排）' },
          { label: '座椅加热', value: 'Max ●（前排 ＋ 二排）｜ Max+/Ultra/Ultra+ ●（前排 ＋ 二排 ＋ 三排）' },
          { label: '前排座椅按摩', value: '●' },
          { label: '二排座椅机械按摩', value: '●' },
          { label: '主驾/副驾座椅记忆功能', value: '●' },
        ],
      },
      {
        group: '便捷体验',
        items: [
          { label: '手机无线充电', value: '● 前排 2 个　二排 2 个　共计 4 个 50 W 快充' },
          { label: '有线充电', value: '● 前排 1 个 100 W　二排 2 个 100 W　三排 2 个 27 W　共计 5 个 Type-C 快充' },
          { label: '舱内数据接口', value: '1 个 DVR USB 接口 ＋ 1 个 USB 2.0 接口' },
          { label: '12 V 车载电源', value: '● 后备箱 1 个' },
          { label: '220 V 电源', value: '● 后备箱 1 个' },
          { label: '车载卫星导航', value: '●' },
          { label: '移动通信', value: '●（双卡双待高速通信）' },
          { label: '星闪实体钥匙', value: '●（1 个）' },
          { label: 'NFC 卡片钥匙', value: '●（1 个）' },
          { label: '机械钥匙', value: '●（1 个）' },
          { label: '手机蓝牙钥匙功能', value: '●' },
          { label: '手机星闪钥匙功能', value: '●' },
          { label: '手表蓝牙钥匙功能', value: '●' },
          { label: '手表星闪钥匙功能', value: '●' },
          { label: '后备箱轻松载物（空悬降低）', value: 'Max – ｜ Max+/Ultra/Ultra+ ●' },
          { label: 'NFC 碰一碰', value: 'Max ● 2 处 ｜ Max+/Ultra/Ultra+ ● 6 处' },
          { label: '磁吸拓展点位', value: '● 3 处' },
          { label: '营地供电模式（V2L）', value: '●' },
          { label: '救援供电模式（V2V）', value: '●' },
          { label: '充电桩', value: '○' },
          { label: 'ETC', value: '○' },
        ],
      },
      {
        group: '配置与价格',
        items: [
          { label: 'To B 标准版', value: '待发布 ｜ 37 度小电池' },
          { label: 'Max', value: '38.98 万元 ｜ 896 线双光路图像级激光雷达 ｜ 华为途灵平台＋主动后轮转向 ｜ 二排双零重力座椅＋机械按摩' },
          { label: 'Max+', value: '42.98 万元 ｜ 华为乾崑智驾全域冗余安全设计 ｜ 华为智擎双电机四驱＋双腔空悬 ｜ 吸顶屏＋智能恒冷冰箱＋HUD' },
          { label: 'Ultra', value: '45.98 万元 ｜ 华为乾崑智驾全域冗余安全设计 ｜ 旋转零重力座椅＋前排智慧电动门 ｜ 二排座椅主动回位＋主动侧翼支撑＋石墨烯加热' },
          { label: 'Ultra+', value: '51.98 万元 ｜ 华为乾崑智驾全域冗余安全设计 ｜ 华为悦彰非凡系列 35 扬 ｜ 百万像素智慧投影大灯＋智能交互式侧门光毯' },
        ],
      },
    ],
    priceInfo: {
      min: 389800,
      max: 519800,
      unit: '元',
      note: '价格区间 38.98 万 - 51.98 万元，其中 To B 标准版待发布',
    },
    scenarios: ['高端商务接待', '多人口家庭出行', '政企公务用车', '长途商务差旅'],
    cover: `${IMG_BASE}/ehv-extended-range-1.jpg`,
    images: [1, 2, 3, 4, 5].map((i) => `${IMG_BASE}/ehv-extended-range-${i}.jpg`),
    sortOrder: 103,
  },
];

async function main() {
  console.log('🌱 写入鸿蒙智行专区数据...');

  for (const p of himaProducts) {
    const data = {
      name: p.name,
      slug: p.slug,
      category: CAT,
      description: p.description,
      features: JSON.stringify(p.features),
      specs: JSON.stringify(p.specs),
      priceInfo: JSON.stringify({ ...p.priceInfo, updatedAt: PRICE_DATE }),
      scenarios: JSON.stringify(p.scenarios),
      coverImage: p.cover,
      images: JSON.stringify(p.images),
      sortOrder: p.sortOrder,
      status: 'active',
      publishedAt: new Date(PRICE_DATE),
    };
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: data,
      create: data,
    });
    console.log(`  ✓ 车型: ${p.name} (${p.slug})`);
  }

  // 专区页配置：Hero（后台可改，前台有兜底）
  const heroContent = JSON.stringify({
    title: '鸿蒙智行',
    subtitle:
      '鸿蒙智行全系车型 —— 尚界 H5 · 尊界 S800 · EHV 增程版，智能驾驶与豪华出行的全新选择',
    visualImage: '/images/hero/hero_hima.jpg',
    visualAlt: '鸿蒙智行 MPV 七座空间与落日意境',
  });
  await prisma.pageConfig.upsert({
    where: { page_section: { page: 'hima', section: 'hero' } },
    update: { content: heroContent },
    create: { page: 'hima', section: 'hero', content: heroContent },
  });

  // 专区页 SEO 配置（与 products/solutions 同结构，供后台维护）
  const seoContent = JSON.stringify({
    title: '鸿蒙智行专区',
    description:
      '鸿蒙智行全系车型专区：尚界 H5、尊界 S800、EHV 增程版，含建议零售价、核心配置与技术参数。',
    keywords: ['鸿蒙智行', '尚界 H5', '尊界 S800', 'EHV 增程版', '智能驾驶', '新能源车型'],
  });
  await prisma.pageConfig.upsert({
    where: { page_section: { page: 'hima', section: 'seo' } },
    update: { content: seoContent },
    create: { page: 'hima', section: 'seo', content: seoContent },
  });
  console.log('  ✓ 页面配置: hima/hero, hima/seo');
  console.log('🎉 鸿蒙智行专区数据写入完成！');
}

main()
  .catch((e) => {
    console.error('❌ 写入失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
