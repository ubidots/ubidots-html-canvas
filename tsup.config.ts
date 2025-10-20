import { defineConfig } from 'tsup';
import { readFileSync } from 'fs';
import { join } from 'path';

// Get version from package.json
const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'));
const version = packageJson.version;

export default defineConfig([
  // Main bundle - Modern ESM
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    minify: true,
    target: 'es2020',
    outDir: 'dist',
    outExtension: () => ({ js: '.mjs' }),
    banner: {
      js: `/* Ubidots HTML Canvas Library v${version} - ESM */`,
    },
    splitting: false,
    treeshake: true,
    platform: 'browser',
    define: {
      'process.env.NODE_ENV': '"production"',
      'process.env.LIB_VERSION': `"${version}"`,
    },
    external: ['@ubidots/ubidots-javascript-library'],
    esbuildOptions(options) {
      options.drop = ['debugger'];
    },
  },

  // CommonJS bundle
  {
    entry: ['src/index.ts'],
    format: ['cjs'],
    sourcemap: true,
    minify: true,
    target: 'es2020',
    outDir: 'dist',
    banner: {
      js: `/* Ubidots HTML Canvas Library v${version} - CJS */`,
    },
    splitting: false,
    treeshake: true,
    platform: 'node',
    define: {
      'process.env.NODE_ENV': '"production"',
      'process.env.LIB_VERSION': `"${version}"`,
    },
    external: ['@ubidots/ubidots-javascript-library'],
    esbuildOptions(options) {
      options.drop = ['debugger'];
    },
  },

  // IIFE bundle for direct browser usage
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    sourcemap: true,
    minify: true,
    target: 'es2020',
    outDir: 'dist',
    globalName: 'Ubidots',
    outExtension: () => ({ js: '.global.js' }),
    banner: {
      js: `/* Ubidots HTML Canvas Library v${version} - Browser Global */`,
    },
    splitting: false,
    treeshake: true,
    platform: 'browser',
    define: {
      'process.env.NODE_ENV': '"production"',
      'process.env.LIB_VERSION': `"${version}"`,
    },
    // Bundle UJL for standalone usage
    noExternal: ['@ubidots/ubidots-javascript-library'],
    esbuildOptions(options) {
      options.drop = ['debugger'];
    },
  },

  // Development bundle (unminified)
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: false,
    sourcemap: true,
    clean: false,
    minify: false,
    target: 'es2020',
    outDir: 'dist',
    outExtension: () => ({ js: '.dev.mjs' }),
    banner: {
      js: `/* Ubidots HTML Canvas Library v${version} - Development Build */`,
    },
    splitting: false,
    treeshake: false,
    platform: 'browser',
    define: {
      'process.env.NODE_ENV': '"development"',
      'process.env.LIB_VERSION': `"${version}"`,
    },
    external: ['@ubidots/ubidots-javascript-library'],
    // Keep console logs for development
    esbuildOptions(options) {
      options.drop = ['debugger'];
    },
  },
]);
