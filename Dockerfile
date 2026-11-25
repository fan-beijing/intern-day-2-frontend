FROM node:22-alpine AS base

# pnpm 版本与 package.json 的 packageManager 字段保持一致
RUN npm install -g pnpm@12.21.0

ENV CI=1
WORKDIR /app

# 依赖层单独缓存：锁文件不变就不重装
# pnpm-workspace.yaml 参与依赖解析（忽略了 @scarf/scarf 的构建脚本），必须一起复制
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ── 阶段一：Vite 开发服务器（浏览器访问的页面）────────────────────────────
# 只负责静态资源与 HMR，不具备 CopilotKit Runtime 能力。
FROM base AS web

COPY . .
EXPOSE 5173
CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "5173"]

# ── 阶段二：CopilotKit Runtime（AG-UI 转发）──────────────────────────────
# 同一个仓库、同一份依赖，单独一个进程；不含 Vite，也不对外提供页面。
FROM base AS runtime

COPY server ./server
COPY package.json ./
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:4000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/runtime.mjs"]
