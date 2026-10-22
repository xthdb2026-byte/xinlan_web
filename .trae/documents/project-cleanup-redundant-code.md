# 项目冗余功能与代码清理计划

## Context

用户要求清理项目中的冗余功能和代码。经全面排查（前端组件/hooks/lib 导出引用、后端模块挂载、数据库图片引用 vs 磁盘文件、静态资源引用、根目录杂物），确认了以下冗余项。核心发现：

- **全站搜索功能已失去所有入口**（Navbar 入口此前被移除），/search 页面无导航链接、不在 sitemap，仅手动输 URL 可达 → 用户已确认**整体下线**
- **lib/api.ts 存在 21 个零调用导出函数**——表单/管理端已改为原生 fetch + rewrites 代理模式，旧包装函数全部残留；其中友情链接、备份、产品文档类函数调用的后端路由**根本不存在**（app.ts 未挂载）
- 根目录残留一次性调试笔记/截图，uploads 有一组数据库零引用的临时图片

## 清理清单

### A. 全站搜索功能下线（用户已确认）

前端：
- 删除 `frontend/app/search/` 整个目录（page.tsx、SearchContent.tsx）
- 删除 `frontend/__tests__/search.test.ts`
- `frontend/lib/api.ts`：删除 `search()`、`searchSuggest()` 函数及 `SearchResultItem`/`SearchResult` 类型
- 已确认 sitemap.ts / robots.ts / Navbar / Footer 均无 /search 引用

后端：
- 删除 `backend/src/routes/search.ts`
- `backend/src/app.ts`：移除 searchRoutes 的 import（L14）和挂载行（L108）
- backend/tests 无 search 相关测试文件（已确认）

### B. lib/api.ts 死导出清理（20 个函数 + 仅被其使用的类型）

逐一 grep 复核零调用（表单实际走 fetch('/api/...') 直连）：

| 类别 | 函数 | 备注 |
|---|---|---|
| 搜索 | searchSuggest | 后端 suggest 路由随 A 一并删 |
| 表单 | submitContact、submitMessage、submitApplication | 被原生 fetch 取代 |
| 友情链接 | getFriendLinks、getAdminFriendLinks、createFriendLink、updateFriendLink、deleteFriendLink | 后端无路由、Footer 不渲染、无管理页，功能整链不存在 |
| 产品文档/备份 | getProductDocuments、getProductDocumentDownloadUrl、uploadProductDocument、getAdminProductDocuments、downloadBackup、restoreBackup | app.ts 无对应路由挂载 |
| 旧页面配置包装 | getHomeHeroConfig、getHomeValuesConfig、getHomeAboutEntryConfig | 已被通用 getPageConfig 取代 |
| 其他 | getBanners、listAllAdminProducts、replyMessage | 零调用 |

同步清理 `frontend/lib/types.ts` 中仅被上述函数使用的类型（删除前逐个 grep 复核，如 FriendLink 相关）。

### C. 文件级清理（删除前逐一 grep 复核引用）

- `backend/uploads/products/jd/`（jd-switch-01~05.jpg，数据库零引用的临时图）
- `frontend/public/images/` 未引用图：mockup_website_reference.png、mockup_letterhead.png、car_mockup_deep_blue.png、car_mockup_iron_grey.png、hero_bg.jpg、hero_solutions.original.jpg、logos/logo_horizontal.original.png（注意：mockup_reception/polo/employee_id/tote_bag 被 about 页在用，**不删**）
- 根目录：`debug-failed-to-fetch.md`（旧调试笔记）、`final_mockup_website.png`、`logo-after-fix.png`、`navbar-after-fix.png`（一次性截图）

### D. 本次不动（排查确认保留）

- `backend/src/lib/productImageGen.ts` + `backend/scripts/generate_product_images.ts`：40+ 非海康产品仍使用生成的 SVG，保留
- `pnp/`：**后续已处理（归档）**——50MB / 10 个品牌 VI 设计源文件（polo衫、手提袋、工牌、车贴、logo 等），代码零引用。因该文件未被 git 跟踪（仓库根在用户主目录，提交历史中不存在），删除即不可恢复，故于 2026-10-19 移至项目外归档：`/Users/huang/Desktop/xinlan_web_archive/pnp_品牌源文件_20261019`
- `DEPLOYMENT.md`：**后续已删除**——因已有内容更全的 DEPLOY.md（899 行，含 PM2+Nginx 与 Docker 两套方案）替代。注意该文件同样未被 git 跟踪
- `xinlan_web.md`（原始 PRD）、`docs/性能测试报告_20260824.md`、`start_services.sh`、`test/contact-api-test.sh`、`frontend/scripts/generate-icons.js`、`logs/`

## 执行顺序与验证

1. **删搜索功能**（A）→ 后端 `npx tsc --build` + 前端 `npx tsc --noEmit` 类型检查
2. **删 lib/api.ts 死导出 + 关联类型**（B）→ 前端类型检查；注意 dist 构建缓存：后端改完须重新 tsc --build 再重启
3. **删文件级杂物**（C）→ 逐项 grep 复核零引用
4. **回归验证**：
   - 后端 `npx jest`（预期 48/48 全过）
   - 前端 `npx jest`（search.test.ts 已删，其余 ~190 用例全过）
   - `rm -rf frontend/.next/cache` 后重启 dev server，浏览器抽验首页、/products、/about、管理端登录页正常渲染，确认无白屏/404

## 风险控制

- 所有删除项均有"零引用"证据支撑，删除时如发现新引用立即停手核实
- 不动任何数据库数据；不动 prisma schema
- 同一文件多处编辑串行执行，避免并行覆盖
