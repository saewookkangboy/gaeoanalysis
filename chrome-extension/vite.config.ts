import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { copyFileSync, existsSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/*',
          dest: '.'
        }
      ]
    }),
    // manifest.json과 popup.html을 dist에 복사하는 플러그인
    {
      name: 'copy-manifest',
      closeBundle() {
        const manifestPath = resolve(__dirname, 'manifest.json');
        const popupPath = resolve(__dirname, 'popup.html');
        const distManifestPath = resolve(__dirname, 'dist/manifest.json');
        const distPopupPath = resolve(__dirname, 'dist/popup.html');
        
        if (existsSync(manifestPath)) {
          copyFileSync(manifestPath, distManifestPath);
        }
        if (existsSync(popupPath)) {
          copyFileSync(popupPath, distPopupPath);
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        background: resolve(__dirname, 'src/background/background.ts'),
        content: resolve(__dirname, 'src/content/content.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'background.js';
          }
          if (chunkInfo.name === 'content') {
            return 'content.js';
          }
          return 'assets/[name].[hash].js';
        },
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'popup.html') {
            return 'popup.html';
          }
          return 'assets/[name].[hash].[ext]';
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});

