import type { Item } from '@ting/shared';

export function isAvailable(item: Pick<Item, 'status'>): boolean {
  return item.status === 'AVAILABLE';
}

export function canBorrow(item: Pick<Item, 'status' | 'approvalStatus'>): boolean {
  return item.status === 'AVAILABLE' && item.approvalStatus === 'APPROVED';
}

export function getItemUrl(item: Pick<Item, 'id' | 'slug'>): string {
  return `/items/${item.slug ?? item.id}`;
}
