import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '',
  // Vite сам перетворює JSX через esbuild, тому окремий плагін для React не потрібен.
  // 'automatic' означає, що JSX не вимагає import React у кожному файлі.
  esbuild: { jsx: 'automatic' },
  // '@' - корінь src. Шари FSD імпортують один одного через публічний API:
  // import { VirtualFlow } from '@/shared/ui/virtual-flow'.
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
