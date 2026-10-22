/**
 * PM2 进程管理配置 - 新蓝恒成网站
 *
 * 使用方式：
 *   1. 复制 .env.production.example 为 .env.production 并修改实际值
 *   2. 在项目根目录执行：pm2 start ecosystem.config.js --env production
 *   3. 保存进程列表（开机自启）：pm2 save && pm2 startup
 *   4. 查看日志：pm2 logs
 *   5. 重启：pm2 restart all / pm2 reload all（零停机）
 *
 * 前置条件：
 *   - backend 已执行 npm run build（生成 dist/）
 *   - frontend 已执行 npm run build（生成 .next/standalone/）
 *   - 已配置 .env.production 中的 JWT_SECRET 等敏感变量
 */

const path = require('path');

module.exports = {
  apps: [
    // ==================== 后端服务 ====================
    {
      name: 'xinlan-backend',
      script: 'node dist/app.js',
      cwd: path.join(__dirname, 'backend'),
      instances: 1, // Express 单实例即可，多实例需配合 Redis 共享会话
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M', // 内存超限自动重启，防止内存泄漏
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        // 数据库连接（SQLite 文件路径，相对 backend/prisma 目录）
        DATABASE_URL: 'file:./prisma/prod.db',
        // JWT 配置 - 生产环境务必修改为强随机字符串（建议 openssl rand -hex 32）
        JWT_SECRET: 'CHANGE_ME_TO_A_STRONG_RANDOM_STRING',
        JWT_EXPIRES_IN: '7d',
        // 前端地址（用于 CORS 白名单）
        FRONTEND_URL: 'http://localhost:3000',
        // 限流配置（15 分钟窗口内最多 100 次请求）
        RATE_LIMIT_WINDOW_MS: 900000,
        RATE_LIMIT_MAX: 100,
      },
      // 日志配置
      out_file: path.join(__dirname, 'logs', 'backend-out.log'),
      error_file: path.join(__dirname, 'logs', 'backend-error.log'),
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // 重启策略
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000, // 异常退出后等待 5 秒再重启，避免雪崩
      kill_timeout: 5000, // 优雅退出等待时间
    },

    // ==================== 前端服务 ====================
    {
      name: 'xinlan-frontend',
      script: 'server.js',
      cwd: path.join(__dirname, 'frontend', '.next', 'standalone'),
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Next.js standalone 运行时需要显式设置主机名以监听外部访问
        HOSTNAME: '0.0.0.0',
        // 前端调用的后端 API 地址（构建时已注入，运行时如需覆盖用此变量）
        NEXT_PUBLIC_API_BASE: 'http://localhost:3001/api',
      },
      out_file: path.join(__dirname, 'logs', 'frontend-out.log'),
      error_file: path.join(__dirname, 'logs', 'frontend-error.log'),
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,
      kill_timeout: 5000,
    },
  ],
};
