import { beforeAll } from 'vitest';

beforeAll(() => {
  // Global test setup
  Object.defineProperty(window, 'location', {
    value: { origin: 'http://localhost:3000' },
    writable: true,
  });
});