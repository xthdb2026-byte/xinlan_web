import request from 'supertest';
import app from '../src/app';
import { cleanProducts, closeDb, seedProducts } from './helpers';

/**
 * 公共产品接口 —— 生命周期可见性
 * 规则：列表 / 分类 / 精选 / 详情 仅暴露 status=active 的产品
 */
describe('公共产品接口（生命周期过滤）', () => {
  beforeEach(cleanProducts);
  afterAll(closeDb);

  describe('GET /api/products', () => {
    it('仅返回已上架产品，草稿与归档不可见', async () => {
      await seedProducts([
        { name: '上架产品', status: 'active' },
        { name: '草稿产品', status: 'draft' },
        { name: '归档产品', status: 'archived' },
      ]);

      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('OK');
      const names = res.body.data.map((p: { name: string }) => p.name);
      expect(names).toEqual(['上架产品']);
    });

    it('按分类筛选且仍遵循上架过滤', async () => {
      await seedProducts([
        { name: 'A类上架', category: '分类A', status: 'active' },
        { name: 'B类上架', category: '分类B', status: 'active' },
        { name: 'A类草稿', category: '分类A', status: 'draft' },
      ]);

      const res = await request(app).get('/api/products?category=分类A');

      expect(res.status).toBe(200);
      const names = res.body.data.map((p: { name: string }) => p.name);
      expect(names).toEqual(['A类上架']);
    });

    it('按 sortOrder 升序返回', async () => {
      await seedProducts([
        { name: '第三', sortOrder: 30 },
        { name: '第一', sortOrder: 10 },
        { name: '第二', sortOrder: 20 },
      ]);

      const res = await request(app).get('/api/products');
      const names = res.body.data.map((p: { name: string }) => p.name);
      expect(names).toEqual(['第一', '第二', '第三']);
    });

    it('摘要字段包含 viewCount 用于热度展示', async () => {
      await seedProducts([{ name: '带浏览量', viewCount: 42 }]);

      const res = await request(app).get('/api/products');

      expect(res.body.data[0].viewCount).toBe(42);
      // 不泄露非摘要字段
      expect(res.body.data[0].specs).toBeUndefined();
    });
  });

  describe('GET /api/products/categories', () => {
    it('仅统计有上架产品的分类', async () => {
      await seedProducts([
        { category: '分类A', status: 'active' },
        { category: '分类B', status: 'draft' },
      ]);

      const res = await request(app).get('/api/products/categories');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(['分类A']);
    });
  });

  describe('GET /api/products/featured', () => {
    it('仅返回上架产品且遵守 limit 上限', async () => {
      await seedProducts([
        { name: '上架1' },
        { name: '上架2' },
        { name: '草稿', status: 'draft' },
      ]);

      const res = await request(app).get('/api/products/featured?limit=99');

      expect(res.status).toBe(200);
      // limit 被钳制到 10，实际只有 2 款上架
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data.every((p: { name: string }) => p.name.startsWith('上架'))).toBe(true);
    });
  });

  describe('GET /api/products/:slug', () => {
    it('上架产品返回完整详情', async () => {
      const [p] = await seedProducts([{ name: '详情产品', specs: '[]' }]);

      const res = await request(app).get(`/api/products/${p.slug}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('详情产品');
      expect(res.body.data.status).toBe('active');
    });

    it('草稿产品返回 404（前台不可见）', async () => {
      const [p] = await seedProducts([{ status: 'draft' }]);

      const res = await request(app).get(`/api/products/${p.slug}`);

      expect(res.status).toBe(404);
    });

    it('归档产品返回 404（前台隐藏）', async () => {
      const [p] = await seedProducts([{ status: 'archived' }]);

      const res = await request(app).get(`/api/products/${p.slug}`);

      expect(res.status).toBe(404);
    });

    it('不存在的 slug 返回 404', async () => {
      const res = await request(app).get('/api/products/not-exist-slug');
      expect(res.status).toBe(404);
    });
  });
});
