import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Kjør tester i en sone øst for UTC, så tidssone-feil (f.eks. bruk av
    // toISOString() på lokale datoer) faktisk slår ut i testene.
    env: { TZ: 'Europe/Oslo' },
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'src/test/'],
    },
  },
});
