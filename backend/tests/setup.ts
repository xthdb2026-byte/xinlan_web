/**
 * Jest setupFiles：在任何测试模块（含 app/prisma）被 import 之前注入测试环境变量。
 * 注意：dotenv 不会覆盖已存在的 env，因此这里的值优先于 .env 文件。
 */

// 独立测试库（路径相对于 backend/prisma/schema.prisma 解析 → prisma/test.db）
process.env.DATABASE_URL = 'file:./test.db';
// 放宽全局限流，避免批量用例触发 429
process.env.RATE_LIMIT_MAX = '100000';
// 固定 JWT 密钥，保证 signToken 与 authMiddleware 一致
process.env.JWT_SECRET = 'test-jwt-secret';
// 关闭请求日志噪音
process.env.NODE_ENV = 'test';
