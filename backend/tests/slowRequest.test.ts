/**
 * 慢请求监控中间件
 * 将阈值设为 0ms 使任意请求都触发告警，验证日志行为。
 * 注意：SLOW_REQUEST_MS 在 app.ts 模块加载时读取，因此必须在 import app 之前设置。
 */
process.env.SLOW_REQUEST_MS = '0';

import request from 'supertest';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('../src/app').default;
import logger from '../src/utils/logger';
import { cleanProducts, closeDb, seedProducts } from './helpers';

describe('慢请求监控', () => {
  beforeEach(cleanProducts);
  afterAll(closeDb);

  it('请求耗时超过阈值时记录 [SlowRequest] warn 日志', async () => {
    await seedProducts([]);
    const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => logger);

    await request(app).get('/api/products');

    // res.on('finish') 是异步的，等待一个事件循环
    await new Promise((r) => setImmediate(r));

    expect(warnSpy).toHaveBeenCalled();
    const logLine = warnSpy.mock.calls.map((c) => String(c[0])).find((m) => m.includes('[SlowRequest]'));
    expect(logLine).toBeDefined();
    expect(logLine).toContain('GET /api/products');
    expect(logLine).toMatch(/cost=\d+\.\dms/);
    expect(logLine).toContain('status=200');

    warnSpy.mockRestore();
  });
});
