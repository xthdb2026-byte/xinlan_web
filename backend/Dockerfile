# ============================================================
# 新蓝恒成网站 - 后端 Dockerfile（Express + TypeScript + Prisma + SQLite）
# 多阶段构建，运行时执行 prisma db push 与 seed 初始化
# ============================================================

# ==================== 阶段 1: builder ====================
# 安装全部依赖（含 dev）并编译 TypeScript
FROM node:20-alpine AS builder

# sharp 在 Alpine 上需要原生构建依赖
RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /app

# 仅复制依赖描述文件，最大化利用层缓存
COPY package.json package-lock.json* ./

# 安装全部依赖（含 devDependencies，编译 TS 与运行 seed 需要）
RUN npm ci

# 复制 prisma schema 并生成客户端（后续 tsc 编译会引用）
COPY prisma ./prisma
RUN npx prisma generate

# 复制源码与配置
COPY tsconfig.json ./
COPY src ./src

# 编译 TypeScript 输出到 dist/
RUN npm run build

# ==================== 阶段 2: runner ====================
# 仅保留生产依赖与运行时文件
FROM node:20-alpine AS runner

# sharp 在 Alpine 运行时需要这些库
RUN apk add --no-cache libc6-compat vips-dev

WORKDIR /app

# 生产环境变量
ENV NODE_ENV=production
ENV PORT=3001
# 数据库文件独立存放于 /app/data，便于 volume 持久化且不覆盖 prisma/schema.prisma
ENV DATABASE_URL=file:/app/data/prod.db

# 创建非 root 用户
RUN addgroup --system --gid 1001 express \
    && adduser --system --uid 1001 express

# 仅安装生产依赖
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force
# tsx 位于 devDependencies，但运行 seed.ts 需要，单独安装
RUN npm install --no-save tsx@^4.16.2

# 复制 prisma schema 并重新生成客户端（生产依赖内）
COPY prisma ./prisma
RUN npx prisma generate

# 复制编译产物
COPY --from=builder /app/dist ./dist

# 创建数据目录与上传目录并赋权（运行时由 volume 挂载持久化）
RUN mkdir -p /app/data /app/uploads && chown -R express:express /app

# 声明 volume（由 compose 挂载命名卷持久化）
VOLUME ["/app/data", "/app/uploads"]

USER express

EXPOSE 3001

# 健康检查：访问后端 /health 接口
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://localhost:3001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# 启动流程：1. 同步 schema 到数据库 2. 填充种子数据 3. 启动服务
# seed 使用 upsert 幂等，容器重启时不会产生重复数据
CMD npx prisma db push --accept-data-loss && \
    npx tsx prisma/seed.ts && \
    node dist/app.js
