import request from 'supertest';
import app from '../src/app';
import { cleanProducts, closeDb, seedProducts } from './helpers';

/**
 * 智能推荐
 * GET /api/products/:slug/related —— 同分类 + 已上架 + 排除自身，浏览量降序
 */
describe('GET /api/products/:slug/related（相关产品推荐）', () => {
  beforeEach(cleanProducts);
  afterAll(closeDb);

  it('仅推荐同分类的已上架产品，且排除自身', async () => {
    const [self] = await seedProducts([
      { name: '自身', category: '交换机', viewCount: 100 },
      { name: '同类上架', category: '交换机', viewCount: 50 },
      { name: '同类草稿', category: '交换机', status: 'draft', viewCount: 999 },
      { name: '同类归档', category: '交换机', status: 'archived', viewCount: 888 },
      { name: '异类上架', category: '服务器', viewCount: 777 },
    ]);

    const res = await request(app).get(`/api/products/${self.slug}/related`);

    expect(res.status).toBe(200);
    const names = res.body.data.map((p: { name: string }) => p.name);
    expect(names).toEqual(['同类上架']);
  });

  it('按浏览量降序排序（热度优先）', async () => {
    const [self] = await seedProducts([
      { name: '自身', category: '交换机' },
      { name: '低热度', category: '交换机', viewCount: 5, sortOrder: 1 },
      { name: '高热度', category: '交换机', viewCount: 500, sortOrder: 9 },
      { name: '中热度', category: '交换机', viewCount: 50, sortOrder: 5 },
    ]);

    const res = await request(app).get(`/api/products/${self.slug}/related`);

    const names = res.body.data.map((p: { name: string }) => p.name);
    expect(names).toEqual(['高热度', '中热度', '低热度']);
  });

  it('浏览量相同时按 sortOrder 升序兜底', async () => {
    const [self] = await seedProducts([
      { name: '自身', category: '交换机' },
      { name: 'B', category: '交换机', viewCount: 0, sortOrder: 2 },
      { name: 'A', category: '交换机', viewCount: 0, sortOrder: 1 },
    ]);

    const res = await request(app).get(`/api/products/${self.slug}/related`);

    const names = res.body.data.map((p: { name: string }) => p.name);
    expect(names).toEqual(['A', 'B']);
  });

  it('默认 limit=4，limit 参数最大钳制到 8', async () => {
    const [self] = await seedProducts([
      { name: '自身', category: '交换机' },
      ...Array.from({ length: 9 }, (_, i) => ({
        name: `同类${i + 1}`,
        category: '交换机',
        viewCount: i,
      })),
    ]);

    const r1 = await request(app).get(`/api/products/${self.slug}/related`);
    expect(r1.body.data).toHaveLength(4);

    const r2 = await request(app).get(`/api/products/${self.slug}/related?limit=99`);
    expect(r2.body.data).toHaveLength(8);
  });

  it('无同类产品时返回空数组', async () => {
    const [self] = await seedProducts([{ name: '孤独产品', category: '交换机' }]);

    const res = await request(app).get(`/api/products/${self.slug}/related`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('不存在的 slug 返回 404', async () => {
    const res = await request(app).get('/api/products/ghost-slug/related');
    expect(res.status).toBe(404);
  });
});
