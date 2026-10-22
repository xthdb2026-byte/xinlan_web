import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { validatePasswordPolicy } from '../src/lib/passwordPolicy';

const prisma = new PrismaClient();

// bcrypt 计算强度（12 ≈ 单次哈希 250ms 级，兼顾安全与登录延迟）
const BCRYPT_ROUNDS = 12;

/**
 * 解析种子账号口令（安全治理）：
 * - 优先取环境变量（SEED_ADMIN_PASSWORD / SEED_EDITOR_PASSWORD），且必须通过统一密码策略；
 * - 未配置时生成一次性随机强口令并打印到控制台（仅此一次可见），杜绝弱口令默认值入库。
 */
function resolveSeedPassword(envKey: string, username: string): string {
  const fromEnv = process.env[envKey]?.trim();
  if (fromEnv) {
    const result = validatePasswordPolicy(fromEnv, username);
    if (!result.ok) {
      throw new Error(
        `[Seed] 环境变量 ${envKey} 未通过密码策略：${result.errors.join('；')}。请修改为符合策略的强口令后重试。`,
      );
    }
    return fromEnv;
  }
  // 生成 16 字节随机口令（base62 化，必含大小写+数字，再拼接特殊字符确保过策略）
  const raw = crypto.randomBytes(16).toString('base64url');
  const generated = `${raw.slice(0, 12)}@Xl9`;
  const check = validatePasswordPolicy(generated, username);
  if (!check.ok) throw new Error('[Seed] 随机口令生成异常，未通过密码策略');
  console.log(`  ⚠ 未配置 ${envKey}，已为 ${username} 生成随机强口令（请立即记录，仅本次显示）：${generated}`);
  return generated;
}

