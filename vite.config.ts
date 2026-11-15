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
  },
})
