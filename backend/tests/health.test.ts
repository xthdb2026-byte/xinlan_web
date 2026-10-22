import request from 'supertest';
import app from '../src/app';
import { closeDb } from './helpers';

/**
 * 增强版健康检查接口
 * GET /health —— 含数据库连通性、延迟、内存占用
 */
describe('GET /health', () => {
  afterAll(closeDb);

  it('数据库正常时返回 200 且字段完整', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('ok');
    expect(typeof res.body.dbLatencyMs).toBe('number');
    expect(res.body.dbLatencyMs).toBeGreaterThanOrEqual(0);
    expect(typeof res.body.uptimeSec).toBe('number');
    expect(typeof res.body.memoryMB).toBe('number');
    expect(res.body.memoryMB).toBeGreaterThan(0);
    // timestamp 为 ISO8601
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });

  it('不挂在 /api 命名空间下，也不受全局限流影响', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(404);
  });
});
