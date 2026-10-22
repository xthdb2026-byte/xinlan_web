import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import { cleanProducts, closeDb, seedProducts } from './helpers';

/**
 * 匿名浏览埋点
 * POST /api/products/:slug/view —— 写浏览明细 + 累计计数（事务一致）
 */
describe('POST /api/products/:slug/view（匿名浏览埋点）', () => {
  beforeEach(cleanProducts);
  afterAll(closeDb);

  it('上架产品：浏览量 +1 且写入带来源的浏览明细', async () => {
    const [p] = await seedProducts([{ viewCount: 10 }]);

    const res = await request(app)
      .post(`/api/products/${p.slug}/view`)
      .send({ referrer: '/products' });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ ok: true });

    const after = await prisma.product.findUnique({ where: { id: p.id } });
    expect(after?.viewCount).toBe(11);

    const views = await prisma.productView.findMany({ where: { productId: p.id } });
    expect(views).toHaveLength(1);
    expect(views[0].referrer).toBe('/products');
  });

  it('重复请求重复计数（去重由前端 sessionStorage 负责，后端不做幂等）', async () => {
    const [p] = await seedProducts([{ viewCount: 0 }]);

    await request(app).post(`/api/products/${p.slug}/view`).send({});
    await request(app).post(`/api/products/${p.slug}/view`).send({});

    const after = await prisma.product.findUnique({ where: { id: p.id } });
    expect(after?.viewCount).toBe(2);
    expect(await prisma.productView.count({ where: { productId: p.id } })).toBe(2);
  });

  it('referrer 缺失或非法（超长）时降级为 null，不影响计数', async () => {
    const [p] = await seedProducts([{}]);

    // 不传 body
    const r1 = await request(app).post(`/api/products/${p.slug}/view`);
    expect(r1.status).toBe(200);

    // referrer 超过 500 字符
    const r2 = await request(app)
      .post(`/api/products/${p.slug}/view`)
      .send({ referrer: 'x'.repeat(501) });
    expect(r2.status).toBe(200);

    const views = await prisma.productView.findMany({ where: { productId: p.id } });
    expect(views).toHaveLength(2);
    expect(views.every((v) => v.referrer === null)).toBe(true);
  });

  it('草稿/归档产品返回 404 且不计数', async () => {
    const [draft, archived] = await seedProducts([
      { status: 'draft' },
      { status: 'archived' },
    ]);

    expect((await request(app).post(`/api/products/${draft.slug}/view`).send({})).status).toBe(404);
    expect((await request(app).post(`/api/products/${archived.slug}/view`).send({})).status).toBe(404);

    expect(await prisma.productView.count()).toBe(0);
    const d = await prisma.product.findUnique({ where: { id: draft.id } });
    expect(d?.viewCount).toBe(0);
  });

  it('不存在的 slug 返回 404', async () => {
    const res = await request(app).post('/api/products/ghost-slug/view').send({});
    expect(res.status).toBe(404);
  });
});
