FROM node:22-alpine

# pnpm 版本与 package.json 的 packageManager 字段保持一致
RUN npm install -g pnpm@12.21.0

ENV CI=1

WORKDIR /app

# 依赖层单独缓存：锁文件不变就不重装
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 5173

# 本次练习用 Vite 开发服务器演示，不是生产构建产物
CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "5173"]
