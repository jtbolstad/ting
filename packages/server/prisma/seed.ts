import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

type OrgKey = 'oslo' | 'bergen';

const ORG_DEFINITIONS: Record<OrgKey, { name: string; slug: string; description: string }> = {
  oslo: {
    name: 'Oslo Tool Library',
    slug: 'oslo-tool-library',
    description: 'Flagship Ting community lending hub in Oslo.',
  },
  bergen: {
    name: 'Bergen Community Lending',
    slug: 'bergen-community-lending',
    description: 'West-coast collective focused on outdoor and maker gear.',
  },
};

const GROUP_SEEDS: Record<OrgKey, Array<{ key: string; name: string; description: string }>> = {
  oslo: [
    { key: 'volunteers', name: 'Front Desk Volunteers', description: 'Members who help with daily operations.' },
    { key: 'garden', name: 'Garden Collective', description: 'Folks focused on gardening tools & workshops.' },
  ],
  bergen: [
    { key: 'makers', name: 'Makers Collective', description: 'Woodshop mentors and workshop leads.' },
    { key: 'mobility', name: 'Mobility Crew', description: 'Members responsible for bikes & transport gear.' },
  ],
};

const CATEGORY_SEEDS: Record<OrgKey, Array<{ key: string; name: string; description: string }>> = {
  oslo: [
    { key: 'power', name: 'Power Tools', description: 'Corded and cordless power equipment.' },
    { key: 'garden', name: 'Garden & Outdoor', description: 'Everything for outdoor maintenance.' },
    { key: 'events', name: 'Events & Party', description: 'Event, party, and pop-up equipment.' },
  ],
  bergen: [
    { key: 'woodshop', name: 'Woodshop', description: 'Benchtop and handheld woodworking tools.' },
    { key: 'electronics', name: 'Electronics', description: 'AV gear, projectors, and sensors.' },
    { key: 'mobility', name: 'Mobility', description: 'Bikes, cargo trailers, and related gear.' },
  ],
};

const ITEM_SEEDS: Record<
  OrgKey,
  Array<{ key: string; name: string; description: string; categoryKey: string; status?: string }>
> = {
  oslo: [
    { key: 'drill', name: '18V Cordless Drill', description: 'Drill/driver with 2 batteries + charger.', categoryKey: 'power' },
    { key: 'impact-driver', name: 'Impact Driver', description: 'Compact impact driver for heavy screws.', categoryKey: 'power', status: 'CHECKED_OUT' },
    { key: 'sander', name: 'Orbital Sander', description: '5" orbital sander w/ dust bag.', categoryKey: 'power' },
    { key: 'pressure-washer', name: 'Pressure Washer', description: '1800 PSI electric washer.', categoryKey: 'garden' },
    { key: 'hedge-trimmer', name: 'Hedge Trimmer', description: 'Cordless trimmer with 24" blade.', categoryKey: 'garden' },
    { key: 'party-lights', name: 'String Lights Kit', description: '20m warm LED string lights.', categoryKey: 'events' },
    { key: 'folding-tables', name: 'Folding Tables (2)', description: 'Two 180cm tables for events.', categoryKey: 'events', status: 'MAINTENANCE' },
  ],
  bergen: [
    { key: 'planer', name: 'Benchtop Planer', description: '12" planer for lumber prep.', categoryKey: 'woodshop' },
    { key: 'jigsaw', name: 'Jigsaw', description: 'Variable speed jigsaw with blades.', categoryKey: 'woodshop' },
    { key: 'projector', name: 'Portable Projector', description: '1080p projector w/ HDMI & case.', categoryKey: 'electronics', status: 'CHECKED_OUT' },
    { key: 'field-recorder', name: 'Field Recorder', description: 'Zoom H5 recorder with mics.', categoryKey: 'electronics' },
    { key: 'cargo-bike', name: 'Cargo Bike', description: 'Two-wheel cargo bike with child bench.', categoryKey: 'mobility' },
    { key: 'bike-trailer', name: 'Bike Trailer', description: 'Flatbed trailer for hauling gear.', categoryKey: 'mobility' },
  ],
};

type UserSeed = {
  key: string;
  email: string;
  name: string;
  password: string;
  role: 'ADMIN' | 'MEMBER';
  memberships: Array<{
    orgKey: OrgKey;
    role: string;
    isDefault?: boolean;
    groups?: string[];
  }>;
};

