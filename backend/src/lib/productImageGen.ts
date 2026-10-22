/**
 * 产品图片自动生成模块（本地 SVG 渲染）
 *
 * 根据产品的分类 / 名称 / 场景，程序化生成三视角产品示意图：
 *   {slug}-1.svg 正面图（封面）  {slug}-2.svg 侧面图  {slug}-3.svg 细节图
 * 落盘至 backend/uploads/products/，数据库存储本地路径。
 *
 * 说明：在线 text_to_image API 为异步生成且产物会过期回退占位图，不可用；
 * 本地 SVG 方案立即可用、永不失效、矢量清晰、全站风格统一。
 */
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'products');

export interface ProductLike {
  slug: string;
  name: string;
  category: string;
}

// ==================== 调色板 ====================
const C = {
  bgFrom: '#F8FAFC',
  bgTo: '#E8EEF6',
  chassis: '#2E3A4A',
  chassisLight: '#46566B',
  chassisDark: '#1F2937',
  panel: '#38455680',
  brand: '#2563EB',
  brandLight: '#60A5FA',
  accent: '#38BDF8',
  led: '#22C55E',
  ledAmber: '#F59E0B',
  screen: '#0F172A',
  screenGlow: '#1D4ED8',
  line: '#64748B',
  text: '#334155',
  white: '#FFFFFF',
};

const VIEW_LABELS = ['正面视图', '侧面视图', '细节视图'] as const;

// ==================== 画布基础 ====================
const W = 1200;
const H = 900;

function frame(inner: string, productName: string, category: string, viewIdx: number): string {
  // 产品名截断，避免溢出
  const short = productName.length > 34 ? productName.slice(0, 33) + '…' : productName;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.bgFrom}"/><stop offset="1" stop-color="${C.bgTo}"/>
    </linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.chassisLight}"/><stop offset="0.5" stop-color="${C.chassis}"/><stop offset="1" stop-color="${C.chassisDark}"/>
    </linearGradient>
    <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0B1220"/><stop offset="1" stop-color="#12233F"/>
    </linearGradient>
    <linearGradient id="brandgrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${C.brand}"/><stop offset="1" stop-color="${C.accent}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${C.brandLight}" stop-opacity="0.35"/><stop offset="1" stop-color="${C.brandLight}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.6" fill="${C.brand}" opacity="0.10"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  <circle cx="1050" cy="130" r="230" fill="url(#glow)"/>
  <circle cx="140" cy="790" r="200" fill="url(#glow)"/>
  ${inner}
  <!-- 底部信息条 -->
  <rect x="0" y="${H - 96}" width="${W}" height="96" fill="${C.white}" opacity="0.86"/>
  <rect x="0" y="${H - 96}" width="${W}" height="3" fill="url(#brandgrad)"/>
  <text x="60" y="${H - 34}" font-size="34" font-weight="600" fill="${C.text}">${short}</text>
  <g transform="translate(${W - 60}, ${H - 66})">
    <rect x="-260" y="0" width="260" height="42" rx="21" fill="none" stroke="${C.brand}" stroke-width="2"/>
    <text x="-130" y="29" font-size="22" fill="${C.brand}" text-anchor="middle">${category}</text>
  </g>
  <!-- 视角标签 -->
  <g transform="translate(${W - 60}, 60)">
    <rect x="-150" y="-28" width="150" height="44" rx="8" fill="${C.chassis}" opacity="0.92"/>
    <text x="-75" y="2" font-size="22" fill="${C.white}" text-anchor="middle">${VIEW_LABELS[viewIdx]}</text>
  </g>
