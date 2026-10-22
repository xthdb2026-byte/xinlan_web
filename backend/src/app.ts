import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { notFound, errorHandler } from './middleware/error';
import logger from './utils/logger';
import { prisma } from './lib/prisma';
import newsRoutes from './routes/news';
import productsRoutes from './routes/products';
import solutionsRoutes from './routes/solutions';
import jobsRoutes from './routes/jobs';
import messagesRoutes from './routes/messages';
import applicationsRoutes from './routes/applications';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import mediaRoutes, { adminMediaRouter } from './routes/media';
import logoRoutes, { adminLogoRouter } from './routes/logo';
import footerRoutes, { adminFooterRouter } from './routes/footer';
import bannerRoutes from './routes/banners';
import pageConfigRoutes from './routes/pageConfigs';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

// 信任反向代理：确保 rate-limit、登录日志与锁定计数基于真实客户端 IP 生效
app.set('trust proxy', 1);

// ==================== 中间件 ====================
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  morgan('dev', {
    skip: () => process.env.NODE_ENV === 'production',
  }),
);

// 全局限流
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900000),
  max: Number(process.env.RATE_LIMIT_MAX ?? 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: '请求过于频繁，请稍后再试',
  },
});
app.use('/api', limiter);

// ==================== 静态文件服务 ====================
app.use('/uploads', express.static('uploads'));

// ==================== 健康检查 ====================
// 增强版：含数据库连通性、运行时长、内存占用，供监控探活与告警使用
app.get('/health', async (_req, res) => {
  const startedAt = process.hrtime();
  let db: 'ok' | 'down' = 'ok';
  let dbLatencyMs = 0;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Math.round(process.hrtime(startedAt)[1] / 1e6);
  } catch {
    db = 'down';
  }
  const mem = process.memoryUsage();
  res.status(db === 'ok' ? 200 : 503).json({
    status: db === 'ok' ? 'ok' : 'degraded',
    db,
    dbLatencyMs,
    uptimeSec: Math.round(process.uptime()),
    memoryMB: Math.round(mem.rss / 1024 / 1024),
    timestamp: new Date().toISOString(),
  });
});

// ==================== 慢请求监控 ====================
// 超过阈值（默认500ms）的 API 请求记录 warn 日志，用于性能劣化排查
const SLOW_REQUEST_MS = Number(process.env.SLOW_REQUEST_MS ?? 500);
app.use('/api', (req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const costMs = Number(process.hrtime.bigint() - start) / 1e6;
    if (costMs >= SLOW_REQUEST_MS) {
      logger.warn(`[SlowRequest] ${req.method} ${req.originalUrl} cost=${costMs.toFixed(1)}ms status=${res.statusCode}`);
    }
  });
  next();
});

// ==================== API 路由 ====================
app.use('/api/news', newsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/solutions', solutionsRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/contact', messagesRoutes); // 合作咨询复用 messages 路由
app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/admin/media', adminMediaRouter);
app.use('/api/logo', logoRoutes);
app.use('/api/admin/logo', adminLogoRouter);
app.use('/api/footer', footerRoutes);
app.use('/api/admin/footer', adminFooterRouter);
app.use('/api/banners', bannerRoutes);
app.use('/api/page-configs', pageConfigRoutes);
app.use('/api/admin', adminRoutes);

// ==================== 错误处理 ====================
app.use(notFound);
app.use(errorHandler);

// 测试环境（supertest 直接挂载 app）不自动监听端口，避免端口冲突
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`🚀 新蓝恒成 API 服务已启动: http://localhost:${PORT}`);
  });
}

export default app;
