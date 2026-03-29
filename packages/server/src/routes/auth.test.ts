import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import request from 'supertest';
import express from 'express';

// Mock prisma.ts to use the test DB — must be before authRoutes import
vi.mock('../prisma.js', async () => {
  const { PrismaClient } = await import('@prisma/client');
  return {
    prisma: new PrismaClient({
      datasources: { db: { url: 'file:./test-auth.db' } },
    }),
  };
});

import authRoutes from './auth';

const prisma = new PrismaClient({
  datasources: { db: { url: 'file:./test-auth.db' } },
});

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

let organizationId: string;

describe('Auth Routes', () => {
  beforeAll(async () => {
    await prisma.$executeRaw`PRAGMA foreign_keys = OFF`;
    await prisma.$executeRaw`DELETE FROM Membership`;
    await prisma.$executeRaw`DELETE FROM User`;
    await prisma.$executeRaw`DELETE FROM Organization`;
    await prisma.$executeRaw`PRAGMA foreign_keys = ON`;

    const org = await prisma.organization.create({
      data: { name: 'Test Org', slug: 'test-org' },
    });
    organizationId = org.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'newuser@test.com',
          password: 'password123',
          name: 'New User',
          organizationId,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toMatchObject({
        email: 'newuser@test.com',
        name: 'New User',
        role: 'MEMBER',
      });
    });

    it('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'newuser@test.com',
          password: 'password123',
          name: 'Duplicate User',
          organizationId,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require all fields', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'incomplete@test.com',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeAll(async () => {
      const passwordHash = await bcryptjs.hash('testpass', 10);
      await prisma.user.create({
        data: {
          email: 'login@test.com',
          passwordHash,
          name: 'Login Test',
          role: 'MEMBER',
        },
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@test.com',
          password: 'testpass',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe('login@test.com');
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@test.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /auth/me', () => {
    let token: string;

    beforeAll(async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@test.com',
          password: 'testpass',
        });
      token = response.body.data.token;
    });

    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('login@test.com');
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/auth/me');
      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalidtoken');
      expect(response.status).toBe(401);
    });
  });
});
