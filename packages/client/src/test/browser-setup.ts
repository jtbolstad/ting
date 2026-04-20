import '@testing-library/jest-dom/vitest';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { worker } from './mocks/worker';

beforeAll(async () => {
  await worker.start({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  worker.resetHandlers();
});

afterAll(() => {
  worker.stop();
});
