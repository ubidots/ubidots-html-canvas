import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: ['node_modules', 'build', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '__tests__/', 'build/', 'dist/', '*.config.js', '*.config.ts', 'src/types/'],
    },
    typecheck: {
      enabled: true,
      include: ['tests/**/*.{test,spec}.ts', '**/__tests__/**/*.{test,spec}.ts'],
    },
  },
  esbuild: {
    target: 'es2020',
  },
});
