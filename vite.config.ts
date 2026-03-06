import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/generate': {
            target: 'http://127.0.0.1:8000',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/generate/, '/process'),
            secure: false,
            timeout: 300000,  // 5 分钟超时（推理耗时较长）
          },
          '/api/health': {
            target: 'http://127.0.0.1:8000',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/health/, '/health'),
            secure: false,
          },
          '/api/status': {
            target: 'http://127.0.0.1:8000',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/status/, '/status'),
            secure: false,
          },
          '/api/chat': {
            target: 'http://127.0.0.1:8080',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/chat/, '/v1/chat/completions'),
            secure: false,
          },
        },
      },
      plugins: [react()],
      define: {
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
