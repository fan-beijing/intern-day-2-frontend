# 开发容器实测记录（2026-11-20）

方式：用官方 `@devcontainers/cli`（0.90.0）执行 `devcontainer up --workspace-folder <本仓库>`，
与 VS Code「Dev Containers: Reopen in Container」走同一构建与生命周期
（构建 `.devcontainer/Dockerfile` → 创建容器 → 跑 `devcontainer.json` 的 `postCreateCommand`），
结果可完全复现。

## 1. 构建与启动

镜像构建成功。`postCreateCommand` 第一次执行 `pnpm install --frozen-lockfile` 失败：

```text
ERR_PNPM_META_FETCH_FAIL ... https://registry.npmjs.org/@rolldown%2Fbinding-freebsd-x64:
invalid peer certificate: UnknownIssuer
```

原因是本机代理对 `registry.npmjs.org` 做了 TLS 拦截（Windows 侧与容器侧都受影响），
不是仓库或锁文件的问题。改用国内镜像源后安装成功：

```bash
pnpm config set registry https://registry.npmmirror.com
pnpm install --frozen-lockfile   # Lockfile is up to date, Done in 28.4s（101 个包）
```

> 注意：`pnpm config set registry` 默认写的是容器内的用户级配置（`/root/.npmrc`），
> 不落进挂载的工作区，因此不会影响仓库与锁文件（本次已用 `git status` 核对）。
> 导师在网络无障碍环境下按默认源直接复现即可。

## 2. 容器内工具版本

```text
node: v22.23.5
pnpm: 12.21.0（与 package.json 的 packageManager 一致）
git:  git version 2.54.1
```

## 3. 容器内检查与构建

```text
$ pnpm lint
Found 0 warnings and 0 errors.
Finished in 232ms on 19 files with 116 rules using 18 threads.

$ pnpm build
✓ 38 modules transformed.
dist/assets/index-CBzYuTmS.css    9.69 kB │ gzip:  3.01 kB
dist/assets/index-H6pnE6GA.js   276.06 kB │ gzip: 87.88 kB
✓ built in 2.12s
```

## 4. 复现命令

```bash
npx @devcontainers/cli up --workspace-folder <仓库路径>
docker exec <容器ID> sh -c 'cd /workspaces/intern-day-2-frontend && pnpm --version && pnpm lint && pnpm build'
```
