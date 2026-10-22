import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import { adminHeader, cleanProducts, closeDb, editorToken, makeProduct, seedProducts } from './helpers';

/**
 * 管理后台产品接口 —— 鉴权、生命周期 CRUD、批量操作、数据分析
 */
describe('管理后台产品接口', () => {
  beforeEach(cleanProducts);
  afterAll(closeDb);

  // ==================== 鉴权 ====================
  describe('鉴权', () => {
    it('无 token 访问管理接口返回 401', async () => {
      expect((await request(app).get('/api/admin/products')).status).toBe(401);
      expect((await request(app).get('/api/admin/products/analytics')).status).toBe(401);
      expect(
        (await request(app).post('/api/admin/products/batch').send({ action: 'delete', ids: [1] })).status,
      ).toBe(401);
    });

    it('伪造 token 返回 401', async () => {
      const res = await request(app)
        .get('/api/admin/products')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });

    it('非管理员角色执行写操作返回 403', async () => {
      const [p] = await seedProducts([{}]);
      const res = await request(app)
        .post('/api/admin/products/batch')
        .set('Authorization', `Bearer ${editorToken()}`)
        .send({ action: 'delete', ids: [p.id] });
      expect(res.status).toBe(403);

      // 只读接口对非管理员登录用户开放（菜单按角色过滤，服务端仅拦截写操作之外由路由自行控制）
      const list = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${editorToken()}`);
      expect(list.status).toBe(200);
    });
  });

  // ==================== 生命周期 CRUD ====================
  describe('生命周期 CRUD', () => {
    const validPayload = () => ({
      name: '新产品',
      slug: `new-${Date.now()}`,
      category: '测试分类A',
      description: '描述',
      features: '[]',
      images: '[]',
      sortOrder: 0,
    });

    it('新建即上架：publishedAt 自动回填', async () => {
      const res = await request(app)
        .post('/api/admin/products')
        .set(adminHeader())
        .send({ ...validPayload(), status: 'active' });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('active');
      expect(res.body.data.publishedAt).not.toBeNull();
    });

    it('新建为草稿：publishedAt 为空', async () => {
      const res = await request(app)
        .post('/api/admin/products')
        .set(adminHeader())
        .send({ ...validPayload(), status: 'draft' });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.publishedAt).toBeNull();
    });

    it('非法 status 返回 422', async () => {
      const res = await request(app)
        .post('/api/admin/products')
        .set(adminHeader())
        .send({ ...validPayload(), status: 'inactive' });

      expect(res.status).toBe(422);
    });

    it('更新 draft → active 时回填 publishedAt', async () => {
      const draft = await prisma.product.create({ data: makeProduct({ status: 'draft' }) as never });
      expect(draft.publishedAt).toBeNull();

      const res = await request(app)
        .put(`/api/admin/products/${draft.id}`)
        .set(adminHeader())
        .send({
          name: draft.name,
          slug: draft.slug,
          category: draft.category,
          description: draft.description,
          features: '[]',
          images: '[]',
          sortOrder: 0,
          status: 'active',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('active');
      expect(res.body.data.publishedAt).not.toBeNull();
    });

    it('已上架产品重复上架不覆盖原 publishedAt', async () => {
      const first = new Date('2026-01-01T00:00:00Z');
      const active = await prisma.product.create({
        data: makeProduct({ status: 'active', publishedAt: first }) as never,
      });

      const res = await request(app)
        .put(`/api/admin/products/${active.id}`)
        .set(adminHeader())
        .send({
          name: active.name,
          slug: active.slug,
          category: active.category,
          description: active.description,
          features: '[]',
          images: '[]',
          sortOrder: 0,
          status: 'active',
        });

      expect(res.status).toBe(200);
      expect(new Date(res.body.data.publishedAt).toISOString()).toBe(first.toISOString());
    });

    it('更新不存在的产品返回 404', async () => {
      const res = await request(app)
        .put('/api/admin/products/999999')
        .set(adminHeader())
        .send({ ...validPayload(), status: 'active' });

      expect(res.status).toBe(404);
    });
  });

  // ==================== 批量操作 ====================
  describe('POST /api/admin/products/batch（批量操作）', () => {
    it('publish：批量上架并仅为首次上架者回填 publishedAt', async () => {
      const old = new Date('2026-02-01T00:00:00Z');
      const draft = await prisma.product.create({ data: makeProduct({ status: 'draft' }) as never });
      const rePublish = await prisma.product.create({
        data: makeProduct({ status: 'archived', publishedAt: old }) as never,
      });

      const res = await request(app)
        .post('/api/admin/products/batch')
        .set(adminHeader())
        .send({ action: 'publish', ids: [draft.id, rePublish.id] });

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ ok: true, action: 'publish', affected: 2 });

      const d = await prisma.product.findUnique({ where: { id: draft.id } });
      expect(d?.status).toBe('active');
      expect(d?.publishedAt).not.toBeNull();

      const r = await prisma.product.findUnique({ where: { id: rePublish.id } });
      expect(r?.status).toBe('active');
      // 已有首次上架时间不被覆盖
      expect(r?.publishedAt?.toISOString()).toBe(old.toISOString());
    });

    it('archive：批量下架归档', async () => {
      const items = await seedProducts([{ status: 'active' }, { status: 'active' }]);

      const res = await request(app)
        .post('/api/admin/products/batch')
        .set(adminHeader())
        .send({ action: 'archive', ids: items.map((i) => i.id) });

      expect(res.status).toBe(200);
      expect(res.body.data.affected).toBe(2);

      const remaining = await prisma.product.findMany({ where: { status: 'active' } });
      expect(remaining).toHaveLength(0);
    });

    it('delete：批量删除且级联清理浏览明细', async () => {
      const [p] = await seedProducts([{}]);
      await prisma.productView.create({ data: { productId: p.id, referrer: '/x' } });

      const res = await request(app)
        .post('/api/admin/products/batch')
        .set(adminHeader())
        .send({ action: 'delete', ids: [p.id] });

      expect(res.status).toBe(200);
      expect(res.body.data.affected).toBe(1);
      expect(await prisma.product.count()).toBe(0);
      expect(await prisma.productView.count()).toBe(0);
    });

    it('部分 id 不存在时返回实际影响条数', async () => {
      const [p] = await seedProducts([{}]);

      const res = await request(app)
        .post('/api/admin/products/batch')
        .set(adminHeader())
        .send({ action: 'archive', ids: [p.id, 999998, 999999] });

      expect(res.status).toBe(200);
      expect(res.body.data.affected).toBe(1);
    });

    it('参数校验：空 ids / 超过200条 / 非法 action 均返回 422', async () => {
      const base = request(app).post('/api/admin/products/batch').set(adminHeader());

      expect((await base.send({ action: 'delete', ids: [] })).status).toBe(422);
      expect(
        (await base.send({ action: 'delete', ids: Array.from({ length: 201 }, (_, i) => i + 1) })).status,
      ).toBe(422);
      expect((await base.send({ action: 'burn', ids: [1] })).status).toBe(422);
      expect((await base.send({ action: 'delete', ids: ['a'] })).status).toBe(422);
    });
  });

  // ==================== 数据分析 ====================
  describe('GET /api/admin/products/analytics（产品分析）', () => {
    it('返回完整分析结构', async () => {
      const [hot, cold, draft] = await seedProducts([
        { name: '热门', category: '分类A', viewCount: 100 },
        { name: '冷门', category: '分类B', viewCount: 0 },
        { name: '草稿', category: '分类A', status: 'draft', viewCount: 5 },
      ]);
      // 写入 2 条近 30 天浏览 + 1 条 31 天前的历史浏览
      await prisma.productView.create({ data: { productId: hot.id, referrer: '/a' } });
      await prisma.productView.create({ data: { productId: cold.id, referrer: null } });
      // 直接写毫秒时间戳（Prisma SQLite 的 DateTime 底层为 ms 整数）
      const old31Ms = Date.now() - 31 * 24 * 60 * 60 * 1000;
      await prisma.$executeRaw`INSERT INTO product_views (product_id, referrer, created_at) VALUES (${hot.id}, 'old', ${old31Ms})`;

      const res = await request(app).get('/api/admin/products/analytics').set(adminHeader());

      expect(res.status).toBe(200);
      const d = res.body.data;

      // 总量指标（含草稿：管理视角统计全量）
      expect(d.totals.products).toBe(3);
      expect(d.totals.totalViews).toBe(105);
      expect(d.totals.viewsLast30d).toBe(2); // 31 天前的不计入
      expect(d.totals.zeroViewActive).toBe(1); // 仅"冷门"：上架且零浏览

      // 生命周期分布
      const statusMap = Object.fromEntries(d.byStatus.map((s: { status: string; count: number }) => [s.status, s.count]));
      expect(statusMap).toEqual({ active: 2, draft: 1 });

      // 分类分布按数量降序
      expect(d.byCategory[0]).toEqual({ category: '分类A', count: 2 });

      // TOP 榜按浏览量降序
      expect(d.topViewed[0].name).toBe('热门');
      expect(d.topViewed[0].viewCount).toBe(100);

      // 30 天趋势：恰好 30 个点，今天 = 2
      expect(d.trend30).toHaveLength(30);
      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      expect(d.trend30[29].day).toBe(todayKey);
      expect(d.trend30[29].views).toBe(2);
      // 无浏览的日期被补 0
      expect(d.trend30[0].views).toBe(0);
    });

    it('空库时返回零值结构而非报错', async () => {
      const res = await request(app).get('/api/admin/products/analytics').set(adminHeader());

      expect(res.status).toBe(200);
      expect(res.body.data.totals).toEqual({
        products: 0,
        totalViews: 0,
        viewsLast30d: 0,
        zeroViewActive: 0,
      });
      expect(res.body.data.trend30).toHaveLength(30);
      expect(res.body.data.topViewed).toEqual([]);
    });
  });
});
