FROM node:22-alpine

# 开发容器固定工具版本：git 用于提交，pnpm 与 package.json 的 packageManager 一致
RUN apk add --no-cache git curl \
    && npm install -g pnpm@12.21.0

WORKDIR /workspaces/intern-day-2-frontend
