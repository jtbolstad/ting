/**
 * One-time backfill: enrol every user who has no membership into
 * the default organisation (hpv-tingbibliotek / OAUTH_DEFAULT_ORG_SLUG).
 *
 * Usage:
 *   npx tsx packages/server/prisma/backfill-memberships.ts
 *
 * Safe to re-run: users who already have a membership are skipped.
 * The first (and only) membership each user receives is marked isDefault=true.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEFAULT_ORG_SLUG = process.env.OAUTH_DEFAULT_ORG_SLUG ?? "hpv-tingbibliotek";

async function main() {
  const organization = await prisma.organization.findUnique({
    where: { slug: DEFAULT_ORG_SLUG },
    select: { id: true, name: true },
  });

  if (!organization) {
    console.error(`❌  Organization "${DEFAULT_ORG_SLUG}" not found. Set OAUTH_DEFAULT_ORG_SLUG or check the slug.`);
    process.exit(1);
  }

  console.log(`🏢  Target org: ${organization.name} (${organization.id})`);

  // Find every user who has no memberships at all
  const orphanUsers = await prisma.user.findMany({
    where: { memberships: { none: {} } },
    select: { id: true, email: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`👤  Users without any membership: ${orphanUsers.length}`);

  if (orphanUsers.length === 0) {
    console.log("✅  Nothing to backfill.");
    return;
  }

  let created = 0;
  let skipped = 0;

  for (const user of orphanUsers) {
    // Guard: check they don't already have this specific membership
    // (shouldn't happen given the query above, but be safe)
    const existing = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organization.id,
        },
      },
      select: { id: true },
    });

    if (existing) {
      console.log(`  ⤷ skip  ${user.email} (already enrolled)`);
      skipped++;
      continue;
    }

    await prisma.membership.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: "MEMBER",
        status: "ACTIVE",
        isDefault: true,   // first and only membership → mark as default
      },
    });

    console.log(`  ✓ enrol ${user.email}`);
    created++;
  }

  console.log(`\n✅  Done. Created: ${created}  Skipped (already had membership): ${skipped}`);
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
