import type { Item } from '@ting/shared';

export const mockItem: Item = {
  id: 'cmmv0181w000nzrq2npq0r8cz',
  slug: '18v-cordless-drill-q0r8cz',
  name: '18V Cordless Drill',
  description: 'Drill/driver with 2 batteries + charger.',
  categoryId: 'cat-power',
  category: { id: 'cat-power', name: 'Power Tools', description: null, parentId: null },
  status: 'AVAILABLE',
  imageUrl: null,
  locationId: null,
  ownerId: null,
  ownerType: 'ORGANIZATION',
  approvalStatus: 'APPROVED',
  condition: null,
  tags: ['drill', 'cordless'],
  images: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

export const mockCheckedOutItem: Item = {
  ...mockItem,
  id: 'cmmv0181z000pzrq2g0j66i6t',
  slug: 'impact-driver-j66i6t',
  name: 'Impact Driver',
  description: 'Compact impact driver for heavy screws.',
  status: 'CHECKED_OUT',
  tags: [],
};

export const mockItems: Item[] = [mockItem, mockCheckedOutItem];
