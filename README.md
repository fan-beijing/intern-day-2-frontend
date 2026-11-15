# 雪庐记账 · 前端（intern-day-2-frontend）

登录鉴权 + 个人记账的 React 前端。登录页调用后端真实接口，登录后进入记账页，可以记录收支、按月份查看明细和汇总、删除记录、退出登录。

页面风格为水墨 + 宣纸 + 朱砂，背景的远山、雪坡、茅庐与落雪全部用 SVG 和 CSS 绘制，没有引入 UI 组件库。

## 功能范围

**必做流程**：打开登录页 → 输入账号密码 → 后端验证 → 进入记账页 → 展示后端返回的当前用户 → 记账 → 退出登录。

**自选功能**：个人记账本。

| 操作 | 说明 |
| --- | --- |
| 记一笔 | 选择收入/支出、填金额、日期、分类、备注，提交到 `POST /ledger/entries` |
| 看明细 | 按月读取 `GET /ledger/entries?month=YYYY-MM`，按日期从近到远排列 |
| 看汇总 | 读取 `GET /ledger/summary?month=YYYY-MM`，显示本月收入、支出、结余与笔数 |
| 删一笔 | 调用 `DELETE /ledger/entries/{id}`，后端只允许删除本人账目 |

**不包含**（按任务说明不做）：注册、找回密码、短信/第三方登录、复杂角色权限。

### 验收条件

- 未登录访问 `/ledger` 会被送回登录页，看不到任何账目内容。
- 账号或密码错误时，页面显示后端返回的统一提示「账号或密码错误」，不区分账号是否存在。
- 登录成功后顶栏显示后端 `/auth/me` 返回的用户名。
- 所有账目与汇总数据都来自后端接口，前端不做 Mock，也没有在前端判断账号密码。
- 接口返回 `401`（凭证过期、已退出、伪造）时清理本地登录态并回到登录页，并提示「登录状态已失效，请重新登录」。
- 刷新页面保持登录，但会重新向后端校验，不凭本地令牌直接认定已登录。
- 登录、加载、空数据、请求失败、提交中都有对应界面状态。

## 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | React 19 + TypeScript（严格模式） |
| 构建 | Vite 8 |
| 路由 | react-router-dom 7 |
| 包管理 | pnpm 12（`package.json` 的 `packageManager` 固定版本） |
| 风格检查 | oxlint |
| 容器 | Docker + Docker Compose |

## 目录结构

```
src/
  App.tsx                 路由与全局装配
  api/client.ts           fetch 封装、令牌读写、401 统一处理
  api/types.ts            接口出入参类型
  auth/                   登录态：context、Provider、useAuth
  components/             场景背景、顶栏、汇总卡、记账表单、账目列表、轻提示、页面保护
  pages/LoginPage.tsx     登录页
  pages/LedgerPage.tsx    记账页
  styles/theme.css        主题变量与背景场景样式
  styles/app.css          组件样式
  utils/                  金额与日期格式化、记账分类
```

## 快速开始（Docker Compose）

```bash
cp .env.example .env          # 可选：默认 API 地址就是 http://localhost:8000
docker compose config         # 检查配置
docker compose up --build -d  # 首次构建约 1 分钟
docker compose ps             # 期待 web 状态为 Up
docker compose logs --tail=100
```

- 前端地址：<http://localhost:5173>
- 后端文档：<http://localhost:8000/docs>（由配套后端仓库提供）

> 本次练习用 **Vite 开发服务器**演示，`compose.yaml` 里的启动命令就是 `pnpm dev`，
> 不是生产构建产物。真正的生产部署应当 `pnpm build` 后用静态服务器托管，本次不涉及。

停止服务：`docker compose down`。重新创建容器后再打开页面，登录态会丢失（令牌存在浏览器本地，未持久化到服务端）。

## 与后端联调

后端仓库：<https://github.com/你的GitHub用户名/intern-day-2-backend>（创建仓库后替换此处地址）

两个仓库是**两个独立的 Compose 项目**，容器之间没有服务发现。联调方式是浏览器直连宿主机映射的端口：

```
浏览器 → http://localhost:5173（前端容器）
       → http://localhost:8000（后端容器）  ← 由 VITE_API_BASE_URL 指定
```

因此后端必须允许 `http://localhost:5173` 这个来源的 CORS（后端 `.env` 的 `CORS_ORIGINS`），并处理预检请求。

启动顺序建议：

```bash
# 1. 先起后端（需要先在 .env 里设置 SEED_PASSWORD）
cd intern-day-2-backend && docker compose up --build -d

# 2. 再起前端
cd intern-day-2-frontend && docker compose up --build -d
```

练习账号由**后端**在启动时按 `SEED_USERNAME` / `SEED_PASSWORD` 自动创建，前端没有内置账号，也没有注册页。

## 登录状态方案

采用「不透明令牌 + Bearer 头」，与后端 README 中的方案对应：

