import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express, { type Router } from 'express';

// oauth.ts reads GOOGLE_CLIENT_ID at module load, so each test re-imports the
// module with a fresh module registry after setting the env it needs.
async function buildApp() {
  vi.resetModules();
  // The server package has no "type": "module", so under module: NodeNext tsc
  // types this dynamic import the way Node's CJS interop resolves it: `default`
  // is the whole module.exports object, with the router nested one level deeper
  // at `.default.default`. Vitest transforms to ESM instead and hands back the
  // router directly, which is the shape this file actually runs against — hence
  // the cast. Only Vitest ever loads this file; tsconfig.json keeps *.test.ts
  // out of the build.
  const oauthRoutes = (await import('./oauth.js')).default as unknown as Router;
  const app = express();
  app.use(express.json());
  app.use('/auth', oauthRoutes);
  return app;
}

const ORIGINAL_ENV = { ...process.env };

describe('OAuth routes', () => {
  beforeEach(() => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  describe('GET /auth/status', () => {
    it('reports google as unavailable when credentials are missing', async () => {
      const app = await buildApp();
      const response = await request(app).get('/auth/status');

      expect(response.status).toBe(200);
      expect(response.body.data.google).toBe(false);
    });

    it('reports google as available when credentials are set', async () => {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

      const app = await buildApp();
      const response = await request(app).get('/auth/status');

      expect(response.status).toBe(200);
      expect(response.body.data.google).toBe(true);
    });
  });

  describe('GET /auth/google', () => {
    it('returns 501 when Google OAuth is not configured', async () => {
      const app = await buildApp();
      const response = await request(app).get('/auth/google');

      expect(response.status).toBe(501);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /auth/google/callback', () => {
    it('redirects to the login page when Google OAuth is not configured', async () => {
      const app = await buildApp();
      const response = await request(app).get('/auth/google/callback');

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/login?error=oauth_not_configured');
    });
  });
});
