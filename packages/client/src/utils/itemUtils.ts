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

/**
 * Returns up to `count` items picked at random, without repeats.
 * Partial Fisher-Yates on a copy, so the input array is left alone.
 */
export function pickRandomItems<T>(items: readonly T[], count: number): T[] {
  const pool = [...items];
  const take = Math.max(0, Math.min(count, pool.length));
  for (let i = 0; i < take; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, take);
}