async function main() {
  console.log('🌱 开始填充测试数据...');

  // ==================== 用户 ====================
  const adminPlain = resolveSeedPassword('SEED_ADMIN_PASSWORD', 'admin');
  const editorPlain = resolveSeedPassword('SEED_EDITOR_PASSWORD', 'editor');
  const adminPassword = await bcrypt.hash(adminPlain, BCRYPT_ROUNDS);
  const editorPassword = await bcrypt.hash(editorPlain, BCRYPT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      role: 'admin',
    },
  });

  const editor = await prisma.user.upsert({
    where: { username: 'editor' },
    update: {},
    create: {
      username: 'editor',
      password: editorPassword,
      role: 'editor',
    },
  });

  console.log(`  ✓ 用户: ${admin.username} (${admin.role}), ${editor.username} (${editor.role})`);

  // ==================== 页面配置 ====================
  const homeHero = await prisma.pageConfig.upsert({
    where: { page_section: { page: 'home', section: 'hero' } },
    update: {},
    create: {
      page: 'home',
      section: 'hero',
      content: JSON.stringify({
        brandEn: 'XINLAN HENGCHENG',
        slogan: '外稳内动，恒久达成',
        intro:
          '湖南新蓝恒成信息技术有限公司，致力于提供安全可靠、技术创新的信息技术服务与解决方案。',
        ctaText: '了解更多',
        ctaLink: '/about',
        // 首页轮播（与其他栏目同规格：5 张 1920 宽高清图 + 按主题对应栏目链接）
        visualImages: [
          '/images/hero/hero_home.jpg',
          '/images/hero/hero_home_2.jpg',
          '/images/hero/hero_home_3.jpg',
          '/images/hero/hero_home_4.jpg',
          '/images/hero/hero_home_5.jpg',
        ],
        visualLinks: ['/products', '/solutions', '/about', '/products', '/contact'],
      }),
    },
  });

  const homeValues = await prisma.pageConfig.upsert({
    where: { page_section: { page: 'home', section: 'values' } },
    update: {},
    create: {
      page: 'home',
      section: 'values',
      content: JSON.stringify([
        { icon: 'shield', title: '安全可靠', subtitle: '全方位安全保障体系' },
        { icon: 'cpu', title: '技术创新', subtitle: '持续投入研发创新' },
        { icon: 'zap', title: '高效协同', subtitle: '敏捷协作高效交付' },
        { icon: 'heart', title: '客户至上', subtitle: '以客户价值为中心' },
      ]),
    },
  });

  const homeAboutEntry = await prisma.pageConfig.upsert({
    where: { page_section: { page: 'home', section: 'about_entry' } },
    update: {},
    create: {
      page: 'home',
      section: 'about_entry',
      content: JSON.stringify({
        title: '关于新蓝恒成',
        description:
          '湖南新蓝恒成信息技术有限公司成立于长沙，是一家专注于信息技术服务与解决方案的创新型企业。我们秉承"外稳内动，恒久达成"的理念，为客户提供优质的产品与服务。',
        image: '/images/mockup_reception.png',
        ctaText: '了解更多',
        ctaLink: '/about',
      }),
    },
  });

  console.log(`  ✓ 页面配置: ${homeHero.page}/${homeHero.section}, ${homeValues.section}, ${homeAboutEntry.section}`);

  // ==================== 各页 Hero 配置（全屏背景图） ====================
  const upsertPageHero = (page: string, content: Record<string, unknown>) =>
    prisma.pageConfig.upsert({
      where: { page_section: { page, section: 'hero' } },
      update: {},
      create: { page, section: 'hero', content: JSON.stringify(content) },
    });

  // 各页 Hero 轮播图（首图 + 4 张，均 ≥1920×1080，情景匹配）
  const heroImages = (page: string) => [
    `/images/hero/hero_${page}.jpg`,
    ...[2, 3, 4, 5].map((i) => `/images/hero/hero_${page}_${i}.jpg`),
  ];
  // 各图点击跳转链接：按图片主题映射到对应栏目页（与 visualImages 下标对齐）
  const heroLinks: Record<string, string[]> = {
    about: ['/about', '/about', '/about', '/about', '/about'],
    products: ['/products', '/products', '/solutions', '/products', '/products'],
    solutions: ['/solutions', '/solutions', '/solutions', '/solutions', '/contact'],
    news: ['/news', '/news', '/news', '/news', '/careers'],
    careers: ['/careers', '/careers', '/careers', '/careers', '/careers'],
    contact: ['/contact', '/contact', '/about', '/contact', '/contact'],
  };

  await upsertPageHero('about', {
    title: '关于新蓝恒成',
    subtitle: '外稳内动，恒久达成 — 致力于提供安全可靠、技术创新的信息技术服务与解决方案',
    visualImage: '/images/hero/hero_about.jpg',
    visualAlt: '上海陆家嘴黄昏天际线，展现现代企业总部气象',
    visualImages: heroImages('about'),
    visualLinks: heroLinks['about'],
  });
  await upsertPageHero('products', {
    title: '产品与服务',
    subtitle: '安全可靠的技术产品与解决方案，满足不同行业的多样化需求',
    visualImage: '/images/hero/hero_products.jpg',
    visualAlt: '黄昏城市驾驶舱视角，智能车联网产品意境',
    visualImages: heroImages('products'),
    visualLinks: heroLinks['products'],
  });
  await upsertPageHero('solutions', {
    title: '解决方案',
    subtitle: '行业定制化解决方案，助力企业数字化转型',
    visualImage: '/images/hero/hero_solutions.jpg',
    visualAlt: '安全运营中心多屏数据监控场景',
    visualImages: heroImages('solutions'),
    visualLinks: heroLinks['solutions'],
  });
  await upsertPageHero('news', {
    title: '新闻中心',
    subtitle: '了解新蓝恒成最新资讯与行业动态',
    visualImage: '/images/hero/hero_news.jpg',
    visualAlt: '上海都市夜景航拍，资讯脉搏与城市共生',
    visualImages: heroImages('news'),
    visualLinks: heroLinks['news'],
  });
  await upsertPageHero('careers', {
    title: '加入我们',
    subtitle: '与新蓝恒成一起，共创智能出行新未来',
    visualImage: '/images/hero/hero_careers.jpg',
    visualAlt: '青年人才团队协作研讨场景',
    visualImages: heroImages('careers'),
    visualLinks: heroLinks['careers'],
  });
  await upsertPageHero('contact', {
    title: '联系我们',
    subtitle: '如果您有任何合作意向或咨询需求，请通过表单或以下方式与我们联系',
    visualImage: '/images/hero/hero_contact.jpg',
    visualAlt: '商务伙伴办公室握手洽谈合作',
    visualImages: heroImages('contact'),
    visualLinks: heroLinks['contact'],
  });

  console.log('  ✓ 各页 Hero 配置: about/products/solutions/news/careers/contact');

  // ==================== 产品 ====================
  const products = [
    {
      name: '智能车辆管理系统',
      slug: 'smart-vehicle-management',
      category: '智能交通',
      description: '基于物联网与大数据的车辆全生命周期管理平台',
      features: JSON.stringify([
        { title: '实时定位', detail: 'GPS+北斗双模定位' },
        { title: '远程诊断', detail: '车辆状态远程监控' },
        { title: '数据分析', detail: '行驶数据智能分析' },
      ]),
      coverImage: '/images/car_mockup_deep_blue.png',
      images: JSON.stringify(['/images/car_mockup_deep_blue.png', '/images/car_mockup_iron_grey.png']),
      sortOrder: 1,
    },
    {
      name: '车联网安全解决方案',
      slug: 'vehicle-network-security',
      category: '信息安全',
      description: '面向车联网的端到端安全防护体系',
      features: JSON.stringify([
        { title: '通信加密', detail: '国密算法加密通信' },
        { title: '入侵检测', detail: '实时威胁检测告警' },
        { title: '安全认证', detail: '设备身份双向认证' },
      ]),
      coverImage: '/images/car_mockup_iron_grey.png',
      images: JSON.stringify(['/images/car_mockup_iron_grey.png']),
      sortOrder: 2,
    },
    {
      name: '智慧出行服务平台',
      slug: 'smart-mobility-platform',
      category: '智慧出行',
      description: '一站式智慧出行服务与管理平台',
      features: JSON.stringify([
        { title: '智能调度', detail: 'AI 驱动的车辆调度' },
        { title: '用户管理', detail: '多角色权限管理' },
        { title: '支付集成', detail: '多渠道支付接入' },
      ]),
      coverImage: '/images/car_mockup_deep_blue.png',
      images: JSON.stringify(['/images/car_mockup_deep_blue.png']),
      sortOrder: 3,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }
  console.log(`  ✓ 产品: ${products.length} 条`);

  // ==================== 解决方案 ====================
  const solutions = [
    {
      title: '政企车辆管理解决方案',
      slug: 'enterprise-vehicle-management',
      industry: '政府机关',
      content:
        '为政府机关和企事业单位提供专业的车辆管理解决方案，涵盖车辆采购、调度、维修、报废全生命周期管理。',
      coverImage: '/images/car_mockup_deep_blue.png',
      sortOrder: 1,
    },
    {
      title: '物流运输安全解决方案',
      slug: 'logistics-transport-security',
      industry: '物流运输',
      content:
        '面向物流运输企业的安全管控解决方案，实时监控车辆状态与驾驶员行为，降低事故风险。',
      coverImage: '/images/car_mockup_iron_grey.png',
      sortOrder: 2,
    },
  ];

  for (const s of solutions) {
    await prisma.solution.upsert({
      where: { slug: s.slug },
      update: {},
      create: s,
    });
  }
  console.log(`  ✓ 解决方案: ${solutions.length} 条`);

  // ==================== 新闻 ====================
  const news = [
    {
      title: '新蓝恒成荣获2026年度信息安全优秀企业奖',
      slug: 'xinlan-wins-security-award-2026',
      summary: '我司凭借在信息安全领域的突出表现，荣获年度优秀企业奖项。',
      content:
        '近日，湖南新蓝恒成信息技术有限公司在2026年度信息安全评选中，凭借卓越的技术实力和优质的客户服务，荣获"年度信息安全优秀企业"奖项。这一荣誉是对我司多年来在信息安全领域深耕的肯定。',
      coverImage: '/images/logo_shield.png',
      category: '公司动态',
      tags: '获奖,信息安全,企业荣誉',
      status: 'published',
      publishedAt: new Date('2026-07-15'),
    },
    {
      title: '智能车辆管理系统3.0版本正式发布',
      slug: 'smart-vehicle-system-v3-released',
      summary: '全新升级的智能车辆管理系统3.0版本正式上线，带来多项创新功能。',
      content:
        '经过半年的研发迭代，新蓝恒成智能车辆管理系统3.0版本正式发布。新版本在定位精度、数据分析能力和用户体验方面均有显著提升，新增AI智能调度、预测性维护等核心功能。',
      coverImage: '/images/car_mockup_deep_blue.png',
      category: '公司动态',
      tags: '产品发布,智能车辆',
      status: 'published',
      publishedAt: new Date('2026-06-20'),
    },
    {
      title: '车联网安全行业标准解读与趋势分析',
      slug: 'vehicle-network-security-trends-2026',
      summary: '深度解读车联网安全行业最新标准，分析2026年技术发展趋势。',
      content:
        '随着智能网联汽车的快速发展，车联网安全已成为行业关注焦点。本文将从最新行业标准出发，深入分析车联网安全的技术趋势与发展方向。',
      coverImage: '/images/logo_shield.png',
      category: '行业资讯',
      tags: '车联网,信息安全,行业趋势',
      status: 'published',
      publishedAt: new Date('2026-06-01'),
    },
  ];

  for (const n of news) {
    await prisma.news.upsert({
      where: { slug: n.slug },
      update: {},
      create: n,
    });
  }
  console.log(`  ✓ 新闻: ${news.length} 条`);

  // ==================== 招聘职位 ====================
  const jobs = [
    {
      title: '高级前端工程师',
      department: '研发部',
      location: '长沙',
      type: 'full-time',
      description:
        '负责公司产品前端开发，使用 React/Next.js 技术栈，参与产品架构设计与核心功能开发。',
      requirements:
        '1. 3年以上前端开发经验\n2. 精通 React/TypeScript\n3. 熟悉 Next.js 优先\n4. 良好的沟通协作能力',
      status: 'open',
    },
    {
      title: '后端工程师',
      department: '研发部',
      location: '长沙',
      type: 'full-time',
      description:
        '负责公司产品后端服务开发，使用 Node.js/Express 技术栈，参与系统架构设计与数据库优化。',
      requirements:
        '1. 2年以上后端开发经验\n2. 精通 Node.js/Express\n3. 熟悉 MySQL/Prisma\n4. 了解微服务架构优先',
      status: 'open',
    },
    {
      title: '安全工程师',
      department: '安全部',
      location: '长沙',
      type: 'full-time',
      description: '负责车联网安全产品研发，参与安全方案设计与漏洞修复。',
      requirements: '1. 2年以上信息安全相关经验\n2. 熟悉常见安全漏洞与防护\n3. 有车联网安全经验优先',
      status: 'open',
    },
    {
      title: '前端开发实习生',
      department: '研发部',
      location: '长沙',
      type: 'intern',
      description: '协助前端团队完成产品开发，参与代码编写与测试。',
      requirements: '1. 计算机相关专业在校生\n2. 了解 HTML/CSS/JavaScript\n3. 有 React 项目经验优先',
      status: 'open',
    },
  ];

  for (const j of jobs) {
    await prisma.job.create({ data: j });
  }
  console.log(`  ✓ 招聘: ${jobs.length} 条`);

  // ==================== 留言 ====================
  const messages = [
    {
      name: '张经理',
      phone: '13800138000',
      email: 'zhang@example.com',
      company: '某物流有限公司',
      content: '想了解贵公司的物流运输安全解决方案，请安排销售人员联系。',
      status: 'pending',
    },
    {
      name: '李主任',
      phone: '13900139000',
      email: 'li@gov.example.cn',
      company: '某政府机关',
      content: '我单位有意采购车辆管理系统，请提供详细方案和报价。',
      status: 'read',
    },
  ];

  for (const m of messages) {
    await prisma.message.create({ data: m });
  }
  console.log(`  ✓ 留言: ${messages.length} 条`);

  console.log('🎉 测试数据填充完成！');
  console.log('   默认账号: admin / admin123 (管理员), editor / editor123 (编辑)');
}

main()
  .catch((e) => {
    console.error('❌ 填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
