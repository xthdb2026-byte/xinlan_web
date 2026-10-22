
### 4.2 数据库设计（核心表结构）

#### 4.2.1 用户表 (users)
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| id | INT (PK) | 用户ID |
| username | VARCHAR(50) | 用户名 |
| password | VARCHAR(255) | 加密密码 |
| role | ENUM('admin','editor') | 角色 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 4.2.2 新闻表 (news)
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| id | INT (PK) | 新闻ID |
| title | VARCHAR(200) | 标题 |
| slug | VARCHAR(200) | SEO友好的URL标识 |
| summary | VARCHAR(500) | 摘要 |
| content | TEXT | 正文内容 |
| cover_image | VARCHAR(255) | 封面图URL |
| category | VARCHAR(50) | 分类（公司动态/行业资讯） |
| tags | VARCHAR(255) | 标签（逗号分隔） |
| status | ENUM('draft','published') | 状态 |
| view_count | INT | 浏览次数 |
| published_at | DATETIME | 发布时间 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 4.2.3 产品表 (products)
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| id | INT (PK) | 产品ID |
| name | VARCHAR(200) | 产品名称 |
| slug | VARCHAR(200) | SEO友好URL |
| category | VARCHAR(50) | 产品分类 |
| description | TEXT | 产品描述 |
| features | JSON | 产品特性（结构化） |
| cover_image | VARCHAR(255) | 封面图 |
| images | JSON | 产品图集 |
| sort_order | INT | 排序 |
| status | ENUM('active','inactive') | 状态 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 4.2.4 解决方案表 (solutions)
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| id | INT (PK) | 方案ID |
| title | VARCHAR(200) | 方案标题 |
| slug | VARCHAR(200) | SEO友好URL |
| industry | VARCHAR(50) | 适用行业 |
| content | TEXT | 方案详情 |
| cover_image | VARCHAR(255) | 封面图 |
| sort_order | INT | 排序 |
| status | ENUM('active','inactive') | 状态 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 4.2.5 招聘表 (jobs)
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| id | INT (PK) | 职位ID |
| title | VARCHAR(100) | 职位名称 |
| department | VARCHAR(50) | 部门 |
| location | VARCHAR(50) | 工作地点 |
| type | ENUM('full-time','part-time','intern') | 工作类型 |
| description | TEXT | 职位描述 |
| requirements | TEXT | 任职要求 |
| status | ENUM('open','closed') | 状态 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 4.2.6 留言表 (messages)
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| id | INT (PK) | 留言ID |
| name | VARCHAR(50) | 姓名 |
| phone | VARCHAR(20) | 电话 |
| email | VARCHAR(100) | 邮箱 |
| company | VARCHAR(100) | 公司名称 |
| content | TEXT | 留言内容 |
| status | ENUM('pending','read','replied') | 处理状态 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 4.2.7 页面配置表 (page_configs)
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| id | INT (PK) | 配置ID |
| page | VARCHAR(50) | 页面标识（如'home'） |
| section | VARCHAR(50) | 区块标识 |
| content | JSON | 区块内容（结构化） |
| updated_at | DATETIME | 更新时间 |

### 4.3 API接口设计（RESTful）
| 接口 | 方法 | 说明 |
| :--- | :--- | :--- |
| `/api/news` | GET | 获取新闻列表（支持分页、分类、标签筛选） |
| `/api/news/:slug` | GET | 获取新闻详情 |
| `/api/products` | GET | 获取产品列表 |
| `/api/products/:slug` | GET | 获取产品详情 |
| `/api/solutions` | GET | 获取解决方案列表 |
| `/api/solutions/:slug` | GET | 获取解决方案详情 |
| `/api/jobs` | GET | 获取招聘职位列表 |
| `/api/jobs/:id` | GET | 获取职位详情 |
| `/api/messages` | POST | 提交留言 |
| `/api/contact` | POST | 提交合作咨询 |
| `/api/admin/*` | * | 后台管理接口（需认证） |

### 4.4 前端页面设计规范
#### 4.4.1 设计稿还原要点
基于 `final_mockup_website.png`：
- **导航栏**：Logo（新蓝恒成）+ 导航菜单（首页、关于我们、产品与服务、解决方案、新闻中心、加入我们、联系我们）+ “合作咨询”按钮
- **Hero区域**：品牌英文名“XINLAN HENGCHENG”+ 中文口号“外稳内动，恒久达成”+ 公司简介文案 + “了解更多→”按钮
- **核心价值区**：4个价值卡片（安全可靠、技术创新、高效协同、客户至上），每个含图标+标题+副标题
- **关于我们入口**：图文展示 + “了解更多”链接

#### 4.4.2 视觉规范建议
| 设计元素 | 建议 |
| :--- | :--- |
| **主色调** | 科技蓝（#1a56db / #2563eb）+ 深色系 |
| **字体** | 中文字体（思源黑体/微软雅黑），英文字体（Inter/Helvetica） |
| **响应式断点** | Desktop (≥1200px)、Tablet (768-1199px)、Mobile (<768px) |

