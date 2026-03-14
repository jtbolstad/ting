import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: { db: { url: 'file:./test-items.db' } },
});

describe('Items Database Operations', () => {
  let categoryId: string;

  beforeAll(async () => {
    // Clear test data
    await prisma.loan.deleteMany();
    await prisma.reservation.deleteMany();
    await prisma.item.deleteMany();
    await prisma.category.deleteMany();

    // Create test category
    const category = await prisma.category.create({
      data: {
        name: 'Test Category',
        description: 'For testing',
      },
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.item.deleteMany();
  });

  describe('Create Item', () => {
    it('should create an item with required fields', async () => {
      const item = await prisma.item.create({
        data: {
          name: 'Test Drill',
          description: 'A powerful drill',
          categoryId,
          status: 'AVAILABLE',
        },
      });

      expect(item.id).toBeDefined();
      expect(item.name).toBe('Test Drill');
      expect(item.status).toBe('AVAILABLE');
    });

    it('should create item without description', async () => {
      const item = await prisma.item.create({
        data: {
          name: 'Simple Item',
          categoryId,
          status: 'AVAILABLE',
        },
      });

      expect(item.description).toBeNull();
    });
  });

  describe('Query Items', () => {
    beforeEach(async () => {
      await prisma.item.createMany({
        data: [
          { name: 'Cordless Drill', description: '18V drill', categoryId, status: 'AVAILABLE' },
          { name: 'Hammer', description: 'Claw hammer', categoryId, status: 'CHECKED_OUT' },
          { name: 'Screwdriver', description: 'Phillips head', categoryId, status: 'AVAILABLE' },
        ],
      });
    });

    it('should find all items', async () => {
      const items = await prisma.item.findMany();
      expect(items).toHaveLength(3);
    });

    it('should filter by status', async () => {
      const available = await prisma.item.findMany({
        where: { status: 'AVAILABLE' },
      });
      expect(available).toHaveLength(2);
    });

    it('should search by name', async () => {
      const results = await prisma.item.findMany({
        where: {
          name: { contains: 'Drill' },
        },
      });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Cordless Drill');
    });

    it('should include category relation', async () => {
      const item = await prisma.item.findFirst({
        include: { category: true },
      });
      expect(item?.category).toBeDefined();
      expect(item?.category?.name).toBe('Test Category');
    });
  });

  describe('Update Item', () => {
    it('should update item status', async () => {
      const item = await prisma.item.create({
        data: { name: 'Test Item', categoryId, status: 'AVAILABLE' },
      });

      const updated = await prisma.item.update({
        where: { id: item.id },
        data: { status: 'CHECKED_OUT' },
      });

      expect(updated.status).toBe('CHECKED_OUT');
    });

    it('should update item details', async () => {
      const item = await prisma.item.create({
        data: { name: 'Old Name', categoryId, status: 'AVAILABLE' },
      });

      const updated = await prisma.item.update({
        where: { id: item.id },
        data: {
          name: 'New Name',
          description: 'Updated description',
        },
      });

      expect(updated.name).toBe('New Name');
      expect(updated.description).toBe('Updated description');
    });
  });

  describe('Delete Item', () => {
    it('should delete an item', async () => {
      const item = await prisma.item.create({
        data: { name: 'To Delete', categoryId, status: 'AVAILABLE' },
      });

      await prisma.item.delete({
        where: { id: item.id },
      });

      const found = await prisma.item.findUnique({
        where: { id: item.id },
      });

      expect(found).toBeNull();
    });
  });
});
