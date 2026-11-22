import path from 'node:path';
import { defineConfig } from 'vitest/config';

const r = (p: string) => path.resolve(import.meta.dirname, p);

export default defineConfig({
  test: {
    projects: [
      {
        test: { name: 'web', include: ['apps/web/src/**/*.test.ts'] },
        resolve: { alias: { '@': r('apps/web/src') } },
      },
      {
        test: { name: 'admin', include: ['apps/admin/src/**/*.test.ts'] },
        resolve: { alias: { '@': r('apps/admin/src') } },
      },
      { test: { name: 'packages', include: ['packages/*/src/**/*.test.ts'] } },
      { test: { name: 'scripts', include: ['scripts/**/*.test.mjs'] } },
    ],
  },
});
