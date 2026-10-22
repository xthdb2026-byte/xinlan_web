# 新蓝恒成网站 · 生产部署指南

> 本文档详细说明如何将新蓝恒成企业官网部署到生产环境，提供 **Node.js + PM2 + Nginx** 与 **Docker Compose** 两套方案，技术人员可任选其一按步骤完成部署。

---

## 目录

- [1. 项目概述](#1-项目概述)
- [2. 系统要求](#2-系统要求)
- [3. 方案一：Node.js + PM2 + Nginx](#3-方案一nodejs--pm2--nginx)
- [4. 方案二：Docker Compose](#4-方案二docker-compose)
- [5. 环境变量说明](#5-环境变量说明)
- [6. Nginx 反向代理配置](#6-nginx-反向代理配置)
- [7. HTTPS 配置](#7-https-配置)
- [8. 验证部署成功](#8-验证部署成功)
- [9. 常见问题排查](#9-常见问题排查)
- [10. 日常运维](#10-日常运维)

---

## 1. 项目概述

### 技术架构

| 层级 | 技术栈 | 端口 | 说明 |
|------|--------|------|------|
| 前端 | Next.js 14 (App Router) + React 18 + Tailwind CSS | 3000 | standalone 模式独立运行 |
| 后端 | Express.js + TypeScript + Prisma ORM | 3001 | 编译后运行 `dist/app.js` |
| 数据库 | SQLite | - | 文件型数据库，零配置 |

### 项目目录结构

```
xinlan_web/
├── frontend/                  # 前端 Next.js 应用
│   ├── app/                   # App Router 页面
│   ├── components/            # React 组件
│   ├── public/                # 静态资源（图片、图标）
│   ├── .next/standalone/      # 构建产物（构建后生成）
│   ├── Dockerfile             # 前端容器构建文件
│   └── next.config.mjs        # Next.js 配置
├── backend/                   # 后端 Express 应用
│   ├── src/                   # TypeScript 源码
│   ├── dist/                  # 编译产物（编译后生成）
│   ├── prisma/                # Prisma schema 与 seed
│   ├── uploads/               # 用户上传图片（运行时生成）
│   ├── Dockerfile             # 后端容器构建文件
│   └── tsconfig.json          # TypeScript 配置
├── deploy/
│   └── nginx.conf.example     # Nginx 反向代理配置示例
├── ecosystem.config.js        # PM2 进程管理配置
├── docker-compose.yml         # Docker Compose 编排
├── .env.production.example    # 环境变量模板
└── DEPLOY.md                  # 本文档
```

---

## 2. 系统要求

### 服务器配置建议

| 资源 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 1 核 | 2 核 |
| 内存 | 1 GB | 2 GB |
| 磁盘 | 10 GB | 20 GB SSD |
| 带宽 | 1 Mbps | 5 Mbps |
| 操作系统 | Ubuntu 20.04+ / CentOS 7+ / Debian 10+ | Ubuntu 22.04 LTS |

### 软件依赖

#### 方案一所需（Node.js 部署）

| 软件 | 版本要求 | 安装命令（Ubuntu） |
|------|---------|-------------------|
| Node.js | ≥ 20.0.0 | 见下方安装步骤 |
| npm | ≥ 10.0.0 | 随 Node.js 安装 |
| PM2 | 最新版 | `npm install -g pm2` |
| Nginx | ≥ 1.18 | `apt install nginx` |

#### 方案二所需（Docker 部署）

| 软件 | 版本要求 | 安装命令 |
|------|---------|---------|
| Docker | ≥ 24.0 | 见 [Docker 官方文档](https://docs.docker.com/engine/install/) |
| Docker Compose | ≥ 2.20 | 随 Docker 安装 |

### 安装 Node.js 20（方案一使用）

```bash
# 使用 NodeSource 仓库安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version    # 应输出 v20.x.x
npm --version     # 应输出 10.x.x

# 安装 PM2 进程管理器
sudo npm install -g pm2

# 安装 Nginx
sudo apt install -y nginx
```

---

## 3. 方案一：Node.js + PM2 + Nginx

> 适合传统云服务器部署，直接在主机上运行 Node.js 进程，PM2 管理进程守护，Nginx 做反向代理。

### 3.1 获取项目代码

```bash
# 方式一：Git 克隆（推荐）
git clone <项目仓库地址> /opt/xinlan_web
cd /opt/xinlan_web

# 方式二：上传打包文件
# 将本地构建好的项目上传到服务器 /opt/xinlan_web
```

### 3.2 配置环境变量

```bash
# 复制环境变量模板
cp .env.production.example .env.production

# 生成强随机 JWT 密钥
openssl rand -hex 32
# 输出示例：a3f5b8c1d2e4...（复制此值）

# 编辑环境变量文件
nano .env.production
```

修改 `.env.production` 中的关键配置：

```bash
# [必须修改] 替换为刚才生成的随机字符串
JWT_SECRET="a3f5b8c1d2e4f6a7b8c9d0e1f2a3b4c5..."

# [必须修改] 生产环境域名（如有）
FRONTEND_URL="https://www.yourdomain.com"

# 数据库路径（默认 backend/prisma/prod.db）
DATABASE_URL="file:./prisma/prod.db"

# 其他配置保持默认即可
```

> **安全提示**：`.env.production` 包含敏感信息，切勿提交到 Git 仓库。项目 `.gitignore` 已默认排除。

### 3.3 构建后端

```bash
cd /opt/xinlan_web/backend

# 安装依赖
npm ci

# 生成 Prisma 客户端
npm run prisma:generate

# 编译 TypeScript
npm run build
# 编译成功后会生成 dist/ 目录

# 初始化数据库（创建表结构）
npx prisma db push

# 填充种子数据（管理员账号、示例内容）
npm run prisma:seed
# 默认管理员账号：admin / admin123（登录后请立即修改密码）
```

验证后端编译产物：

```bash
ls dist/
# 应看到 app.js、routes/、middleware/、lib/、utils/ 等文件
```

### 3.4 构建前端

```bash
cd /opt/xinlan_web/frontend

# 配置前端环境变量
echo 'NEXT_PUBLIC_API_BASE=https://www.yourdomain.com/api' > .env.production
# 如暂无域名，使用服务器 IP：
# echo 'NEXT_PUBLIC_API_BASE=http://YOUR_SERVER_IP:3001/api' > .env.production

# 安装依赖
npm ci

# 生产构建（生成 standalone 输出）
npm run build
```

验证前端构建产物：

```bash
ls .next/standalone/
# 应看到 server.js、package.json、node_modules/

ls .next/static/
# 应看到 chunks/、css/、media/ 目录
```

> **说明**：standalone 模式生成的 `server.js` 是一个独立运行的 Node.js 服务器，已内置最小化的 `node_modules`，无需额外安装依赖。

### 3.5 复制静态资源到 standalone

standalone 模式不会自动包含 `static` 和 `public` 目录，需手动复制：

```bash
cd /opt/xinlan_web/frontend

# 复制静态资源
cp -r .next/static .next/standalone/.next/

# 复制 public 目录
cp -r public .next/standalone/
```

### 3.6 配置 PM2 并启动

```bash
cd /opt/xinlan_web

# 将 .env.production 的变量加载到 PM2 环境
# 编辑 ecosystem.config.js 中的 env_production，确认配置值正确
nano ecosystem.config.js

# 创建日志目录
mkdir -p logs

# 启动服务
pm2 start ecosystem.config.js --env production

# 查看进程状态
pm2 status
# 应看到 xinlan-backend 和 xinlan-frontend 两个进程状态为 online

# 查看日志
pm2 logs

# 保存进程列表（用于开机自启）
pm2 save

# 设置开机自启
pm2 startup
# 按照终端输出的提示执行返回的 sudo 命令
```

### 3.7 验证服务可用

```bash
# 测试后端 API
curl http://localhost:3001/health
# 应返回：{"status":"ok","timestamp":"..."}

# 测试前端页面
curl -I http://localhost:3000
# 应返回：HTTP/1.1 200 OK
```

---

## 4. 方案二：Docker Compose

> 适合容器化环境，一键启动前后端 + 数据持久化，环境隔离性更好。

### 4.1 获取项目代码

```bash
git clone <项目仓库地址> /opt/xinlan_web
cd /opt/xinlan_web
```

### 4.2 配置环境变量

```bash
# 复制环境变量模板
cp .env.production.example .env

# 生成 JWT 密钥
openssl rand -hex 32

# 编辑 .env 文件
nano .env
```

修改 `.env` 中的关键配置：

```bash
# [必须修改] JWT 密钥
JWT_SECRET="a3f5b8c1d2e4f6a7b8c9d0e1f2a3b4c5..."

# [必须修改] 前端访问地址（用于 CORS）
FRONTEND_URL="https://www.yourdomain.com"

# 前端调用的后端 API 地址（如使用 Nginx 反代，通常与前端同域）
NEXT_PUBLIC_API_BASE="https://www.yourdomain.com/api"

# 其他保持默认
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### 4.3 构建并启动

```bash
cd /opt/xinlan_web

# 构建镜像并后台启动（首次构建约 3-5 分钟）
docker compose --env-file .env up -d --build

# 查看容器状态
docker compose ps
# 应看到两个容器状态为 healthy

# 查看实时日志
docker compose logs -f

# 仅查看后端日志
docker compose logs -f backend

# 仅查看前端日志
docker compose logs -f frontend
```

### 4.4 数据库初始化

后端容器启动时会自动执行以下操作（在 Dockerfile CMD 中定义）：

1. `prisma db push` - 同步数据库表结构
2. `tsx prisma/seed.ts` - 填充种子数据（幂等，使用 upsert，可安全重复执行）
3. `node dist/app.js` - 启动 Express 服务

如需手动重新初始化数据库：

```bash
# 进入后端容器执行
docker compose exec backend npx prisma db push --accept-data-loss
docker compose exec backend npx tsx prisma/seed.ts
```

### 4.5 验证服务可用

```bash
# 测试后端
curl http://localhost:3001/health

# 测试前端
curl -I http://localhost:3000
```

### 4.6 Docker 常用命令

```bash
# 停止所有服务
docker compose down

# 停止并删除数据卷（⚠️ 会丢失数据库和上传的图片）
docker compose down -v

# 重新构建（代码更新后）
docker compose up -d --build

# 查看容器资源占用
docker stats xinlan-backend xinlan-frontend

# 进入容器调试
docker compose exec backend sh
docker compose exec frontend sh
```

---

## 5. 环境变量说明

### 后端环境变量

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `DATABASE_URL` | 是 | `file:./prisma/prod.db` | SQLite 数据库文件路径。MySQL 示例：`mysql://user:pass@host:3306/dbname` |
| `JWT_SECRET` | **是** | - | JWT 签名密钥，**必须**修改为强随机字符串。生成命令：`openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | 否 | `7d` | JWT 过期时间，支持 `7d`/`12h`/`30m` 等格式 |
| `PORT` | 否 | `3001` | 后端服务监听端口 |
| `FRONTEND_URL` | 是 | `http://localhost:3000` | 前端访问地址，用于 CORS 白名单和 Cookie 跨域配置 |
| `RATE_LIMIT_WINDOW_MS` | 否 | `900000` | 限流时间窗口（毫秒，默认 15 分钟） |
| `RATE_LIMIT_MAX` | 否 | `100` | 单 IP 在时间窗口内最大请求数 |

### 前端环境变量

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `PORT` | 否 | `3000` | 前端服务监听端口 |
| `NODE_ENV` | 否 | `production` | 运行模式，生产环境必须为 `production` |
| `HOSTNAME` | 否 | `0.0.0.0` | 监听地址，服务器/容器需设为 `0.0.0.0` 以接受外部访问 |
| `NEXT_PUBLIC_API_BASE` | 是 | `http://localhost:3001/api` | 后端 API 基础地址。**注意**：此变量在 Next.js 构建时注入，运行时修改需重新构建 |

> **重要**：`NEXT_PUBLIC_API_BASE` 是构建时变量。如需修改后端地址，必须重新执行 `npm run build`。Docker 方案通过 `docker-compose.yml` 中的 `build.args` 在构建时注入。

---

## 6. Nginx 反向代理配置

> Nginx 用于统一入口（80/443 端口），将 `/api/` 和 `/uploads/` 转发到后端，其余请求转发到前端。

### 6.1 部署配置文件

```bash
# 复制配置示例
sudo cp /opt/xinlan_web/deploy/nginx.conf.example /etc/nginx/sites-available/xinlan.conf

# 编辑配置，将 example.com 替换为实际域名
sudo nano /etc/nginx/sites-available/xinlan.conf
# 修改 server_name www.example.com example.com; 为实际域名
# 如无域名，使用服务器 IP：server_name _;

# 创建软链启用站点
sudo ln -s /etc/nginx/sites-available/xinlan.conf /etc/nginx/sites-enabled/

# 测试配置语法
sudo nginx -t
# 应输出：configuration file /etc/nginx/nginx.conf test is successful

# 重载 Nginx
sudo nginx -s reload
```

### 6.2 配置说明

Nginx 配置实现了以下路由规则：

| 路径 | 转发目标 | 说明 |
|------|---------|------|
| `/api/*` | `127.0.0.1:3001` | 后端 API 接口 |
| `/health` | `127.0.0.1:3001/health` | 后端健康检查 |
| `/uploads/*` | `127.0.0.1:3001` | 用户上传的图片（7 天缓存） |
| `/_next/static/*` | `127.0.0.1:3000` | Next.js 静态资源（1 年缓存） |
| `/*` | `127.0.0.1:3000` | 前端 Next.js 应用 |

安全配置：gzip 压缩、安全响应头、上传文件大小限制（10MB）、敏感文件访问拒绝。

---

## 7. HTTPS 配置

> 强烈建议生产环境启用 HTTPS。使用 Let's Encrypt 免费证书。

### 7.1 安装 Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 申请并配置 SSL 证书

```bash
# 确保域名已解析到服务器 IP，且 Nginx 已配置该域名
sudo certbot --nginx -d www.yourdomain.com -d yourdomain.com

# 按提示操作：
# 1. 输入邮箱（用于证书到期提醒）
# 2. 同意服务条款
# 3. 选择是否重定向 HTTP 到 HTTPS（选择是）
```

### 7.3 验证 HTTPS

```bash
# 测试 HTTPS 访问
curl -I https://www.yourdomain.com
# 应返回：HTTP/2 200

# 测试 HTTP 自动跳转
curl -I http://www.yourdomain.com
# 应返回：301 Moved Permanently，Location: https://...
```

### 7.4 自动续期

Let's Encrypt 证书有效期 90 天，certbot 会自动设置定时续期任务。验证：

```bash
# 测试续期流程
sudo certbot renew --dry-run

# 查看定时任务
sudo systemctl list-timers | grep certbot
```

### 7.5 HTTPS 后的环境变量更新

启用 HTTPS 后，需更新后端环境变量：

```bash
# 编辑环境变量
nano /opt/xinlan_web/.env.production
# 修改：
# FRONTEND_URL="https://www.yourdomain.com"

# 重启后端
pm2 restart xinlan-backend
```

---

## 8. 验证部署成功

### 8.1 服务状态验证

```bash
# 方案一：PM2
pm2 status
# 确认 xinlan-backend 和 xinlan-frontend 状态为 online

# 方案二：Docker
docker compose ps
# 确认两个容器状态为 healthy
```

### 8.2 接口可用性验证

```bash
# 后端健康检查
curl http://localhost:3001/health
# 期望返回：{"status":"ok","timestamp":"2026-..."}

# 后端 API 测试（获取新闻列表）
curl http://localhost:3001/api/news
# 期望返回：{"code":"OK","data":{"items":[...],"pagination":{...}}}

# 前端页面测试
curl -I http://localhost:3000
# 期望返回：HTTP/1.1 200 OK

# Nginx 入口测试（部署 Nginx 后）
curl -I http://localhost
# 期望返回：HTTP/1.1 200 OK

# 域名访问测试（配置域名后）
curl -I https://www.yourdomain.com
# 期望返回：HTTP/2 200
```

### 8.3 功能验证清单

在浏览器中打开网站，按以下清单验证核心功能：

| 验证项 | 操作方式 | 预期结果 |
|--------|---------|---------|
| 首页加载 | 访问 `/` | 页面正常渲染，图片加载正常 |
| 新闻列表 | 访问 `/news` | 显示新闻列表 |
| 新闻详情 | 点击任意新闻 | 进入详情页，浏览量自增 |
| 产品列表 | 访问 `/products` | 显示产品列表 |
| 全站搜索 | 点击导航栏搜索图标 | 搜索功能正常 |
| 管理后台 | 访问 `/admin/login` | 登录页正常显示 |
| 后台登录 | 使用 admin/admin123 | 登录成功，进入仪表盘 |
| 媒体上传 | 后台 → 媒体库 → 上传图片 | 上传成功，图片显示 |
| SEO | 访问 `/sitemap.xml` | 返回 XML 格式站点地图 |
| robots | 访问 `/robots.txt` | 返回 robots 规则 |

### 8.4 日志检查

```bash
# 方案一：PM2 日志
pm2 logs --lines 50
# 检查是否有 error 级别日志

# 方案二：Docker 日志
docker compose logs --tail 50
# 检查是否有异常

# Nginx 访问日志
sudo tail -f /var/log/nginx/access.log

# Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
```

---

## 9. 常见问题排查

### Q1：前端访问返回 502 Bad Gateway

**原因**：前端服务未启动或已崩溃。

**排查步骤**：

```bash
# 检查前端进程状态
pm2 status                    # 方案一
docker compose ps              # 方案二

# 查看前端日志
pm2 logs xinlan-frontend --lines 30
docker compose logs --tail 30 frontend

# 常见原因：
# 1. standalone 目录缺少 static/public（方案一）
#    解决：重新执行 3.5 步骤复制静态资源
# 2. 端口被占用
#    解决：lsof -i :3000 查看占用进程，kill 或更换端口
```

### Q2：API 请求返回 CORS 错误

**原因**：后端 `FRONTEND_URL` 未正确配置。

**解决**：

```bash
# 确认 .env.production 中 FRONTEND_URL 与实际访问地址一致
# 如前端通过 https://www.yourdomain.com 访问
# 则 FRONTEND_URL="https://www.yourdomain.com"

# 修改后重启后端
pm2 restart xinlan-backend      # 方案一
docker compose restart backend   # 方案二
```

### Q3：管理后台登录失败

**排查步骤**：

```bash
# 确认数据库已初始化种子数据
cd /opt/xinlan_web/backend

# 方案一
npx prisma db push
npm run prisma:seed

# 方案二
docker compose exec backend npx tsx prisma/seed.ts

# 默认账号：admin / admin123
# 如需修改密码，登录后台后在用户管理中修改
```

### Q4：图片上传失败（413 Request Entity Too Large）

**原因**：Nginx 默认上传限制为 1MB。

**解决**：nginx.conf.example 已配置 `client_max_body_size 10m`，确认已应用：

```bash
# 检查 Nginx 配置
sudo nginx -t
sudo nginx -s reload

# 或在 Nginx 配置的 server 块中添加
# client_max_body_size 10m;
```

### Q5：数据库文件丢失（Docker）

**原因**：Docker 容器重建后数据未持久化。

**解决**：确认 docker-compose.yml 中 volume 挂载正确：

```yaml
volumes:
  - backend-data:/app/data        # 数据库文件
  - backend-uploads:/app/uploads  # 上传的图片
```

查看数据卷位置：

```bash
docker volume inspect xinlan_web_backend-data
# 挂载点在 /var/lib/docker/volumes/...
```

### Q6：Next.js 页面显示 "Cannot find module"

**原因**：开发服务器运行中执行了 `next build`，导致 `.next` 缓存冲突。

**解决**：

```bash
# 停止服务
pm2 stop xinlan-frontend

# 清理缓存重新构建
cd /opt/xinlan_web/frontend
rm -rf .next
npm run build

# 重新复制静态资源
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

# 重启
pm2 restart xinlan-frontend
```

### Q7：sharp 模块报错（图片处理失败）

**原因**：sharp 原生模块在 Alpine Linux 上缺少依赖。

**解决**：

```bash
# Docker 方案：Dockerfile 已安装 vips-dev，如仍报错，重建镜像
docker compose build --no-cache backend

# PM2 方案：重新安装 sharp
cd /opt/xinlan_web/backend
npm rebuild sharp
```

### Q8：时区不正确（日志时间偏差）

**解决**：设置服务器时区为东八区：

```bash
sudo timedatectl set-timezone Asia/Shanghai
timedatectl  # 验证

# Docker 方案：在 docker-compose.yml 的 environment 中添加
# - TZ=Asia/Shanghai
```

---

## 10. 日常运维

### 10.1 代码更新部署

#### 方案一（PM2）

```bash
cd /opt/xinlan_web

# 拉取最新代码
git pull origin main

# 重新构建后端
cd backend
npm ci
npm run prisma:generate
npm run build
npx prisma db push
pm2 restart xinlan-backend

# 重新构建前端
cd ../frontend
npm ci
npm run build
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/
pm2 restart xinlan-frontend
```

#### 方案二（Docker）

```bash
cd /opt/xinlan_web
git pull origin main
docker compose up -d --build
```

### 10.2 数据库备份

```bash
# 创建备份目录
mkdir -p /opt/backups

# 备份 SQLite 数据库
cp /opt/xinlan_web/backend/prisma/prod.db /opt/backups/prod-$(date +%Y%m%d).db

# 设置定时备份（每天凌晨 3 点）
crontab -e
# 添加：
0 3 * * * cp /opt/xinlan_web/backend/prisma/prod.db /opt/backups/prod-$(date +\%Y\%m\%d).db

# Docker 方案
docker compose exec backend cat /app/data/prod.db > /opt/backups/prod-$(date +%Y%m%d).db
```

### 10.3 日志管理

```bash
# PM2 日志轮转配置
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M        # 单文件最大 10MB
pm2 set pm2-logrotate:retain 30            # 保留 30 个文件
pm2 set pm2-logrotate:compress true        # 压缩旧日志

# Nginx 日志轮转（默认已配置）
sudo logrotate -f /etc/logrotate.d/nginx
```

### 10.4 性能监控

```bash
# PM2 监控面板（实时 CPU/内存）
pm2 monit

# 查看进程详情
pm2 describe xinlan-backend
pm2 describe xinlan-frontend

# Docker 资源监控
docker stats

# 系统资源
htop
df -h        # 磁盘
free -m      # 内存
```

### 10.5 安全加固建议

1. **修改默认密码**：部署后立即登录后台修改 admin 账号密码
2. **防火墙配置**：仅开放 80/443 端口，关闭 3000/3001 外部访问

   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **SSH 安全**：禁止 root 远程登录，使用密钥登录
4. **定期更新**：定期执行 `apt update && apt upgrade`
5. **Fail2ban**：安装防暴力破解工具 `apt install fail2ban`

---

## 附录：快速部署脚本

> 以下脚本整合了方案一的核心步骤，可直接执行（请先修改域名和密钥）。

```bash
#!/bin/bash
set -e

# ===== 配置项（请修改） =====
PROJECT_DIR="/opt/xinlan_web"
DOMAIN="www.yourdomain.com"
JWT_SECRET=$(openssl rand -hex 32)
# ============================

echo "🚀 开始部署新蓝恒成网站..."

# 1. 配置环境变量
cd $PROJECT_DIR
cp .env.production.example .env.production
sed -i "s|CHANGE_ME_TO_A_STRONG_RANDOM_STRING|$JWT_SECRET|g" .env.production
sed -i "s|http://localhost:3000|https://$DOMAIN|g" .env.production

# 2. 构建后端
cd backend
npm ci
npm run prisma:generate
npm run build
npx prisma db push
npm run prisma:seed

# 3. 构建前端
cd ../frontend
echo "NEXT_PUBLIC_API_BASE=https://$DOMAIN/api" > .env.production
npm ci
npm run build
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

# 4. 启动 PM2
cd ..
mkdir -p logs
pm2 start ecosystem.config.js --env production
pm2 save

# 5. 配置 Nginx
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/xinlan.conf
sudo sed -i "s|www.example.com example.com|$DOMAIN|g" /etc/nginx/sites-available/xinlan.conf
sudo ln -sf /etc/nginx/sites-available/xinlan.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo nginx -s reload

echo "✅ 部署完成！"
echo "🔑 JWT_SECRET: $JWT_SECRET"
echo "🌐 访问地址: https://$DOMAIN"
echo "📝 管理后台: https://$DOMAIN/admin (admin/admin123)"
```

---

> 如部署过程中遇到本文档未覆盖的问题，请查看 [常见问题排查](#9-常见问题排查) 或检查服务日志获取详细错误信息。
