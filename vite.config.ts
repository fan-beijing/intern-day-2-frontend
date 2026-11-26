import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 容器内必须监听 0.0.0.0，宿主机映射端口才能访问
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      // 浏览器只访问同源的 /api/copilotkit，由 Vite 转给 CopilotKit Runtime。
      // 容器内 Runtime 的服务名是 runtime，本地开发默认 localhost:4000。
      '/api/copilotkit': {
        target: process.env.RUNTIME_URL ?? 'http://localhost:4000',
        changeOrigin: true,
        // 流式回复不能被缓冲，否则会等到结束才一次性显示
        ws: false,
      },
    },
  },
})
