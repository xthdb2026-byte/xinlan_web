# 阿里云 ECS 部署指导 · 新蓝恒成网站

> 本文档指导你从零开始，在阿里云 ECS 上完成新蓝恒成网站的部署。覆盖：账号注册 → 实例创建 → 安全配置 → 上传部署包 → 启动服务 → 域名备案 → HTTPS → 监控运维 → 费用优化 → 常见问题。
>
> 通用部署（环境变量、PM2 命令、Nginx 配置等）请配合阅读根目录的 [DEPLOY.md](../DEPLOY.md)。本文档只补充阿里云平台特有的操作。

---

## 目录

- [1. 账户注册与登录](#1-账户注册与登录)
- [2. 核心功能模块概览](#2-核心功能模块概览)
- [3. 创建 ECS 实例（计算资源）](#3-创建-ecs-实例计算资源)
- [4. 网络配置（VPC 与安全组）](#4-网络配置vpc-与安全组)
- [5. 存储服务（云盘与 OSS）](#5-存储服务云盘与-oss)
- [6. 远程连接 ECS](#6-远程连接-ecs)
- [7. 上传部署包到服务器](#7-上传部署包到服务器)
- [8. 执行部署并启动服务](#8-执行部署并启动服务)
- [9. 域名与备案](#9-域名与备案)
- [10. 配置 HTTPS](#10-配置-https)
- [11. 安全管理](#11-安全管理)
- [12. 监控与备份](#12-监控与备份)
- [13. 费用监控与优化策略](#13-费用监控与优化策略)
- [14. 常见问题与解决方案](#14-常见问题与解决方案)
- [15. 进阶：高可用与扩展](#15-进阶高可用与扩展)

---

## 1. 账户注册与登录

### 1.1 注册阿里云账号

1. 访问 [阿里云官网](https://www.aliyun.com)，右上角点击 **免费注册**。
2. 选择注册方式：手机号 / 邮箱 / 支付宝 / 钉钉 / 企业钉钉。
   - **个人用户**：手机号最快，1 分钟完成。
   - **企业用户**：推荐用企业支付宝或钉钉，便于后续开发票。
3. 设置登录密码（8–20 位，含字母+数字）并完成短信验证。
4. 登录控制台：[https://console.aliyun.com](https://console.aliyun.com)

### 1.2 实名认证（必需）

国内服务器、域名、备案都要求实名认证：

1. 控制台右上角头像 → **实名认证**。
2. 选择 **个人认证** 或 **企业认证**。
   - 个人：上传身份证正反面 + 人脸识别，5 分钟内通过。
   - 企业：上传营业执照、法人身份证，1 个工作日内审核。
3. 通过后才能购买中国大陆地域的 ECS、备案域名、申请 SSL 证书。

### 1.3 开启 MFA 二次验证（强烈推荐）

控制台 → 头像 → **安全信息管理** → **虚拟 MFA**，用阿里云 App 或 Google Authenticator 扫码绑定。防止账号被盗后服务器被恶意销毁。

### 1.4 充值与付费方式

- **预付费（包年包月）**：长期使用更便宜，适合 7×24 在线网站。
- **按量付费**：按秒计费，可随时释放，适合测试。
- 控制台 → **费用与成本** → **充值**，建议首次充 100 元试水。

---

## 2. 核心功能模块概览

阿里云控制台左上角有产品导航，部署本网站只需要关注以下模块：

| 模块 | 服务名 | 用途 | 本项目是否需要 |
|------|--------|------|----------------|
| 计算 | 云服务器 ECS | 跑前后端 Node 进程 | ✅ 必需 |
| 网络 | 专有网络 VPC | 隔离内网环境 | ✅ 必需（自动创建） |
| 网络 | 安全组 | 开放 80/443/22 端口 | ✅ 必需 |
| 存储 | 云盘 | ECS 系统盘/数据盘 | ✅ 必需（默认随 ECS） |
| 存储 | 对象存储 OSS | 中转部署包、存备份 | ⚪ 可选 |
| 安全 | 云盾 DDoS / 安骑士 | 防攻击、入侵检测 | ⚪ 可选（基础版免费） |
| 安全 | SSL 证书 | HTTPS | ✅ 推荐 |
| 监控 | 云监控 | CPU/内存/带宽告警 | ✅ 推荐（免费版够用） |
| 域名与网站 | 域名 / ICP 备案 | 绑定域名 | ✅ 若用域名 |
| 费用 | 费用中心 | 预算/账单/告警 | ✅ 推荐 |

---

## 3. 创建 ECS 实例（计算资源）

### 3.1 进入创建页面

控制台 → **云服务器 ECS** → **实例** → **创建实例**。

### 3.2 关键配置项

| 配置项 | 推荐选择 | 说明 |
|--------|---------|------|
| **计费方式** | 包年包月（生产）/ 按量付费（测试） | 包年包月至少 1 个月起 |
| **地域** | 华北 2（北京） / 华东 1（杭州） | 选离用户最近的地域，备案后才能用中国大陆地域 |
| **实例规格** | ecs.t6-c1m2.large（2 核 2G，约 ¥80/月） | 流量小可降为 t6-c1m1；访问量大建议 ecs.c7-large |
| **镜像** | Ubuntu 22.04 64 位（系统盘版） | 本项目依赖 Node 20，Ubuntu 装机脚本已就绪 |
| **系统盘** | ESSD Entry / 高效云盘 40 GB | 约 ¥15/月，足够 |
| **带宽** | 按固定带宽 1 Mbps（约 ¥23/月） | 静态资源走 OSS/CND 可降低；按流量计费适合流量波动大 |
| **安全组** | 新建并勾选 HTTP(80)、HTTPS(443)、SSH(22) | 见第 4 节详细配置 |
| **公网 IP** | 分配弹性公网 IP（EIP） | 必选，否则无法外网访问 |
| **登录凭证** | 密钥对（推荐）> 自定义密码 | 密钥对更安全，本地保管 .pem 文件 |
| **实例名称** | xinlan-web-prod | 便于识别 |

### 3.3 高级选项（可选）

- **实例自定义数据（User Data）**：可粘贴脚本开机自动执行。本项目用 `install.sh` 手动执行更可控，建议留空。
- **标签**：加 `env=prod` `app=xinlan-web`，便于按标签筛选和分账。
- **资源组**：企业多项目时按资源组分账。

### 3.4 确认下单

确认配置 → 阅读服务协议 → **创建实例** → 等待 1–3 分钟状态变为 **运行中**。

记录下：
- **公网 IP**：例如 `47.92.xx.xx`
- **实例 ID**：i-bp1xxxxx
- **密钥对 .pem 文件路径**（本地保存）

---

## 4. 网络配置（VPC 与安全组）

### 4.1 VPC（自动创建）

创建 ECS 时若不指定，系统会自动创建默认 VPC + 交换机（vSwitch）。生产环境建议自建 VPC：

控制台 → **专有网络 VPC** → **创建专有网络**：
- 网段：`192.168.0.0/16`（默认）
- 交换机网段：`192.168.1.0/24`
- 创建后回到 ECS 创建实例时选择该 VPC。

### 4.2 安全组（关键）

安全组 = 云平台级防火墙，比服务器 iptables 更早拦截。

控制台 → **ECS** → **网络与安全** → **安全组** → 创建并配置入方向规则：

| 协议 | 端口范围 | 授权对象 | 说明 |
|------|---------|---------|------|
| TCP | 22 | 你的本地公网 IP/32（如 `1.2.3.4/32`） | SSH，**不建议对 0.0.0.0/0 开放** |
| TCP | 80 | 0.0.0.0/0 | HTTP |
| TCP | 443 | 0.0.0.0/0 | HTTPS |
| TCP | 3000 | 仅内网 VPC 网段 `192.168.0.0/16` | 前端调试，生产关闭 |
| TCP | 3001 | 仅内网 VPC 网段 `192.168.0.0/16` | 后端 API，仅 Nginx 反代访问 |
| ICMP | -/- | 0.0.0.0/0 | 允许 ping |

> ⚠️ **千万不要把 3000/3001 端口对公网开放**，否则数据库和管理后台直接暴露。生产环境只走 Nginx 80/443 反代。

### 4.3 弹性公网 IP（EIP）

若创建 ECS 时选了"按使用流量"或"按固定带宽"，已自动绑定 EIP。也可单独购买 EIP 再绑定到 ECS（便于实例释放时保留 IP）：

控制台 → **弹性公网 IP** → 申请新 EIP → 绑定到 ECS 实例。

---

## 5. 存储服务（云盘与 OSS）

### 5.1 云盘

- **系统盘**：装操作系统，40 GB 足够。
- **数据盘**（可选）：若 uploads 目录会存大量图片，建议加 20 GB 数据盘挂载到 `/mnt/data`，把 backend/uploads 软链过去：
  ```bash
  sudo mkfs.ext4 /dev/vdb
  sudo mkdir -p /mnt/data
  sudo mount /dev/vdb /mnt/data
  echo '/dev/vdb /mnt/data ext4 defaults 0 2' | sudo tee -a /etc/fstab
  sudo systemctl daemon-reload
  sudo mount -a
  # 然后在项目目录里
  cd /opt/xinlan_web/backend
  rm -rf uploads && ln -s /mnt/data/uploads uploads
  ```
- **快照**：每天自动备份系统盘。控制台 → ECS → 存储与快照 → 自动快照策略 → 关联到系统盘。

### 5.2 OSS（可选，用于大文件/CDN 加速）

控制台 → **对象存储 OSS** → 创建 Bucket：
- 名称：`xinlan-assets`
- 地域：与 ECS 相同（如 oss-cn-beijing）
- 读写权限：**公共读**（图片资源）+ 私有 Bucket（备份）

用 OSS 中转部署包示例：

```bash
# 本地上传
ossutil cp xinlan_deploy_20260816.tar.gz oss://xinlan-assets/deploy/

# 服务器下载（内网免流量费，速度 1 Gbps）
wget http://xinlan-assets.oss-cn-beijing-internal.aliyuncs.com/deploy/xinlan_deploy_20260816.tar.gz
```

---

## 6. 远程连接 ECS

### 6.1 方式一：控制台 Workbench（最方便）

控制台 → ECS → 实例列表 → 找到实例 → **远程连接** → **Workbench 远程连接** → 输入密码或选择密钥对。无需本地 SSH 客户端，浏览器即可登录。

### 6.2 方式二：本地 SSH（推荐）

```bash
# 1. 设置密钥权限（macOS/Linux）
chmod 400 ~/Downloads/xinlan-key.pem

# 2. 连接（默认用户 ubuntu）
ssh -i ~/Downloads/xinlan-key.pem ubuntu@47.92.xx.xx

# CentOS 镜像默认用户为 root
ssh -i ~/Downloads/xinlan-key.pem root@47.92.xx.xx
```

### 6.3 SSH 配置免密（推荐）

本地 `~/.ssh/config` 添加：

```
Host xinlan-prod
  HostName 47.92.xx.xx
  User ubuntu
  IdentityFile ~/Downloads/xinlan-key.pem
  ServerAliveInterval 60
```

之后只需 `ssh xinlan-prod` 即可登录。

### 6.4 忘记密码 / 密钥丢失

控制台 → 实例 → **更多** → **密码/密钥** → **重置实例密码** → 重启实例生效。重置密码需停止实例，约 2 分钟。

---

## 7. 上传部署包到服务器

### 7.1 方式一：scp 直传（小文件推荐）

```bash
# 本地执行（密钥认证）
scp -i ~/Downloads/xinlan-key.pem \
    /Users/huang/Desktop/xinlan_web/release/xinlan_deploy_20260816.tar.gz \
    ubuntu@47.92.xx.xx:/opt/
```

### 7.2 方式二：OSS 中转（大文件推荐）

参见第 5.2 节，内网下载免流量费，速度比 scp 快 10 倍。

### 7.3 方式三：Workbench 上传

Workbench 顶部菜单 → **上传/下载文件** → 拖拽文件即可。适合 100 MB 以下。

### 7.4 方式四：git clone（用源码构建）

```bash
# 服务器上
sudo apt install -y git
git clone https://github.com/yourname/xinlan_web.git /opt/xinlan_web
cd /opt/xinlan_web
# 然后按 DEPLOY.md 用 Docker 或 PM2 部署
```

---

## 8. 执行部署并启动服务

### 8.1 解压部署包

```bash
sudo mkdir -p /opt/xinlan_web
sudo tar zxf /opt/xinlan_deploy_20260816.tar.gz -C /opt/xinlan_web --strip-components=1
cd /opt/xinlan_web
ls -la
# 应看到 install.sh / quick_start.sh / backend/ / frontend/ / ecosystem.config.js 等
```

### 8.2 方案 A：一键完整安装（推荐首次部署）

```bash
sudo ./install.sh
```

脚本自动完成：
1. 安装 Node.js 20、PM2、Nginx
2. 安装后端依赖 + 初始化 SQLite + 写入种子数据
3. 启动前后端 PM2 进程并配置开机自启
4. 部署 Nginx 反向代理配置

完成后访问 `http://47.92.xx.xx` 即可看到网站。

### 8.3 方案 B：手动分步执行（更可控）

```bash
# 1. 安装 Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. 安装 PM2
sudo npm install -g pm2

# 3. 配置环境变量
cp .env.production.example .env.production
sudo nano .env.production
#   必改：JWT_SECRET= 用 openssl rand -hex 32 生成
#   必改：FRONTEND_URL= http://你的域名或IP

# 4. 安装后端依赖 + 数据库
cd backend
sudo npm ci --omit=dev
npx prisma generate
npx prisma db push --accept-data-loss
npx tsx prisma/seed.ts
cd ..

# 5. 启动 PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd   # 按提示执行输出的 sudo 命令

# 6. 安装并配置 Nginx
sudo apt install -y nginx
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/xinlan.conf
sudo ln -sf /etc/nginx/sites-available/xinlan.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 8.4 验证部署

```bash
pm2 status                    # 前后端 online
curl http://localhost:3001/health
curl -I http://localhost:3000
```

浏览器访问 `http://公网IP`，应看到首页；`http://公网IP/admin` 进入后台（admin/admin123，**登录后立即修改密码**）。

---

## 9. 域名与备案

### 9.1 购买域名

控制台 → **域名** → 注册新域名（`.com` 约 ¥55/年）或转入已有域名。

### 9.2 ICP 备案（必需，使用中国大陆服务器）

> 没备案的域名不能解析到中国大陆 ECS，否则阿里云会拦截访问。

控制台 → **ICP 备案** → 新增备案 → 按提示上传身份证、人脸识别、填写网站信息。审批 7–20 个工作日。

期间网站可以先用 IP 访问测试。备案通过后会收到短信和邮件，收到备案号后才能解析域名。

### 9.3 域名解析

控制台 → **云解析 DNS** → 选择域名 → **解析设置** → **添加记录**：

| 记录类型 | 主机记录 | 记录值 | TTL |
|---------|---------|--------|------|
| A | @ | 47.92.xx.xx | 600 |
| A | www | 47.92.xx.xx | 600 |

解析生效后，编辑服务器的 `.env.production`：

```
FRONTEND_URL=https://www.yourdomain.com
```

并修改 Nginx 配置中的 `server_name`，重启：
```bash
pm2 restart xinlan-backend
sudo nginx -s reload
```

---

## 10. 配置 HTTPS

### 方案 A：阿里云免费 SSL 证书（推荐，1 年免费）

1. 控制台 → **数字证书管理服务**（原 SSL 证书）→ **免费证书** → **立即购买**（0 元，每年 20 个额度）。
2. 创建证书 → 填写 `www.yourdomain.com` → 提交申请（DNS 自动验证，10 分钟内签发）。
3. 下载证书 → 选 **Nginx** 类型 → 上传到服务器：
   ```bash
   scp -i ~/Downloads/xinlan-key.pem \
       www.yourdomain.com_nginx.zip \
       ubuntu@47.92.xx.xx:/tmp/
   ```
4. 服务器解压安装：
   ```bash
   sudo mkdir -p /etc/nginx/ssl
   cd /tmp && unzip www.yourdomain.com_nginx.zip
   sudo mv *.pem /etc/nginx/ssl/fullchain.pem
   sudo mv *.key /etc/nginx/ssl/privkey.key
   sudo chmod 600 /etc/nginx/ssl/privkey.key
   ```
5. 编辑 Nginx 配置，参照 `deploy/nginx.conf.example` 末尾的 HTTPS server 段，把 `ssl_certificate` 和 `ssl_certificate_key` 指向上述路径，`server_name` 改为域名。
6. `sudo nginx -t && sudo systemctl reload nginx`。

### 方案 B：Let's Encrypt（免费自动续期）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d www.yourdomain.com -d yourdomain.com
# 自动修改 Nginx 配置 + 设置定时续期
```

续期验证：`sudo certbot renew --dry-run`

---

## 11. 安全管理

### 11.1 安全组最小化原则

定期检查安全组规则，关闭不需要的端口（如临时开过的 3000/3001）。

### 11.2 SSH 加固

```bash
sudo nano /etc/ssh/sshd_config
# 修改
PermitRootLogin no              # 禁止 root 直接登录
PasswordAuthentication no       # 仅密钥登录（确认密钥可用后再关）
Port 22022                      # 改默认端口（可选，需同步改安全组）
sudo systemctl restart sshd
```

### 11.3 阿里云安骑士（免费版）

控制台 → **云安全中心**（安骑士）→ 自动开启基础版（免费）：
- 暴力破解拦截
- 异常登录告警
- 漏洞扫描

### 11.4 DDoS 基础防护（免费）

阿里云为每个公网 IP 提供 5 Gbps 的免费 DDoS 防护，超过会自动黑洞 30 分钟。控制台 → **DDoS 防护** → 查看流量曲线。

### 11.5 数据库备份

本项目用 SQLite 单文件，定时快照 + OSS 双保险：

```bash
# crontab -e 添加每日 3 点备份到 OSS
0 3 * * * /usr/bin/ossutil cp /opt/xinlan_web/backend/prisma/prod.db oss://xinlan-backups/prod-$(date +\%Y\%m\%d).db
```

---

## 12. 监控与备份

### 12.1 云监控（免费）

控制台 → **云监控** → 主机监控 → 自动安装插件（默认已装）。可查看：
- CPU 使用率
- 内存使用率
- 磁盘使用率
- 公网带宽
- 进程状态

设置告警：CPU > 80% 持续 5 分钟 → 短信 + 邮件通知。

### 12.2 PM2 监控

```bash
pm2 monit                  # 实时 CPU/内存面板
pm2 logs --lines 100       # 查看最近日志
pm2 install pm2-logrotate   # 日志切割，避免无限增长
pm2 set pm2-logrotate:max_size 10M
```

### 12.3 日志服务 SLS（进阶）

生产环境推荐把 Nginx 访问日志、应用日志接入 SLS，支持全文检索和告警。控制台 → **日志服务 SLS** → 创建 Project → Logtail 采集。

### 12.4 自动快照策略

ECS → 存储与快照 → **自动快照策略** → 创建：
- 策略名：每日备份
- 重复时间：每天 03:00
- 保留：7 天
- 关联到 ECS 系统盘

---

## 13. 费用监控与优化策略

### 13.1 主要费用构成

| 资源 | 规格 | 包年包月价格（参考） |
|------|------|---------------------|
| ECS 2C2G | ecs.t6-c1m2.large | ¥80/月 |
| 系统盘 40GB | ESSD Entry | ¥15/月 |
| 带宽 1Mbps | 按固定带宽 | ¥23/月 |
| 域名 .com | 1 年 | ¥55/年 |
| SSL 证书 | 免费 | ¥0 |
| OSS | 20GB + 流量 | 约 ¥5/月 |
| **合计** | - | **约 ¥125/月** |

### 13.2 预算告警

控制台 → **费用与成本** → **预算管理** → **预算告警** → 设置月度预算 ¥150 → 80% 时短信告警。

### 13.3 优化策略

1. **包年包月代替按量付费**：长期用包年，可省 30%–50%，1 年 8.5 折、3 年 5 折。
2. **抢占式实例**（仅适合无状态计算节点）：价格降到 1 折，但 1 小时内可能被回收。
3. **预留实例券 RI**：承诺 1 年使用，自动抵扣按量付费，灵活又便宜。
4. **节省计划 SP**：承诺计算资源使用量，比 RI 更灵活，最高 7 折。
5. **带宽优化**：
   - 静态资源走 OSS + CDN，ECS 只开 1Mbps 走 API 即可。
   - 流量波动大用按使用流量计费（0.8 元/GB），固定 5Mbps 以下用按固定带宽。
6. **存储优化**：
   - 不用的快照及时删除（0.15 元/GB/月）。
   - OSS 用低频访问存储类型（半价）。
7. **小实例规格足够**：本项目实测 2C2G 在 1000 PV/天 流量下 CPU < 10%，可先从小规格起步。
8. **关注双 11、618**：阿里云常年最大力度促销，囤 3 年代金券。

### 13.4 账单分析

控制台 → **费用与成本** → **账单** → 按产品/标签筛选，识别异常增长。可设置标签分账（如 `env=prod`、`project=xinlan`）。

---

## 14. 常见问题与解决方案

### Q1：访问公网 IP 没反应（超时）

排查顺序：
1. 安全组是否开放 80 端口？ → 安全组规则检查入方向 TCP:80 = 0.0.0.0/0。
2. Nginx 是否运行？ → `sudo systemctl status nginx`。
3. 实例是否在运行？ → 控制台看实例状态。
4. 公网 IP 是否正确？ → 控制台查看 EIP 是否绑定。

### Q2：域名访问被阿里云拦截（备案提示）

- 域名未备案 → 完成 ICP 备案（见第 9 节）。
- 备案通过但解析未生效 → 等 10 分钟或换 DNS（1.2.3.3 / 8.8.8.8）测试。
- 备案信息与实际网站不符 → 控制台变更备案。

### Q3：CPU 100%、网站卡顿

```bash
top                       # 看哪个进程吃 CPU
pm2 monit                 # 看前后端进程状态
pm2 logs --lines 50       # 是否有异常日志
```

常见原因：
- 后端死循环 → 看日志修复代码，`pm2 restart xinlan-backend`。
- 内存泄漏 → `pm2 reload all` 优雅重启。
- 被恶意爬虫刷接口 → 配置 Nginx 限流（limit_req），或开阿里云 WAF。

### Q4：磁盘写满

```bash
df -h                      # 看哪个分区满
du -sh /opt/* 2>/dev/null  # 找大目录
sudo find / -type f -size +500M 2>/dev/null   # 找大文件
```

常见原因：
- PM2 日志无限增长 → 安装 pm2-logrotate。
- 上传图片撑满 uploads → 接入 OSS。
- 旧快照堆积 → 清理 OSS 旧备份。

### Q5：上传图片失败（413 Request Entity Too Large）

Nginx 默认上传上限 1 MB，编辑配置加大：
```nginx
client_max_body_size 20M;
```
重载 `sudo nginx -s reload`。

### Q6：HTTPS 证书过期

- 阿里云免费证书有效期 1 年，到期前 30 天控制台会提醒，重新申请并替换 `/etc/nginx/ssl/` 下文件。
- Let's Encrypt 90 天，certbot 自动续期。验证：`sudo certbot renew --dry-run`。

### Q7：PM2 进程莫名退出

```bash
pm2 describe xinlan-backend | grep -E "restarts|status|exit"
pm2 logs xinlan-backend --err --lines 100
```

常见原因：
- 端口被占用 → `lsof -i:3001` 找占用进程。
- OOM 被杀 → 看内存，加 swap 或升配。
- 数据库连接失败 → 检查 `prod.db` 路径和权限。

### Q8：无法 SSH 连接

1. 安全组 22 端口是否对你 IP 开放？
2. 密钥文件权限是否 400？`chmod 400 xxx.pem`。
3. 实例状态是否运行中？
4. 用户名对不对？Ubuntu 用 `ubuntu`，CentOS 用 `root`。
5. 都不行就用控制台 Workbench 进入排查。

### Q9：备案期间怎么测试网站

备案未通过前用 IP 访问，但阿里云会拦截"通过域名"的访问。临时方案：
- 修改本地 hosts：`47.92.xx.xx www.yourdomain.com` 测试，但要在域名解析前删除该行。
- 或先用境外地域 ECS（如香港、新加坡）测试，无备案要求。

### Q10：网站被打/被刷流量

1. 短期：安全组临时只允许你的 IP 访问。
2. 升级：开阿里云 **DDoS 高防 IP**（收费，¥100+/月起）。
3. 应用层：Nginx 加 limit_req 限流，业务侧加 IP 黑名单。

---

## 15. 进阶：高可用与扩展

### 15.1 数据库迁移到 RDS

流量上来后，把 SQLite 改为阿里云 RDS MySQL/PostgreSQL：
1. RDS 控制台创建实例（基础版 ¥50/月起）。
2. 修改 `backend/prisma/schema.prisma` 的 datasource provider。
3. 修改 `.env.production` 的 `DATABASE_URL`。
4. `npx prisma migrate deploy` 同步表结构。

### 15.2 静态资源走 OSS + CDN

1. 上传 `frontend/standalone/.next/static` 和 `public` 到 OSS Bucket。
2. CDN 控制台 → 添加加速域名 → 回源到 OSS。
3. 修改 `next.config.mjs` 的 `assetPrefix` 指向 CDN 域名。

### 15.3 多实例负载均衡

流量上来后，扩到 2+ 台 ECS，前置 SLB（负载均衡）：
- 控制台 → **负载均衡 SLB** → 创建实例 → 添加后端 ECS。
- 上传 SSL 证书到 SLB，HTTPS 在 SLB 层卸载，ECS 只跑 HTTP。

### 15.4 容器化迁移到 ACK

用根目录的 `docker-compose.yml` 镜像构建后，迁移到阿里云 **容器服务 ACK**：
- 控制台 → **容器服务 ACK** → 创建集群 → 部署 Deployment + Service + Ingress。
- 适合微服务化和自动扩缩容场景。

### 15.5 Serverless（极致省钱）

若访问量极小（每天几十 PV），考虑迁到 **函数计算 FC + API 网关**，按调用次数计费，可能每月 < ¥10。但改造工作量大，不适合动态网站。

---

## 附录：完整上线 Checklist

- [ ] 阿里云账号实名认证
- [ ] 开启 MFA 二次验证
- [ ] 创建 ECS（包年包月、Ubuntu 22.04、2C2G+）
- [ ] 安全组开放 22/80/443，关闭 3000/3001 公网
- [ ] 配置 SSH 密钥登录并禁用密码登录
- [ ] 上传部署包到 `/opt/`
- [ ] 修改 `.env.production` 中 `JWT_SECRET` 和 `FRONTEND_URL`
- [ ] 执行 `sudo ./install.sh`
- [ ] `pm2 status` 确认两服务 online
- [ ] 浏览器访问 `http://公网IP` 见首页
- [ ] `http://公网IP/admin` 登录后台，**立即修改 admin 密码**
- [ ] 配置域名解析到 EIP
- [ ] 完成 ICP 备案
- [ ] 申请并安装 SSL 证书，启用 HTTPS
- [ ] 配置云监控告警（CPU>80%、磁盘>90%）
- [ ] 配置自动快照策略（每日 3:00）
- [ ] 配置预算告警（月度 ¥150）
- [ ] 设置 crontab 备份数据库到 OSS
- [ ] 安装 pm2-logrotate
- [ ] 文档归档：记录 EIP、密钥、域名、证书到期日
