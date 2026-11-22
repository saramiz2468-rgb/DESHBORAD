import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { defineConfig, globalIgnores } from 'eslint/config';

/**
 * Architecture boundaries (planned in docs/architecture.md):
 *  - packages/core/medical-engine and packages/core/halacha-engine never import each other.
 *  - apps/admin never imports the medical or halachic engines or their features.
 *  - Client code never imports server-only Supabase admin helpers.
 */
const engineBoundary = (forbidden) => ({
  'no-restricted-imports': [
    'error',
    {
      patterns: [{ group: forbidden, message: 'Architecture boundary – see docs/architecture.md' }],
    },
  ],
});

export default defineConfig([
  globalIgnores([
    '**/node_modules/**',
    '**/.next/**',
    '**/next-env.d.ts',
    '**/public/sw.js',
    'test-results/**',
    'playwright-report/**',
  ]),
  ...nextVitals,
  ...nextTs,
  {
    settings: { next: { rootDir: ['apps/web/', 'apps/admin/'] } },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'react/no-danger': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='localStorage']",
          message: 'Personal data must never be stored in localStorage.',
        },
        {
          selector: "MemberExpression[object.name='sessionStorage']",
          message: 'Personal data must never be stored in sessionStorage.',
        },
        {
          selector: "MemberExpression[object.name='indexedDB']",
          message: 'Personal data must never be stored in IndexedDB.',
        },
        {
          selector: "MemberExpression[property.name='geolocation']",
          message: 'GPS location is not collected – use city selection.',
        },
      ],
    },
  },
  {
    files: ['packages/core/medical-engine/**'],
    rules: engineBoundary(['**/halacha-engine/**', '@tahara/core/halacha*']),
  },
  {
    files: ['packages/core/halacha-engine/**'],
    rules: engineBoundary(['**/medical-engine/**', '@tahara/core/medical*']),
  },
  {
    files: ['apps/admin/**'],
    rules: engineBoundary([
      '**/medical-engine/**',
      '**/halacha-engine/**',
      '@tahara/core/*',
      '**/features/cycles/**',
      '**/features/halacha/**',
    ]),
  },
  { files: ['scripts/**', '**/*.config.*', 'tests/**'], rules: { 'no-console': 'off' } },
  // E2E audits read browser storage to prove it is empty.
  { files: ['tests/e2e/**'], rules: { 'no-restricted-syntax': 'off' } },
]);
