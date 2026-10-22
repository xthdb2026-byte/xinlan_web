import { prisma } from '../src/lib/prisma';
import { signToken } from '../src/middleware/auth';

/** 生成管理员令牌（直接签发，绕过登录接口及其限流） */
export function adminToken(): string {
  return signToken({ id: 1, username: 'test-admin', role: 'admin' });
}

/** 生成非管理员令牌（用于验证 adminOnly 拦截） */
export function editorToken(): string {
  return signToken({ id: 2, username: 'test-editor', role: 'editor' });
}

/** 管理员请求头 */
export function adminHeader() {
  return { Authorization: `Bearer ${adminToken()}` };
}

/** 清空产品相关表（浏览明细先于产品删除，避免外键约束） */
export async function cleanProducts() {
  await prisma.productView.deleteMany();
  await prisma.product.deleteMany();
}

let seq = 0;

/** 构造产品数据（slug 全局唯一） */
export function makeProduct(overrides: Record<string, unknown> = {}) {
  seq += 1;
  return {
    name: `测试产品${seq}`,
    slug: `test-product-${seq}-${Date.now()}`,
    category: '测试分类A',
    description: '测试描述',
    features: '[]',
    images: '[]',
    sortOrder: 0,
    status: 'active',
    ...overrides,
  };
}

/** 批量插入产品并返回记录 */
export async function seedProducts(list: Array<Record<string, unknown>>) {
  const created = [];
  for (const item of list) {
    created.push(await prisma.product.create({ data: makeProduct(item) as never }));
  }
  return created;
}

/** 断开 Prisma 连接（afterAll 调用，避免 Jest 进程悬挂） */
export async function closeDb() {
  await prisma.$disconnect();
}
