import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcryptjs.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ting.com' },
    update: {},
    create: {
      email: 'admin@ting.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created');

  // Create test user
  const userPassword = await bcryptjs.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@ting.com' },
    update: {},
    create: {
      email: 'user@ting.com',
      passwordHash: userPassword,
      name: 'Test User',
      role: 'MEMBER',
    },
  });
  console.log('✅ Test user created');

  // Create categories
  const powerTools = await prisma.category.upsert({
    where: { id: 'cat-power-tools' },
    update: {},
    create: {
      id: 'cat-power-tools',
      name: 'Power Tools',
      description: 'Electric and battery-powered tools',
    },
  });

  const handTools = await prisma.category.upsert({
    where: { id: 'cat-hand-tools' },
    update: {},
    create: {
      id: 'cat-hand-tools',
      name: 'Hand Tools',
      description: 'Manual tools and equipment',
    },
  });

  const gardening = await prisma.category.upsert({
    where: { id: 'cat-gardening' },
    update: {},
    create: {
      id: 'cat-gardening',
      name: 'Gardening',
      description: 'Tools for outdoor and garden work',
    },
  });

  console.log('✅ Categories created');

  // Create items
  await prisma.item.createMany({
    data: [
      // Power Tools
      {
        name: 'Cordless Drill',
        description: '18V cordless drill with 2 batteries and charger',
        categoryId: powerTools.id,
        status: 'AVAILABLE',
      },
      {
        name: 'Circular Saw',
        description: '7-1/4" circular saw with laser guide',
        categoryId: powerTools.id,
        status: 'AVAILABLE',
      },
      {
        name: 'Jigsaw',
        description: 'Variable speed jigsaw with assorted blades',
        categoryId: powerTools.id,
        status: 'AVAILABLE',
      },
      // Hand Tools
      {
        name: 'Hammer Set',
        description: 'Claw hammer and rubber mallet set',
        categoryId: handTools.id,
        status: 'AVAILABLE',
      },
      {
        name: 'Screwdriver Set',
        description: '12-piece screwdriver set with magnetic tips',
        categoryId: handTools.id,
        status: 'AVAILABLE',
      },
      {
        name: 'Socket Wrench Set',
        description: '40-piece socket and ratchet set',
        categoryId: handTools.id,
        status: 'AVAILABLE',
      },
      // Gardening
      {
        name: 'Lawn Mower',
        description: 'Gas-powered push lawn mower',
        categoryId: gardening.id,
        status: 'AVAILABLE',
      },
      {
        name: 'Hedge Trimmer',
        description: 'Electric hedge trimmer with 20" blade',
        categoryId: gardening.id,
        status: 'AVAILABLE',
      },
      {
        name: 'Garden Tools Set',
        description: 'Shovel, rake, hoe, and trowel',
        categoryId: gardening.id,
        status: 'AVAILABLE',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Items created');

  console.log('🎉 Seeding complete!');
  console.log('\nTest accounts:');
  console.log('Admin: admin@ting.com / admin123');
  console.log('User: user@ting.com / user123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