const USER_SEEDS: UserSeed[] = [
  {
    key: 'admin',
    email: 'admin@ting.com',
    name: 'Platform Admin',
    password: 'admin123',
    role: 'ADMIN',
    memberships: [
      { orgKey: 'oslo', role: 'OWNER', isDefault: true, groups: ['volunteers'] },
      { orgKey: 'bergen', role: 'ADMIN', groups: ['makers'] },
    ],
  },
  {
    key: 'emma',
    email: 'emma@ting.com',
    name: 'Emma Hansen',
    password: 'user123',
    role: 'MEMBER',
    memberships: [{ orgKey: 'oslo', role: 'MANAGER', isDefault: true, groups: ['garden'] }],
  },
  {
    key: 'lars',
    email: 'lars@ting.com',
    name: 'Lars Nilsen',
    password: 'user123',
    role: 'MEMBER',
    memberships: [{ orgKey: 'oslo', role: 'MEMBER', isDefault: true }],
  },
  {
    key: 'maria',
    email: 'maria@ting.com',
    name: 'Maria Solheim',
    password: 'user123',
    role: 'MEMBER',
    memberships: [{ orgKey: 'bergen', role: 'MANAGER', isDefault: true, groups: ['makers'] }],
  },
  {
    key: 'svein',
    email: 'svein@ting.com',
    name: 'Svein Arnesen',
    password: 'user123',
    role: 'MEMBER',
    memberships: [
      { orgKey: 'bergen', role: 'MEMBER', isDefault: true, groups: ['mobility'] },
      { orgKey: 'oslo', role: 'MEMBER' },
    ],
  },
];

type ReservationSeed = {
  key: string;
  orgKey: OrgKey;
  itemKey: string;
  userKey: string;
  startInDays: number;
  durationDays: number;
  status?: string;
};

const RESERVATION_SEEDS: ReservationSeed[] = [
  {
    key: 'oslo-garden',
    orgKey: 'oslo',
    itemKey: 'hedge-trimmer',
    userKey: 'emma',
    startInDays: 2,
    durationDays: 3,
    status: 'CONFIRMED',
  },
  {
    key: 'bergen-maker',
    orgKey: 'bergen',
    itemKey: 'planer',
    userKey: 'maria',
    startInDays: -5,
    durationDays: 5,
    status: 'COMPLETED',
  },
];

type LoanSeed = {
  orgKey: OrgKey;
  itemKey: string;
  userKey: string;
  checkedOutDaysAgo: number;
  dueInDays: number;
  reservationKey?: string;
};