</svg>`;
}

// ==================== 设备绘制（正视图） ====================

/** 机架式设备（交换机/服务器/NVR），slots=端口或盘位数量，kind 决定前面板样式 */
function rackUnit(kind: 'switch' | 'poe' | 'server' | 'ai' | 'nvr'): string {
  const x = 130, y = 320, w = 940, h = kind === 'ai' ? 240 : 180;
  let front = '';
  if (kind === 'switch' || kind === 'poe') {
    // 电口阵列（两排小方块）
    const ports = kind === 'poe' ? 24 : 12;
    for (let i = 0; i < ports; i++) {
      const px = x + 40 + (i % (ports / 2)) * 44;
      const py = y + 55 + Math.floor(i / (ports / 2)) * 56;
      front += `<rect x="${px}" y="${py}" width="34" height="40" rx="3" fill="${C.chassisDark}" stroke="${C.line}" stroke-width="1.2"/>
        <rect x="${px + 5}" y="${py + 6}" width="24" height="10" rx="2" fill="${C.accent}" opacity="0.5"/>
        <circle cx="${px + 8}" cy="${py + 33}" r="2.6" fill="${C.led}"/>`;
    }
    // SFP+ 上行口
    const sx = x + w - 190;
    for (let i = 0; i < 4; i++) {
      front += `<rect x="${sx + (i % 2) * 70}" y="${y + 62 + Math.floor(i / 2) * 62}" width="58" height="46" rx="4" fill="${C.chassisDark}" stroke="${C.line}" stroke-width="1.4"/>
        <rect x="${sx + (i % 2) * 70 + 8}" y="${y + 72 + Math.floor(i / 2) * 62}" width="42" height="26" rx="2" fill="${C.brandLight}" opacity="0.35"/>`;
    }
  } else {
    // 服务器/NVR：硬盘托架阵列
    const bays = kind === 'nvr' ? 8 : 12;
    const bw = (w - 240) / bays;
    for (let i = 0; i < bays; i++) {
      const bx = x + 30 + i * bw;
      front += `<rect x="${bx}" y="${y + 40}" width="${bw - 10}" height="${h - 90}" rx="4" fill="${C.chassisDark}" stroke="${C.line}" stroke-width="1.2"/>
        <rect x="${bx + 8}" y="${y + 52}" width="${bw - 26}" height="8" rx="2" fill="${C.panel}"/>
        <circle cx="${bx + (bw - 10) / 2}" cy="${y + h - 66}" r="4" fill="${i % 4 === 0 ? C.ledAmber : C.led}"/>`;
    }
    // 右侧：电源与标识区
    front += `<rect x="${x + w - 170}" y="${y + 40}" width="140" height="${h - 90}" rx="6" fill="${C.chassisDark}"/>
      <circle cx="${x + w - 100}" cy="${y + 80}" r="14" fill="none" stroke="${C.brandLight}" stroke-width="3"/>
      <circle cx="${x + w - 100}" cy="${y + 80}" r="6" fill="${C.led}"/>
      <rect x="${x + w - 150}" y="${y + 115}" width="100" height="10" rx="5" fill="${C.panel}"/>
      <rect x="${x + w - 150}" y="${y + 135}" width="70" height="10" rx="5" fill="${C.panel}"/>`;
    if (kind === 'ai') {
      // GPU 算力条
      for (let i = 0; i < 6; i++) {
        front += `<rect x="${x + 40 + i * 60}" y="${y + h - 40}" width="44" height="16" rx="3" fill="${C.brand}" opacity="${0.4 + i * 0.1}"/>`;
      }
    }
  }
  return `<g>
    <ellipse cx="${W / 2}" cy="${y + h + 46}" rx="480" ry="26" fill="#0B1220" opacity="0.10"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="url(#metal)"/>
    <rect x="${x + 14}" y="${y + 12}" width="${w - 28}" height="${h - 24}" rx="9" fill="${C.chassis}" opacity="0.55"/>
    ${front}
    <rect x="${x}" y="${y}" width="${w}" height="10" rx="5" fill="${C.white}" opacity="0.12"/>
  </g>`;
}

/** 无线AP（圆形吸顶） */
function wifiAp(): string {
  const cx = W / 2, cy = 440;
  return `<g>
    <ellipse cx="${cx}" cy="${cy + 210}" rx="300" ry="22" fill="#0B1220" opacity="0.10"/>
    <circle cx="${cx}" cy="${cy}" r="200" fill="${C.white}" stroke="#D7E0EA" stroke-width="3"/>
    <circle cx="${cx}" cy="${cy}" r="160" fill="${C.bgFrom}" stroke="#E2E8F0" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="60" fill="none" stroke="${C.brand}" stroke-width="5" opacity="0.9"/>
    <circle cx="${cx}" cy="${cy}" r="60" fill="none" stroke="${C.brand}" stroke-width="5" opacity="0.25" stroke-dasharray="30 14"/>
    <circle cx="${cx}" cy="${cy}" r="12" fill="${C.led}"/>
    ${[0, 60, 120, 180, 240, 300].map((a) => {
      const rad = (a * Math.PI) / 180;
      return `<circle cx="${cx + Math.cos(rad) * 120}" cy="${cy + Math.sin(rad) * 120}" r="7" fill="${C.accent}" opacity="0.7"/>`;
    }).join('')}
  </g>`;
}

/** 防火墙/路由器（矮机箱 + 天线/网口） */
function gateway(hasAntenna: boolean): string {
  const x = 180, y = 360, w = 840, h = 170;
  let antenna = '';
  if (hasAntenna) {
    antenna = [-260, 0, 260].map((dx) => `<rect x="${x + w / 2 + dx - 8}" y="${y - 150}" width="16" height="160" rx="8" fill="${C.chassisDark}"/>
      <circle cx="${x + w / 2 + dx}" cy="${y - 152}" r="12" fill="${C.chassisDark}"/>`).join('');
  }
  let ports = '';
  for (let i = 0; i < 8; i++) {
    ports += `<rect x="${x + 50 + i * 56}" y="${y + 62}" width="42" height="48" rx="4" fill="${C.chassisDark}" stroke="${C.line}" stroke-width="1.2"/>
      <circle cx="${x + 60 + i * 56}" cy="${y + 100}" r="3" fill="${C.led}"/>`;
  }
  return `<g>
    <ellipse cx="${W / 2}" cy="${y + h + 40}" rx="440" ry="22" fill="#0B1220" opacity="0.10"/>
    ${antenna}
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="url(#metal)"/>
    ${ports}
    <rect x="${x + w - 220}" y="${y + 55}" width="170" height="66" rx="6" fill="${C.chassisDark}"/>
    <rect x="${x + w - 200}" y="${y + 75}" width="130" height="12" rx="6" fill="${C.brand}" opacity="0.85"/>
    <rect x="${x + w - 200}" y="${y + 95}" width="90" height="10" rx="5" fill="${C.panel}"/>
  </g>`;
}

/** 笔记本 / 台式主机 / 显示器（按产品名判断） */
function pcDevice(name: string): string {
  if (/matebook|笔记本/i.test(name)) {
    return `<g>
      <ellipse cx="${W / 2}" cy="640" rx="380" ry="20" fill="#0B1220" opacity="0.10"/>
      <g transform="translate(${W / 2}, 430)">
        <rect x="-250" y="-190" width="500" height="320" rx="16" fill="url(#metal)"/>
        <rect x="-228" y="-168" width="456" height="276" rx="8" fill="url(#screen)"/>
        <rect x="-228" y="-168" width="456" height="276" rx="8" fill="url(#brandgrad)" opacity="0.16"/>
        <circle cx="0" cy="-150" r="6" fill="${C.chassisDark}"/>
        <path d="M -300 130 L 300 130 L 340 190 L -340 190 Z" fill="${C.chassisLight}"/>
        <rect x="-60" y="140" width="120" height="14" rx="7" fill="${C.chassisDark}" opacity="0.6"/>
      </g>
    </g>`;
  }
  if (/mateview|显示器/i.test(name)) {
    return `<g>
      <ellipse cx="${W / 2}" cy="660" rx="320" ry="18" fill="#0B1220" opacity="0.10"/>
      <rect x="260" y="240" width="680" height="390" rx="14" fill="url(#metal)"/>
      <rect x="282" y="262" width="636" height="346" rx="8" fill="url(#screen)"/>
      <rect x="282" y="262" width="636" height="346" rx="8" fill="url(#brandgrad)" opacity="0.18"/>
      <rect x="560" y="630" width="80" height="52" fill="${C.chassis}"/>
      <rect x="480" y="678" width="240" height="16" rx="8" fill="${C.chassis}"/>
    </g>`;
  }
  // 台式主机
  return `<g>
    <ellipse cx="${W / 2}" cy="660" rx="280" ry="20" fill="#0B1220" opacity="0.10"/>
    <rect x="440" y="230" width="320" height="420" rx="14" fill="url(#metal)"/>
    <rect x="462" y="252" width="276" height="376" rx="8" fill="${C.chassis}" opacity="0.5"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="486" y="${280 + i * 40}" width="228" height="18" rx="4" fill="${C.chassisDark}"/>`).join('')}
    <circle cx="600" cy="592" r="13" fill="none" stroke="${C.brandLight}" stroke-width="3"/>
    <circle cx="600" cy="592" r="5" fill="${C.led}"/>
    <rect x="486" y="540" width="80" height="10" rx="5" fill="${C.panel}"/>
  </g>`;
}