### 4.5 安全方案
| 安全措施 | 说明 |
| :--- | :--- |
| **HTTPS** | 全站强制HTTPS，配置SSL证书 |
| **输入验证** | 所有用户输入进行严格校验，防止XSS、SQL注入 |
| **权限控制** | 后台管理基于角色的访问控制（RBAC） |
| **密码加密** | 使用bcrypt或Argon2加密存储 |
| **接口限流** | 防止暴力破解和DDoS攻击 |
| **日志审计** | 记录关键操作日志 |


## 五、项目管理与交付

### 5.1 项目团队配置
| 角色 | 人数 | 职责 |
| :--- | :--- | :--- |
| 项目经理 | 1 | 项目统筹、进度管理、客户沟通 |
| UI/UX设计师 | 1 | 界面设计、用户体验优化 |
| 前端工程师 | 1-2 | 前端开发、响应式实现 |
| 后端工程师 | 1-2 | API开发、数据库设计、后台管理 |
| 测试工程师 | 1 | 功能测试、兼容性测试、性能测试 |
| 运维工程师 | 1 | 部署、服务器配置、安全维护 |

### 5.2 项目里程碑与排期
| 阶段 | 周期 | 交付物 |
| :--- | :--- | :--- |
| 需求确认 | 1周 | 需求规格说明书确认 |
| UI设计 | 2周 | 全站页面设计稿 |
| 前端开发 | 3-4周 | 响应式页面、交互功能 |
| 后端开发 | 3-4周 | API接口、后台管理系统、数据库 |
| 联调测试 | 1-2周 | 前后端联调、功能测试、性能测试 |
| 部署上线 | 1周 | 生产环境部署、域名解析、SSL配置 |
| **总计** | **11-14周** | — |

### 5.3 预算估算参考
| 费用类别 | 估算范围 | 说明 |
| :--- | :--- | :--- |
| 域名注册 | 500-800元（5年） | .com域名 |
| 云服务器 | 3,000-10,000元/年 | 根据配置 |
| SSL证书 | 0-2,000元/年 | 可用免费证书（Let's Encrypt） |
| 设计费 | 5,000-20,000元 | 根据设计复杂度 |
| 开发费 | 30,000-100,000元 | 根据功能复杂度 |
| 运维费 | 5,000-15,000元/年 | 服务器维护、安全更新 |
| CDN加速 | 1,000-5,000元/年 | 按流量计费 |
| **总计** | **约 45,000-140,000元**（首年） | 实际视需求浮动 |

> 注：以上为市场参考估算，实际费用需根据具体需求和服务商报价确定。

### 5.4 验收标准
| 验收项 | 标准 |
| :--- | :--- |
| **功能完整性** | 所有设计稿页面及功能模块100%实现 |
| **兼容性** | 主流浏览器（Chrome、Firefox、Safari、Edge）正常运行 |
| **响应式** | PC、平板、手机三端适配良好 |
| **性能** | 首页LCP ≤ 2.5s，FID ≤ 100ms |
| **安全性** | 通过安全扫描，无高危漏洞 |
| **内容管理** | 后台可正常增删改查所有内容 |
| **SEO** | 各页面Meta标签可自定义配置 |

### 5.5 运维与维护计划
| 维护项目 | 频率 | 说明 |
| :--- | :--- | :--- |
| 内容更新 | 按需 | 新闻、产品、招聘信息等 |
| 安全更新 | 每月 | 系统补丁、依赖更新 |
| 数据备份 | 每日 | 数据库自动备份 |
| 性能监控 | 实时 | 服务器状态、访问日志监控 |
| 年度巡检 | 每年 | 全面安全检查、性能评估 |


## 六、附录：文档清单
| 序号 | 文档名称 | 说明 |
| :--- | :--- | :--- |
| 1 | 项目需求规格说明书 | 详细功能需求与非功能需求 |
| 2 | 技术方案设计文档 | 架构设计、技术选型、部署方案 |
| 3 | 数据库设计文档 | ER图、表结构、字段说明 |
| 4 | API接口文档 | 接口规范、请求/响应示例 |
| 5 | UI设计规范文档 | 色彩、字体、组件规范 |
| 6 | 测试用例文档 | 功能测试、兼容性测试用例 |
| 7 | 部署运维手册 | 环境配置、部署流程、运维指南 |
| 8 | 用户操作手册 | 后台管理系统使用指南 |
| 9 | 项目进度计划 | 里程碑、任务分解、时间排期 |
| 10 | 项目预算表 | 详细费用明细 |

---

*本方案基于设计稿 `final_mockup_website.png` 及湖南新蓝恒成信息技术有限公司的实际业务背景编制，可根据实际需求进一步细化和调整。*