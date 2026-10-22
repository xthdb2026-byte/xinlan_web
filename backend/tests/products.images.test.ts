import request from 'supertest';
import app from '../src/app';
import { cleanProducts, closeDb, seedProducts } from './helpers';

/**
 * 产品图片接入回归测试（2026-08-30 海康京东实拍图接入）
 * 背景：products 表 cover_image 与 images 是两个独立字段，
 * 列表页用 coverImage、详情页用 images[0]，只改其一会导致两端不一致。
 * 本套件锁定：接口字段返回、两字段口径一致性、静态图片可访问性。
 */
describe('产品图片字段与静态资源', () => {
  beforeEach(cleanProducts);
  afterAll(closeDb);

  describe('接口字段返回', () => {
    it('列表接口应返回 coverImage 字段', async () => {
      await seedProducts([
        {
          name: '带封面产品',
          coverImage: '/uploads/products/x-1.jpg',
          images: '["/uploads/products/x-1.jpg","/uploads/products/x-2.jpg"]',
        },
      ]);

      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(res.body.data[0].coverImage).toBe('/uploads/products/x-1.jpg');
    });

    it('详情接口应返回完整 images JSON 字符串', async () => {
      const [p] = await seedProducts([
        {
          name: '带图集产品',
          coverImage: '/uploads/products/y-1.jpg',
          images: '["/uploads/products/y-1.jpg","/uploads/products/y-2.jpg","/uploads/products/y-3.jpg"]',
        },
      ]);

      const res = await request(app).get(`/api/products/${p.slug}`);

      expect(res.status).toBe(200);
      const images = JSON.parse(res.body.data.images);
      expect(images).toHaveLength(3);
      expect(images[0]).toBe('/uploads/products/y-1.jpg');
    });

    it('coverImage 与 images[0] 一致时，列表封面与详情首图口径一致', async () => {
      // 回归：2026-08-30 曾只更新 images 未更新 cover_image，导致列表页仍显示旧图
      const imgs = [
        '/uploads/products/z-1.jpg',
        '/uploads/products/z-2.jpg',
        '/uploads/products/z-3.jpg',
      ];
      const [p] = await seedProducts([
        {
          name: '口径一致产品',
          coverImage: imgs[0],
          images: JSON.stringify(imgs),
        },
      ]);

      const listRes = await request(app).get('/api/products');
      const detailRes = await request(app).get(`/api/products/${p.slug}`);

      const coverInList = listRes.body.data[0].coverImage;
      const firstInDetail = JSON.parse(detailRes.body.data.images)[0];
      expect(coverInList).toBe(firstInDetail);
    });
  });

  describe('海康威视实拍图静态资源（京东图源接入）', () => {
    // 4 款硬件产品各 3 张实拍图；iSecure Center 为软件平台保留 SVG
    const cases: Array<[string, string[], string]> = [
      [
        'hikvision-2cd3t46wd-i3',
        ['-1.jpg', '-2.jpg', '-3.jpg'].map((s) => `/uploads/products/hikvision-2cd3t46wd-i3${s}`),
        'image/jpeg',
      ],
      [
        'hikvision-2dc4223iw-d',
        ['-1.jpg', '-2.jpg', '-3.jpg'].map((s) => `/uploads/products/hikvision-2dc4223iw-d${s}`),
        'image/jpeg',
      ],
      [
        'hikvision-2cd7a47-xzs',
        ['-1.jpg', '-2.jpg', '-3.jpg'].map((s) => `/uploads/products/hikvision-2cd7a47-xzs${s}`),
        'image/jpeg',
      ],
      [
        'hikvision-8664n-i8',
        ['-1.jpg', '-2.jpg', '-3.jpg'].map((s) => `/uploads/products/hikvision-8664n-i8${s}`),
        'image/jpeg',
      ],
      [
        'hikvision-isecure-center',
        ['/uploads/products/hikvision-isecure-center-1.svg'],
        'image/svg',
      ],
    ];

    it.each(cases)('%s 的图片均可访问且类型正确', async (_slug, paths, mimePrefix) => {
      for (const p of paths) {
        const res = await request(app).get(p);
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(new RegExp(mimePrefix));
        // 实拍图应为真实内容而非空文件（SVG 矢量图体积小，阈值按类型区分）
        const minSize = mimePrefix === 'image/jpeg' ? 5000 : 500;
        expect(Number(res.headers['content-length'])).toBeGreaterThan(minSize);
      }
    });
  });
});
