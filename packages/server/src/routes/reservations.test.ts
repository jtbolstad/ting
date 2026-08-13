import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import request from 'supertest';
import express from 'express';

// Mock prisma.ts to use a test-specific SQLite DB
vi.mock('../prisma.js', async () => {
  const { PrismaClient } = await import('@prisma/client');
  return {
    prisma: new PrismaClient({
      datasources: { db: { url: 'file:./test-reservations.db' } },
    }),
  };
});

// Mock email service — fire-and-forget, we spy on calls
vi.mock('../services/email.js', () => ({
  emailService: {
    sendReservationConfirmed: vi.fn().mockResolvedValue(undefined),
    sendReservationRequested: vi.fn().mockResolvedValue(undefined),
    sendReservationCancelled: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock audit log
vi.mock('../services/auditLog.js', () => ({ audit: vi.fn() }));

// Mock authenticate middleware — inject user from request context set by tests
vi.mock('../middleware/auth.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../middleware/auth.js')>();
  return {
    ...original,
    authenticate: (req: any, _res: any, next: any) => {
      // req.user, req.organization, req.membership are pre-set by the test shim
      next();
    },
  };
});

// Mock withOrganizationContext — trust req.organization and req.membership pre-set by tests
vi.mock('../middleware/organization.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../middleware/organization.js')>();
  return {
    ...original,
    withOrganizationContext: () => (req: any, _res: any, next: any) => next(),
    requireOrgRole: () => (req: any, _res: any, next: any) => next(),
    hasOrgRole: (req: any, minRole: string) => {
      const ROLE_RANK: Record<string, number> = { MEMBER: 1, MANAGER: 2, ADMIN: 3, OWNER: 4 };
      const membershipRank = ROLE_RANK[req.membership?.role] ?? 0;
      return membershipRank >= (ROLE_RANK[minRole] ?? 0);
    },
  };
});

import { emailService } from '../services/email.js';
import reservationRoutes from './reservations';

const prisma = new PrismaClient({
  datasources: { db: { url: 'file:./test-reservations.db' } },
});

let organizationId: string;
let memberId: string;
let managerId: string;
let itemId: string;

// Build a test app with injected req.user, req.organization, req.membership
function makeApp(
  user: { id: string; email: string; name: string; role: string },
  membershipRole: 'MEMBER' | 'MANAGER',
  orgId: string,
) {
  const testApp = express();
  testApp.use(express.json());
  testApp.use((req: any, _res: any, next: any) => {
    req.user = { id: user.id, email: user.email, role: user.role };
    req.organization = { id: orgId };
    req.membership = {
      id: 'test-membership',
      userId: user.id,
      organizationId: orgId,
      role: membershipRole,
      status: 'ACTIVE',
    };
    next();
  });
  testApp.use('/reservations', reservationRoutes);
  return testApp;
}

describe('POST /reservations — RESERVATION_APPROVAL_REQUIRED feature flag', () => {
  beforeAll(async () => {
    await prisma.$executeRaw`PRAGMA foreign_keys = OFF`;
    await prisma.$executeRaw`DELETE FROM Reservation`;
    await prisma.$executeRaw`DELETE FROM FeatureFlag`;
    await prisma.$executeRaw`DELETE FROM Item`;
    await prisma.$executeRaw`DELETE FROM Category`;
    await prisma.$executeRaw`DELETE FROM Membership`;
    await prisma.$executeRaw`DELETE FROM User`;
    await prisma.$executeRaw`DELETE FROM Organization`;
    await prisma.$executeRaw`PRAGMA foreign_keys = ON`;

    const org = await prisma.organization.create({
      data: { name: 'Res Test Org', slug: 'res-test-org' },
    });
    organizationId = org.id;

    const passwordHash = await bcryptjs.hash('password123', 10);

    const member = await prisma.user.create({
      data: { email: 'member@res-test.com', passwordHash, name: 'Test Member', role: 'MEMBER' },
    });
    memberId = member.id;

    const manager = await prisma.user.create({
      data: { email: 'manager@res-test.com', passwordHash, name: 'Test Manager', role: 'MEMBER' },
    });
    managerId = manager.id;

    await prisma.membership.create({ data: { userId: memberId, organizationId, role: 'MEMBER' } });
    await prisma.membership.create({ data: { userId: managerId, organizationId, role: 'MANAGER' } });

    const category = await prisma.category.create({
      data: { name: 'Tools', organizationId },
    });

    const item = await prisma.item.create({
      data: {
        name: 'Test Drill',
        categoryId: category.id,
        organizationId,
        status: 'AVAILABLE',
      },
    });
    itemId = item.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.reservation.deleteMany();
    await prisma.featureFlag.deleteMany();
    vi.clearAllMocks();
  });

  describe('Flag OFF (default — no FeatureFlag row)', () => {
    it('member booking is CONFIRMED immediately and gets confirmed email', async () => {
      const memberApp = makeApp(
        { id: memberId, email: 'member@res-test.com', name: 'Test Member', role: 'MEMBER' },
        'MEMBER',
        organizationId,
      );

      const res = await request(memberApp)
        .post('/reservations')
        .send({
          itemId,
          startDate: new Date('2030-01-10').toISOString(),
          endDate: new Date('2030-01-15').toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('CONFIRMED');
      expect(emailService.sendReservationConfirmed).toHaveBeenCalledOnce();
      expect(emailService.sendReservationRequested).not.toHaveBeenCalled();
    });

    it('manager booking is CONFIRMED', async () => {
      const managerApp = makeApp(
        { id: managerId, email: 'manager@res-test.com', name: 'Test Manager', role: 'MEMBER' },
        'MANAGER',
        organizationId,
      );

      const res = await request(managerApp)
        .post('/reservations')
        .send({
          itemId,
          startDate: new Date('2030-02-10').toISOString(),
          endDate: new Date('2030-02-15').toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('CONFIRMED');
      expect(emailService.sendReservationConfirmed).toHaveBeenCalledOnce();
      expect(emailService.sendReservationRequested).not.toHaveBeenCalled();
    });
  });

  describe('Flag ON (RESERVATION_APPROVAL_REQUIRED = true)', () => {
    beforeEach(async () => {
      await prisma.featureFlag.create({
        data: { organizationId, key: 'RESERVATION_APPROVAL_REQUIRED', enabled: true },
      });
    });

    it('member booking is PENDING and receives "forespørsel mottatt" email', async () => {
      const memberApp = makeApp(
        { id: memberId, email: 'member@res-test.com', name: 'Test Member', role: 'MEMBER' },
        'MEMBER',
        organizationId,
      );

      const res = await request(memberApp)
        .post('/reservations')
        .send({
          itemId,
          startDate: new Date('2030-03-10').toISOString(),
          endDate: new Date('2030-03-15').toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('PENDING');
      expect(emailService.sendReservationRequested).toHaveBeenCalledOnce();
      expect(emailService.sendReservationConfirmed).not.toHaveBeenCalled();
    });

    it('manager booking is still CONFIRMED even when flag is on', async () => {
      const managerApp = makeApp(
        { id: managerId, email: 'manager@res-test.com', name: 'Test Manager', role: 'MEMBER' },
        'MANAGER',
        organizationId,
      );

      const res = await request(managerApp)
        .post('/reservations')
        .send({
          itemId,
          startDate: new Date('2030-04-10').toISOString(),
          endDate: new Date('2030-04-15').toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('CONFIRMED');
      expect(emailService.sendReservationConfirmed).toHaveBeenCalledOnce();
      expect(emailService.sendReservationRequested).not.toHaveBeenCalled();
    });
  });
});
