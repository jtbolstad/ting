import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.spec.tsx',
        '**/*.test.tsx',
        'src/test/',
      ],
    },
    browser: {
      enabled: false, // Enable with --browser flag
      name: 'chromium',
      provider: 'playwright',
    },
  },
});