const LOAN_SEEDS: LoanSeed[] = [
  {
    orgKey: 'oslo',
    itemKey: 'impact-driver',
    userKey: 'lars',
    checkedOutDaysAgo: 3,
    dueInDays: 4,
  },
  {
    orgKey: 'bergen',
    itemKey: 'projector',
    userKey: 'maria',
    checkedOutDaysAgo: 5,
    dueInDays: -1, // overdue
    reservationKey: 'bergen-maker',
  },
];

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function main() {
  console.log('🌱 Seeding Ting multi-tenant data...');

  await prisma.auditLog.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.item.deleteMany();
  await prisma.category.deleteMany();
  await prisma.memberGroupMembership.deleteMany();
  await prisma.memberGroup.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();
  console.log('🗑️  Cleared existing records');

  const orgMap: Record<OrgKey, Awaited<ReturnType<typeof prisma.organization.create>>> = {
    oslo: await prisma.organization.create({ data: ORG_DEFINITIONS.oslo }),
    bergen: await prisma.organization.create({ data: ORG_DEFINITIONS.bergen }),
  };
  console.log('🏢 Created organizations:', Object.values(orgMap).map(o => o.name).join(', '));

  const groupMap: Record<OrgKey, Record<string, Awaited<ReturnType<typeof prisma.memberGroup.create>>>> = {
    oslo: {},
    bergen: {},
  };

  for (const orgKey of Object.keys(GROUP_SEEDS) as OrgKey[]) {
    for (const groupSeed of GROUP_SEEDS[orgKey]) {
      const group = await prisma.memberGroup.create({
        data: {
          organizationId: orgMap[orgKey].id,
          name: groupSeed.name,
          description: groupSeed.description,
        },
      });
      groupMap[orgKey][groupSeed.key] = group;
    }
  }
  console.log('👥 Created member groups');

  const categoryMap: Record<OrgKey, Record<string, Awaited<ReturnType<typeof prisma.category.create>>>> = {
    oslo: {},
    bergen: {},
  };
  for (const orgKey of Object.keys(CATEGORY_SEEDS) as OrgKey[]) {
    for (const categorySeed of CATEGORY_SEEDS[orgKey]) {
      const category = await prisma.category.create({
        data: {
          organizationId: orgMap[orgKey].id,
          name: categorySeed.name,
          description: categorySeed.description,
        },
      });
      categoryMap[orgKey][categorySeed.key] = category;
    }
  }
  console.log('🗂️  Created categories');

  const itemMap: Record<OrgKey, Record<string, Awaited<ReturnType<typeof prisma.item.create>>>> = {
    oslo: {},
    bergen: {},
  };
  for (const orgKey of Object.keys(ITEM_SEEDS) as OrgKey[]) {
    for (const itemSeed of ITEM_SEEDS[orgKey]) {
      const item = await prisma.item.create({
        data: {
          organizationId: orgMap[orgKey].id,
          name: itemSeed.name,
          description: itemSeed.description,
          categoryId: categoryMap[orgKey][itemSeed.categoryKey].id,
          status: itemSeed.status ?? 'AVAILABLE',
        },
      });
      itemMap[orgKey][itemSeed.key] = item;
    }
  }
  console.log('📦 Created inventory items');

  const userMap: Record<string, Awaited<ReturnType<typeof prisma.user.create>>> = {};
  const membershipMap: Record<string, Awaited<ReturnType<typeof prisma.membership.create>>> = {};

  for (const userSeed of USER_SEEDS) {
    const passwordHash = await bcryptjs.hash(userSeed.password, 10);
    const user = await prisma.user.create({
      data: {
        email: userSeed.email,
        passwordHash,
        name: userSeed.name,
        role: userSeed.role,
      },
    });
    userMap[userSeed.key] = user;

    for (const membershipSeed of userSeed.memberships) {
      const membership = await prisma.membership.create({
        data: {
          userId: user.id,
          organizationId: orgMap[membershipSeed.orgKey].id,
          role: membershipSeed.role,
          status: 'ACTIVE',
          isDefault: membershipSeed.isDefault ?? false,
        },
      });
      membershipMap[`${userSeed.key}-${membershipSeed.orgKey}`] = membership;

      if (membershipSeed.groups) {
        for (const groupKey of membershipSeed.groups) {
          const group = groupMap[membershipSeed.orgKey][groupKey];
          await prisma.memberGroupMembership.create({
            data: {
              membershipId: membership.id,
              groupId: group.id,
            },
          });
        }
      }
    }
  }
  console.log('🙋 Created users & memberships');

  const reservationMap: Record<string, Awaited<ReturnType<typeof prisma.reservation.create>>> = {};
  const now = new Date();
  for (const reservationSeed of RESERVATION_SEEDS) {
    const startDate = addDays(now, reservationSeed.startInDays);
    const endDate = addDays(startDate, reservationSeed.durationDays);
    const reservation = await prisma.reservation.create({
      data: {
        organizationId: orgMap[reservationSeed.orgKey].id,
        userId: userMap[reservationSeed.userKey].id,
        itemId: itemMap[reservationSeed.orgKey][reservationSeed.itemKey].id,
        startDate,
        endDate,
        status: reservationSeed.status ?? 'CONFIRMED',
      },
    });
    reservationMap[reservationSeed.key] = reservation;
  }
  console.log('🗓️  Created reservations');

  for (const loanSeed of LOAN_SEEDS) {
    const checkedOutAt = addDays(now, -loanSeed.checkedOutDaysAgo);
    const dueDate = addDays(now, loanSeed.dueInDays);
    const reservation = loanSeed.reservationKey ? reservationMap[loanSeed.reservationKey] : undefined;

    await prisma.loan.create({
      data: {
        organizationId: orgMap[loanSeed.orgKey].id,
        userId: userMap[loanSeed.userKey].id,
        itemId: itemMap[loanSeed.orgKey][loanSeed.itemKey].id,
        reservationId: reservation?.id ?? null,
        checkedOutAt,
        dueDate,
      },
    });

    await prisma.item.update({
      where: { id: itemMap[loanSeed.orgKey][loanSeed.itemKey].id },
      data: { status: 'CHECKED_OUT' },
    });
  }
  console.log('📚 Created sample loans');

  console.log('🎉 Seeding complete!');
  console.log('- Organizations:', Object.values(orgMap).length);
  console.log('- Users:', Object.values(userMap).length);
  console.log('- Memberships:', Object.values(membershipMap).length);
  console.log('- Items:', Object.values(itemMap.oslo).length + Object.values(itemMap.bergen).length);
  console.log('- Reservations:', Object.values(reservationMap).length);
  console.log('- Loans:', LOAN_SEEDS.length);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