/** 摄像机：筒机 / 球机 / NVR */
function cameraDevice(name: string): string {
  if (/球机|球/i.test(name)) {
    return `<g>
      <ellipse cx="${W / 2}" cy="640" rx="280" ry="20" fill="#0B1220" opacity="0.10"/>
      <rect x="${W / 2 - 60}" y="180" width="120" height="90" rx="10" fill="url(#metal)"/>
      <rect x="${W / 2 - 160}" y="260" width="320" height="46" rx="23" fill="${C.chassis}"/>
      <circle cx="${W / 2}" cy="430" r="140" fill="${C.white}" stroke="#D7E0EA" stroke-width="3"/>
      <circle cx="${W / 2}" cy="450" r="96" fill="${C.chassisDark}"/>
      <circle cx="${W / 2}" cy="450" r="56" fill="url(#screen)"/>
      <circle cx="${W / 2}" cy="450" r="26" fill="${C.brand}" opacity="0.85"/>
      <circle cx="${W / 2}" cy="450" r="10" fill="${C.accent}"/>
      <circle cx="${W / 2 + 34}" cy="416" r="6" fill="${C.led}"/>
    </g>`;
  }
  if (/nvr|录像机/i.test(name)) {
    return rackUnit('nvr');
  }
  // 筒机
  return `<g>
    <ellipse cx="${W / 2}" cy="600" rx="360" ry="20" fill="#0B1220" opacity="0.10"/>
    <rect x="300" y="330" width="600" height="190" rx="95" fill="url(#metal)"/>
    <rect x="330" y="300" width="420" height="30" rx="15" fill="${C.chassisDark}"/>
    <circle cx="890" cy="425" r="120" fill="${C.chassisDark}"/>
    <circle cx="890" cy="425" r="88" fill="url(#screen)"/>
    <circle cx="890" cy="425" r="44" fill="${C.brand}" opacity="0.9"/>
    <circle cx="890" cy="425" r="16" fill="${C.accent}"/>
    ${[0, 90, 180, 270].map((a) => {
      const rad = (a * Math.PI) / 180;
      return `<circle cx="${890 + Math.cos(rad) * 66}" cy="${425 + Math.sin(rad) * 66}" r="9" fill="${C.ledAmber}" opacity="0.85"/>`;
    }).join('')}
    <rect x="470" y="470" width="90" height="12" rx="6" fill="${C.brand}" opacity="0.8"/>
    <circle cx="360" cy="425" r="10" fill="${C.led}"/>
  </g>`;
}

