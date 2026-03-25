import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const repositoryName = 'DevPad';

export default defineConfig({
  base: `/${repositoryName}/`,
  build: {
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        help: resolve(process.cwd(), 'help/index.html')
      },
      output: {
        manualChunks(id) {
          if (id.includes('@codemirror') || id.includes('codemirror')) {
            return 'editor';
          }
          if (id.includes('highlight.js') || id.includes('marked')) {
            return 'preview';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          return undefined;
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts']
  }
});
