import { prisma } from '../prisma.js';

// Users signing in with Google, or registering via email/password without an
// explicit invite, are enrolled in this organization automatically.
// Override with OAUTH_DEFAULT_ORG_SLUG; set it to an empty string to disable.
const DEFAULT_ORG_SLUG =
  process.env.OAUTH_DEFAULT_ORG_SLUG ?? 'hpv-tingbibliotek';

/**
 * Give the user a membership in the default organization unless they already
 * have one. Never throws: a missing organization or a race with a concurrent
 * sign-in / registration must not fail the calling request.
 */
export async function ensureDefaultMembership(userId: string): Promise<void> {
  if (!DEFAULT_ORG_SLUG) return;

  try {
    const organization = await prisma.organization.findUnique({
      where: { slug: DEFAULT_ORG_SLUG },
      select: { id: true },
    });

    if (!organization) {
      console.warn(
        `⚠️  Default organization "${DEFAULT_ORG_SLUG}" not found; user ${userId} enrolled without a membership`,
      );
      return;
    }

    const existing = await prisma.membership.findUnique({
      where: {
        userId_organizationId: { userId, organizationId: organization.id },
      },
      select: { id: true },
    });
    if (existing) return;

    // Only the user's first membership becomes the default one.
    const membershipCount = await prisma.membership.count({ where: { userId } });

    await prisma.membership.create({
      data: {
        userId,
        organizationId: organization.id,
        role: 'MEMBER',
        status: 'ACTIVE',
        isDefault: membershipCount === 0,
      },
    });
  } catch (error) {
    console.error('Failed to assign default membership:', error);
  }
}
