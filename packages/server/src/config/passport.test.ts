import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Mock prisma.ts to use the test DB — must be before the passport import
vi.mock('../prisma.js', async () => {
  const { PrismaClient } = await import('@prisma/client');
  return {
    prisma: new PrismaClient({
      datasources: { db: { url: 'file:./test-oauth.db' } },
    }),
  };
});

const prisma = new PrismaClient({
  datasources: { db: { url: 'file:./test-oauth.db' } },
});

const DEFAULT_SLUG = 'hpv-tingbibliotek';

// passport.ts resolves the default organization slug at module load, so each
// test imports it fresh after setting the env it needs.
async function loadEnsureDefaultMembership(slug?: string) {
  vi.resetModules();
  if (slug === undefined) {
    delete process.env.OAUTH_DEFAULT_ORG_SLUG;
  } else {
    process.env.OAUTH_DEFAULT_ORG_SLUG = slug;
  }
  const passportModule = await import('./passport.js');
  return passportModule.ensureDefaultMembership;
}

async function createUser(email: string) {
  return prisma.user.create({
    data: { email, name: 'OAuth User', role: 'MEMBER' },
  });
}

const ORIGINAL_ENV = { ...process.env };

describe('ensureDefaultMembership', () => {
  beforeAll(async () => {
    await prisma.$executeRaw`PRAGMA foreign_keys = OFF`;
    await prisma.$executeRaw`DELETE FROM Membership`;
    await prisma.$executeRaw`DELETE FROM User`;
    await prisma.$executeRaw`DELETE FROM Organization`;
    await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
  });

  beforeEach(async () => {
    await prisma.$executeRaw`PRAGMA foreign_keys = OFF`;
    await prisma.$executeRaw`DELETE FROM Membership`;
    await prisma.$executeRaw`DELETE FROM User`;
    await prisma.$executeRaw`DELETE FROM Organization`;
    await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(async () => {
    process.env = { ...ORIGINAL_ENV };
    await prisma.$disconnect();
  });

  it('adds the user to the default organization as their default membership', async () => {
    const org = await prisma.organization.create({
      data: { name: 'HPVs tingbibliotek', slug: DEFAULT_SLUG },
    });
    const user = await createUser('new-google-user@test.com');

    const ensureDefaultMembership = await loadEnsureDefaultMembership();
    await ensureDefaultMembership(user.id);

    const memberships = await prisma.membership.findMany({
      where: { userId: user.id },
    });
    expect(memberships).toHaveLength(1);
    expect(memberships[0].organizationId).toBe(org.id);
    expect(memberships[0].role).toBe('MEMBER');
    expect(memberships[0].status).toBe('ACTIVE');
    expect(memberships[0].isDefault).toBe(true);
  });

  it('is idempotent across repeated sign-ins', async () => {
    await prisma.organization.create({
      data: { name: 'HPVs tingbibliotek', slug: DEFAULT_SLUG },
    });
    const user = await createUser('returning-google-user@test.com');

    const ensureDefaultMembership = await loadEnsureDefaultMembership();
    await ensureDefaultMembership(user.id);
    await ensureDefaultMembership(user.id);

    const count = await prisma.membership.count({ where: { userId: user.id } });
    expect(count).toBe(1);
  });

  it('does not steal the default flag from an existing membership', async () => {
    const other = await prisma.organization.create({
      data: { name: 'Other Org', slug: 'other-org' },
    });
    await prisma.organization.create({
      data: { name: 'HPVs tingbibliotek', slug: DEFAULT_SLUG },
    });
    const user = await createUser('invited-user@test.com');
    await prisma.membership.create({
      data: {
        userId: user.id,
        organizationId: other.id,
        role: 'MEMBER',
        status: 'ACTIVE',
        isDefault: true,
      },
    });

    const ensureDefaultMembership = await loadEnsureDefaultMembership();
    await ensureDefaultMembership(user.id);

    const memberships = await prisma.membership.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });
    expect(memberships).toHaveLength(2);
    expect(memberships.filter((m) => m.isDefault)).toHaveLength(1);
    expect(memberships.find((m) => m.isDefault)?.organizationId).toBe(other.id);
  });

  it('leaves the user without a membership when the organization is missing', async () => {
    const user = await createUser('orgless-user@test.com');

    const ensureDefaultMembership = await loadEnsureDefaultMembership();
    await expect(ensureDefaultMembership(user.id)).resolves.toBeUndefined();

    const count = await prisma.membership.count({ where: { userId: user.id } });
    expect(count).toBe(0);
  });

  it('does nothing when OAUTH_DEFAULT_ORG_SLUG is empty', async () => {
    await prisma.organization.create({
      data: { name: 'HPVs tingbibliotek', slug: DEFAULT_SLUG },
    });
    const user = await createUser('opted-out@test.com');

    const ensureDefaultMembership = await loadEnsureDefaultMembership('');
    await ensureDefaultMembership(user.id);

    const count = await prisma.membership.count({ where: { userId: user.id } });
    expect(count).toBe(0);
  });
});
