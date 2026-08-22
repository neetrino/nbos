import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/web/src'),
    },
  },
  // Nest HTTP contract tests use legacy decorators. apps/api/tsconfig.json
  // excludes **/*.test.ts, so Oxc would otherwise throw SyntaxError.
  oxc: {
    decorator: {
      legacy: true,
      emitDecoratorMetadata: true,
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['apps/**/*.test.ts', 'packages/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['apps/api/src/**/*.ts', 'packages/shared/src/**/*.ts'],
      exclude: [
        '**/*.module.ts',
        '**/*.test.ts',
        '**/*.controller.ts',
        '**/main.ts',
        '**/index.ts',
        '**/generated/**',
        '**/test-utils/**',
        '**/database.module.ts',
        '**/health.controller.ts',
      ],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
  },
});
