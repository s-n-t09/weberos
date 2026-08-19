import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        allowedHosts: true
      },
      plugins: [react()],
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) return 'vendor';
              if (id.includes('/apps/')) return 'apps';
              if (id.includes('/components/')) return 'components';
            }
          }
        },
        chunkSizeWarningLimit: 700
      },
      resolve: {
        alias: {
          '@': path.resolve('.'),
        }
      }
    };
});