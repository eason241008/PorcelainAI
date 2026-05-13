import path from 'path';
import fs from 'node:fs/promises';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const proxy = {
    '/api/generate': {
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/api\/generate/, '/process'),
      secure: false,
      timeout: 300000,
    },
    '/api/health': {
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/api\/health/, '/health'),
      secure: false,
    },
    '/api/status': {
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/api\/status/, '/status'),
      secure: false,
    },
    '/api/chat': {
      target: 'http://127.0.0.1:8080',
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/api\/chat/, '/v1/chat/completions'),
      secure: false,
    },
  };

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy,
    },
    preview: {
      port: 3000,
      host: '0.0.0.0',
      proxy,
    },
    plugins: [
      react(),
      {
        name: 'delete-vessel-api',
        configureServer(server) {
          server.middlewares.use('/api/delete-vessel', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, message: 'Method not allowed' }));
              return;
            }

            try {
              const chunks: Buffer[] = [];
              for await (const chunk of req) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
              }

              const rawBody = Buffer.concat(chunks).toString('utf8');
              const { ids } = JSON.parse(rawBody || '{}') as { ids?: string[] };

              if (!Array.isArray(ids) || ids.length === 0) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, message: 'Missing vessel ids' }));
                return;
              }

              const vesselsPath = path.resolve(__dirname, 'npm_vessels.ts');
              const source = await fs.readFile(vesselsPath, 'utf8');
              const body = source
                .replace("import { ImageAsset } from './types';", '')
                .replace('export const npmVessels: ImageAsset[] =', '')
                .trim()
                .replace(/;$/, '');

              const vessels = JSON.parse(body) as Array<Record<string, unknown>>;
              const idSet = new Set(ids);
              const nextVessels = vessels.filter((item) => !idSet.has(String(item.id)));

              if (nextVessels.length === vessels.length) {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, message: 'Vessels not found' }));
                return;
              }

              const nextSource =
                "import { ImageAsset } from './types';\nexport const npmVessels: ImageAsset[] = \n" +
                JSON.stringify(nextVessels, null, 2) +
                ';\n';

              await fs.writeFile(vesselsPath, nextSource, 'utf8');

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: true,
                  removedIds: ids,
                  remainingCount: nextVessels.length,
                })
              );
            } catch (error) {
              console.error(error);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, message: 'Failed to update npm_vessels.ts' }));
            }
          });
        },
      },
    ],
    define: {},
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
