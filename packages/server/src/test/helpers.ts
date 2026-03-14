import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

export async function createTestUser(data?: {
  email?: string;
  password?: string;
  name?: string;
  role?: string;
}) {
  const passwordHash = await bcryptjs.hash(data?.password || 'password123', 10);
  
  return prisma.user.create({
    data: {
      email: data?.email || `test-${Date.now()}@test.com`,
      passwordHash,
      name: data?.name || 'Test User',
      role: data?.role || 'MEMBER',
    },
  });
}

export async function createTestCategory(data?: {
  name?: string;
  description?: string;
  parentId?: string;
}) {
  return prisma.category.create({
    data: {
      name: data?.name || `Test Category ${Date.now()}`,
      description: data?.description || null,
      parentId: data?.parentId || null,
    },
  });
}

export async function createTestItem(categoryId: string, data?: {
  name?: string;
  description?: string;
  status?: string;
}) {
  return prisma.item.create({
    data: {
      name: data?.name || `Test Item ${Date.now()}`,
      description: data?.description || null,
      categoryId,
      status: data?.status || 'AVAILABLE',
    },
  });
}

export async function createTestReservation(
  userId: string,
  itemId: string,
  data?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
  }
) {
  return prisma.reservation.create({
    data: {
      userId,
      itemId,
      startDate: data?.startDate || new Date(),
      endDate: data?.endDate || new Date(Date.now() + 86400000), // +1 day
      status: data?.status || 'CONFIRMED',
    },
  });
}

export async function createTestLoan(
  userId: string,
  itemId: string,
  data?: {
    dueDate?: Date;
    reservationId?: string;
  }
) {
  return prisma.loan.create({
    data: {
      userId,
      itemId,
      dueDate: data?.dueDate || new Date(Date.now() + 604800000), // +7 days
      reservationId: data?.reservationId || null,
    },
  });
}
