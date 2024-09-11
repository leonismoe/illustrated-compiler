import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: 'src',
  base: './',
  publicDir: '../public',

  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.html'),
        app: path.resolve(__dirname, 'src/app.html'),
        'visual-rlg': path.resolve(__dirname, 'src/visual-rlg.html'),
        'lexical-analysis': path.resolve(__dirname, 'src/lexical-analysis.html'),
      },
    },
  },

  plugins: [
    legacy(),
  ],
});
