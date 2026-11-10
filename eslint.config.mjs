// ESLint flat config: JS + TypeScript recommended rules, Astro components.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default [
  { ignores: ['dist/**', '.astro/**', 'node_modules/**', 'public/**', 'brand-source/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    languageOptions: {
      globals: { window: 'readonly', document: 'readonly', navigator: 'readonly', location: 'readonly', console: 'readonly', process: 'readonly', crypto: 'readonly', fetch: 'readonly', URL: 'readonly', URLSearchParams: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly', requestAnimationFrame: 'readonly', cancelAnimationFrame: 'readonly', matchMedia: 'readonly', addEventListener: 'readonly', removeEventListener: 'readonly', Response: 'readonly', Request: 'readonly', Headers: 'readonly', TextEncoder: 'readonly', AbortController: 'readonly', HTMLElement: 'readonly', CustomEvent: 'readonly', IntersectionObserver: 'readonly', ResizeObserver: 'readonly', performance: 'readonly', sessionStorage: 'readonly', localStorage: 'readonly', getComputedStyle: 'readonly', innerWidth: 'readonly', innerHeight: 'readonly', scrollY: 'readonly', scrollTo: 'readonly', scrollBy: 'readonly', Buffer: 'readonly', __dirname: 'readonly' },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  { files: ['scripts/**/*.mjs'], rules: { 'no-undef': 'off', '@typescript-eslint/no-unused-vars': 'off' } },
];
