/// <reference types="vitest" />
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      test: {
        globals: true,
        environment: 'jsdom',
        exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': [
                'react',
                'react-dom',
                'react-router-dom',
              ],
              'supabase-vendor': [
                '@supabase/supabase-js',
                '@supabase/auth-ui-react',
                '@supabase/auth-ui-shared',
              ],
            },
          },
        },
      },
    };
});
