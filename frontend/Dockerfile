# ============================================================
# 新蓝恒成网站 - 前端 Dockerfile（Next.js 14 standalone）
# 多阶段构建以减小最终镜像体积
# ============================================================

# ---- 构建参数：后端 API 地址（构建时注入 NEXT_PUBLIC_* 变量） ----
ARG NEXT_PUBLIC_API_BASE=http://localhost:3001/api

# ==================== 阶段 1: deps ====================
# 安装依赖，利用层缓存：package.json 未变时跳过 npm install
FROM node:20-alpine AS deps

# Alpine 镜像补充构建工具（部分 npm 包需要 native addon）
RUN apk add --no-cache libc6-compat

WORKDIR /app

# 仅复制依赖描述文件，最大化利用缓存
COPY package.json package-lock.json* ./

RUN npm ci

# ==================== 阶段 2: builder ====================
# 执行 TypeScript 编译与 Next.js 构建，生成 standalone 输出
FROM node:20-alpine AS builder

WORKDIR /app

# 复制已安装的 node_modules
COPY --from=deps /app/node_modules ./node_modules

# 复制源码
COPY . .

# 通过 ARG 注入构建时变量（NEXT_PUBLIC_* 必须在 build 阶段可用）
ARG NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}
ENV NEXT_TELEMETRY_DISABLED=1

# 关闭 ESLint / 类型检查以加速构建（CI 已单独校验）
ENV ESLINT_SKIP_DURING_BUILD=true
# 若需开启严格构建可移除下面这行
# ENV SKIP_TYPE_CHECK=true

RUN npm run build

# ==================== 阶段 3: runner ====================
# 最终运行镜像，仅保留 standalone 产物，体积最小化
FROM node:20-alpine AS runner

WORKDIR /app

# 生产环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 创建非 root 用户运行应用，提升安全性
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# 复制 standalone 运行时（含精简的 node_modules 与 server.js）
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# standalone 模式不会自动包含 static 与 public，需手动复制
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# 健康检查：访问 Next.js 内置根路径
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