/** 平板类设备（办公本/学习机/翻译机/学生平板/云班牌） */
function tabletDevice(name: string, landscape = true): string {
  const w = landscape ? 560 : 380;
  const h = landscape ? 400 : 540;
  const x = W / 2 - w / 2 - (landscape ? 60 : 0);
  const y = H / 2 - h / 2 - 20;
  let pen = '';
  if (/办公本|学习机|平板/i.test(name)) {
    pen = `<rect x="${x + w + 34}" y="${y + h - 240}" width="14" height="220" rx="7" fill="${C.chassisDark}" transform="rotate(6 ${x + w + 40} ${y + h})"/>`;
  }
  return `<g>
    <ellipse cx="${W / 2}" cy="${y + h + 34}" rx="${w / 2 + 60}" ry="18" fill="#0B1220" opacity="0.10"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="url(#metal)"/>
    <rect x="${x + 18}" y="${y + 18}" width="${w - 36}" height="${h - 36}" rx="8" fill="url(#screen)"/>
    <rect x="${x + 44}" y="${y + 52}" width="${w * 0.5}" height="20" rx="6" fill="${C.brandLight}" opacity="0.85"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="${x + 44}" y="${y + 96 + i * 36}" width="${w - 88 - i * 40}" height="14" rx="7" fill="${C.white}" opacity="0.28"/>`).join('')}
    <rect x="${x + 44}" y="${y + h - 92}" width="150" height="40" rx="20" fill="url(#brandgrad)"/>
    <circle cx="${x + w - 30}" cy="${y + 30}" r="7" fill="${C.led}"/>
    ${pen}
  </g>`;
}

/** 交互大屏（希沃平板/录播按大屏处理） */
function bigDisplay(): string {
  return `<g>
    <ellipse cx="${W / 2}" cy="650" rx="400" ry="20" fill="#0B1220" opacity="0.10"/>
    <rect x="180" y="200" width="840" height="420" rx="16" fill="url(#metal)"/>
    <rect x="206" y="226" width="788" height="368" rx="8" fill="url(#screen)"/>
    <rect x="206" y="226" width="788" height="368" rx="8" fill="url(#brandgrad)" opacity="0.12"/>
    <rect x="250" y="270" width="300" height="26" rx="8" fill="${C.brandLight}" opacity="0.9"/>
    ${[0, 1, 2].map((i) => `<rect x="250" y="${324 + i * 44}" width="${560 - i * 90}" height="18" rx="9" fill="${C.white}" opacity="0.26"/>`).join('')}
    <rect x="250" y="486" width="170" height="52" rx="26" fill="url(#brandgrad)"/>
    <rect x="448" y="486" width="170" height="52" rx="26" fill="none" stroke="${C.white}" stroke-width="2" opacity="0.5"/>
    <rect x="430" y="620" width="60" height="34" fill="${C.chassis}"/>
    <rect x="330" y="652" width="260" height="14" rx="7" fill="${C.chassis}"/>
    <circle cx="600" cy="214" r="5" fill="${C.led}"/>
  </g>`;
}

// ==================== 分类 → 正视图绘制 ====================
function frontView(p: ProductLike): string {
  const n = p.name;
  const cat = p.category;
  if (cat.includes('华为网络')) {
    if (/无线|AP|AirEngine/i.test(n)) return wifiAp();
    if (/防火墙|USG/i.test(n)) return gateway(false);
    if (/路由|AR\d/i.test(n)) return gateway(true);
    if (/PoE/i.test(n)) return rackUnit('poe');
    return rackUnit('switch');
  }
  if (cat.includes('服务器') || cat.includes('算力')) {
    return rackUnit(/Atlas|AI|训练|推理|昇腾/i.test(n) ? 'ai' : 'server');
  }
  if (cat.includes('电脑')) return pcDevice(n);
  if (cat.includes('海康')) return cameraDevice(n);
  if (cat.includes('科大讯飞')) {
    if (/智慧课堂/i.test(n)) return bigDisplay();
    return tabletDevice(n);
  }
  if (cat.includes('希沃')) {
    if (/云班牌/i.test(n)) return tabletDevice(n, false);
    if (/学习平板|学生平板/i.test(n)) return tabletDevice(n);
    return bigDisplay();
  }
  return rackUnit('server');
}

// ==================== 侧面/细节变体 ====================
function sideView(p: ProductLike): string {
  // 侧面：整体右移 + 水平压缩模拟侧视，加厚度侧板
  return `<g transform="translate(90 0) scale(0.86 1) skewY(-2)">
    ${frontView(p)}
  </g>
  <g opacity="0.9">
    <rect x="930" y="300" width="60" height="280" rx="10" fill="${C.chassisDark}"/>
    ${[0, 1, 2, 3, 4].map((i) => `<circle cx="960" cy="${330 + i * 52}" r="6" fill="${C.led}"/>`).join('')}
    <text x="960" y="620" font-size="20" fill="${C.line}" text-anchor="middle">侧面散热与接口</text>
  </g>`;
}

function detailView(p: ProductLike): string {
  // 细节：放大框展示局部（端口/镜头/屏幕区域）
  const cat = p.category;
  let zoom = '';
  if (cat.includes('海康') && !/nvr|录像机/i.test(p.name)) {
    zoom = `<circle cx="600" cy="400" r="210" fill="${C.chassisDark}"/>
      <circle cx="600" cy="400" r="160" fill="url(#screen)"/>
      <circle cx="600" cy="400" r="80" fill="${C.brand}" opacity="0.9"/>
      <circle cx="600" cy="400" r="30" fill="${C.accent}"/>
      ${[0, 60, 120, 180, 240, 300].map((a) => {
        const rad = (a * Math.PI) / 180;
        return `<circle cx="${600 + Math.cos(rad) * 120}" cy="${400 + Math.sin(rad) * 120}" r="14" fill="${C.ledAmber}"/>`;
      }).join('')}`;
  } else if (/MateBook|笔记本|平板|办公本|学习机|翻译机|班牌/i.test(p.name)) {
    zoom = `<rect x="330" y="250" width="540" height="330" rx="16" fill="url(#screen)"/>
      <rect x="330" y="250" width="540" height="330" rx="16" fill="url(#brandgrad)" opacity="0.15"/>
      <rect x="380" y="300" width="240" height="22" rx="6" fill="${C.brandLight}"/>
      ${[0, 1, 2].map((i) => `<rect x="380" y="${348 + i * 40}" width="${420 - i * 70}" height="14" rx="7" fill="${C.white}" opacity="0.3"/>`).join('')}
      <rect x="380" y="500" width="140" height="40" rx="20" fill="url(#brandgrad)"/>`;
  } else {
    // 端口/盘位细节
    let cells = '';
    for (let i = 0; i < 8; i++) {
      const cx = 330 + (i % 4) * 140;
      const cy = 270 + Math.floor(i / 4) * 150;
      cells += `<rect x="${cx}" y="${cy}" width="112" height="120" rx="8" fill="${C.chassisDark}" stroke="${C.line}" stroke-width="1.5"/>
        <rect x="${cx + 16}" y="${cy + 18}" width="80" height="34" rx="4" fill="${C.accent}" opacity="0.4"/>
        <circle cx="${cx + 26}" cy="${cy + 88}" r="7" fill="${C.led}"/>
        <circle cx="${cx + 50}" cy="${cy + 88}" r="7" fill="${C.ledAmber}"/>`;
    }
    zoom = `<rect x="280" y="220" width="640" height="470" rx="18" fill="${C.chassis}"/>${cells}`;
  }
  return `<g>
    <ellipse cx="${W / 2}" cy="720" rx="360" ry="18" fill="#0B1220" opacity="0.10"/>
    ${zoom}
    <g transform="translate(600 700)">
      <rect x="-190" y="-26" width="380" height="52" rx="26" fill="${C.white}" stroke="${C.brand}" stroke-width="2"/>
      <text x="0" y="9" font-size="24" fill="${C.brand}" text-anchor="middle">局部细节 · 接口与工艺</text>
    </g>
  </g>`;
}

// ==================== 对外接口 ====================
export interface GenResult {
  slug: string;
  coverImage: string;
  images: string[];
}

/** 判断产品图片是否需要（重新）生成：无封面或仍为外链/占位 */
export function needsGeneration(product: { coverImage?: string | null }): boolean {
  if (!product.coverImage) return true;
  return product.coverImage.startsWith('http');
}

/**
 * 为单个产品生成三视角 SVG 图片并落盘。
 * 返回本地路径（coverImage = 正面图，images = 三张全部）。
 */
export async function generateImagesForProduct(
  product: ProductLike,
  onProgress?: (msg: string) => void,
): Promise<GenResult> {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const views = [frontView, sideView, detailView];
  const localPaths: string[] = [];
  for (let i = 0; i < views.length; i++) {
    const svg = frame(views[i](product), product.name, product.category, i);
    const filename = `${product.slug}-${i + 1}.svg`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), svg, 'utf8');
    const local = `/uploads/products/${filename}`;
    localPaths.push(local);
    onProgress?.(`  [${product.slug}] ✓ ${VIEW_LABELS[i]} -> ${local}`);
  }
  return { slug: product.slug, coverImage: localPaths[0], images: localPaths };
}