1. 登录成功后，后端返回一次性明文令牌，前端存到 `localStorage` 的 `xuelu.token`。
2. 之后每次请求由 `api/client.ts` 统一附加 `Authorization: Bearer <token>`。
3. 刷新页面时**不**直接认定已登录：先用 `/auth/me` 向后端校验，通过才渲染记账页，否则回到登录页。
4. 任意受保护接口返回 `401` 时，`AuthProvider` 注册的回调会清理令牌与用户信息，跳回登录页并给出提示。
5. 退出登录调用 `POST /auth/logout`，后端删除会话记录后前端清理本地状态；旧令牌立即失效。

选择 `localStorage` 而不是 Cookie，是为了避开两个独立 Compose 项目跨端口的 Cookie 与 `SameSite` 配置问题；代价是令牌可被同源脚本读取，练习场景可接受，生产环境更稳妥的做法是 HttpOnly Cookie 或短时令牌 + 刷新令牌。

## 接口约定

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| POST | `/auth/login` | 账号密码登录，返回令牌与用户信息 |
| GET | `/auth/me` | 获取当前用户（刷新页面时用于校验） |
| POST | `/auth/logout` | 退出登录，作废当前令牌 |
| GET | `/ledger/entries?month=YYYY-MM` | 按月读取本人账目 |
| POST | `/ledger/entries` | 新增账目 |
| DELETE | `/ledger/entries/{id}` | 删除本人账目 |
| GET | `/ledger/summary?month=YYYY-MM` | 月度收入 / 支出 / 结余 |

金额对外统一用「元」，后端落库用「分」，前端只负责展示两位小数。

## 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8000` | 浏览器访问后端的基地址 |

`.env.example` 只有占位值，真实的 `.env` 不进仓库。Vite 只能在启动/构建时读取该变量，改动后需要重启容器。

## 本地开发（不使用容器）

```bash
pnpm install --frozen-lockfile
pnpm dev          # http://localhost:5173
pnpm lint         # oxlint
pnpm build        # tsc -b && vite build（含类型检查）
```

## 开发容器

仓库带 `.devcontainer/`（Node 22 + git + pnpm）。在 VS Code 里打开本仓库，执行 `Dev Containers: Reopen in Container`，
容器会根据 `devcontainer.json` 自动执行 `pnpm install --frozen-lockfile`，之后在容器终端里 `pnpm dev` 即可。

## 自测记录

在开发容器与 Compose 两种启动方式下都用浏览器实际操作过，结果如下。

| 检查项 | 操作 | 实际结果 |
| --- | --- | --- |
| 开发容器 | 构建 `.devcontainer` 镜像，容器内执行 `pnpm install --frozen-lockfile`、`pnpm build` | 依赖安装成功，类型检查与构建通过 |
| 容器启动 | 两个仓库分别 `docker compose up --build -d` | 前端 5173、后端 8000 同时运行，页面可访问 |
| 正常登录 | 用后端 `.env` 里的练习账号登录 | 进入记账页，顶栏显示后端返回的用户名 |
| 无效登录 | 空值提交、错误密码 | 空值被前端拦下；错误密码显示「账号或密码错误」 |
| 页面保护 | 未登录直接访问 `/ledger` | 被送回 `/login` |
| 接口保护 | 不带令牌、伪造令牌调 `/auth/me`、`/ledger/entries` | 均返回 `401` |
| 刷新页面 | 登录后刷新浏览器 | 保持登录，重新调用 `/auth/me` 校验通过 |
| 凭证失效 | 把 `localStorage` 的令牌改成伪造值后刷新 | 回到登录页并提示「登录状态已失效，请重新登录」 |
| 退出登录 | 点击顶栏退出，再用退出前的令牌调接口 | 回到登录页，旧令牌访问 `/auth/me` 返回 `401` |
| 自选功能 | 记一笔支出、记一笔收入、删除一笔 | 列表与汇总同步刷新，金额与后端返回一致 |
| 网络异常 | 停掉后端容器后登录 / 刷新 | 提示「网络异常，请确认后端服务已启动」，恢复后可重新操作 |
| 重启验证 | `docker compose down` 后重新 `up --build -d` | 服务正常启动，账目数据仍在（后端命名卷） |

截图见 [`docs/screenshots/`](docs/screenshots)：

| 文件 | 内容 |
| --- | --- |
| `01-login.png` | 登录页 |
| `02-login-error.png` | 错误密码提示 |
| `03-ledger-empty.png` | 登录后的空状态 |
| `04-ledger.png` | 记入两笔后的列表与汇总 |
| `05-after-logout.png` | 退出后回到登录页 |

## 数据保存与已知限制

- 前端不保存业务数据，只保存登录令牌（`localStorage`）。
- 账目数据存在后端的 SQLite 命名卷里，`docker compose down` 不丢，`down -v` 才会清空。
- 刷新页面保持登录，令牌有效期由后端配置（默认 120 分钟）；过期后下一次请求返回 `401`。
- 用 Vite 开发服务器运行，未做生产构建与静态托管。
- 未做国际化、暗色主题、分页与搜索；账目按月加载，单月数据量对练习场景足够。
- 删除操作使用浏览器原生 `confirm`，没有做自定义确认弹窗。
