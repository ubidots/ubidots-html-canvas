import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm', 'iife'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: true,
  target: 'es2020',
  outDir: 'dist',
  globalName: 'Ubidots',
  banner: {
    js: '/* Ubidots HTML Canvas Library */',
  },
  splitting: false,
  treeshake: true,
  platform: 'browser',
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  external: ['@ubidots/ubidots-javascript-library'],
  noExternal: [],
  esbuildOptions(options) {
    options.drop = ['console', 'debugger'];
  },
});