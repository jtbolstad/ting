import { describe, it, expect } from 'vitest';
import { isAvailable, canBorrow, getItemUrl, pickRandomItems } from './itemUtils';

describe('isAvailable', () => {
  it('returnerer true når status er AVAILABLE', () => {
    expect(isAvailable({ status: 'AVAILABLE' })).toBe(true);
  });

  it('returnerer false når status er CHECKED_OUT', () => {
    expect(isAvailable({ status: 'CHECKED_OUT' })).toBe(false);
  });

  it('returnerer false når status er MAINTENANCE', () => {
    expect(isAvailable({ status: 'MAINTENANCE' })).toBe(false);
  });

  it('returnerer false når status er RETIRED', () => {
    expect(isAvailable({ status: 'RETIRED' })).toBe(false);
  });
});

describe('canBorrow', () => {
  it('returnerer true for tilgjengelig og godkjent ting', () => {
    expect(canBorrow({ status: 'AVAILABLE', approvalStatus: 'APPROVED' })).toBe(true);
  });

  it('returnerer false når ting er utlånt', () => {
    expect(canBorrow({ status: 'CHECKED_OUT', approvalStatus: 'APPROVED' })).toBe(false);
  });

  it('returnerer false når ting venter på godkjenning', () => {
    expect(canBorrow({ status: 'AVAILABLE', approvalStatus: 'PENDING' })).toBe(false);
  });

  it('returnerer false når ting er avvist', () => {
    expect(canBorrow({ status: 'AVAILABLE', approvalStatus: 'REJECTED' })).toBe(false);
  });
});

describe('getItemUrl', () => {
  it('bruker slug når tilgjengelig', () => {
    expect(getItemUrl({ id: 'abc123', slug: 'bosch-drill-abc123' })).toBe(
      '/items/bosch-drill-abc123'
    );
  });

  it('faller tilbake til id når slug mangler', () => {
    expect(getItemUrl({ id: 'abc123', slug: undefined })).toBe('/items/abc123');
  });
});

describe('pickRandomItems', () => {
  const pool = [1, 2, 3, 4, 5];

  it('returnerer så mange elementer som det bes om', () => {
    expect(pickRandomItems(pool, 3)).toHaveLength(3);
  });

  it('returnerer hele lista når den er kortere enn antallet', () => {
    expect(pickRandomItems([1, 2], 3).sort()).toEqual([1, 2]);
  });

  it('returnerer tom liste for tom input', () => {
    expect(pickRandomItems([], 3)).toEqual([]);
  });

  it('gjentar ikke samme element', () => {
    for (let i = 0; i < 50; i++) {
      const picked = pickRandomItems(pool, 3);
      expect(new Set(picked).size).toBe(3);
    }
  });

  it('plukker bare elementer fra input', () => {
    for (let i = 0; i < 50; i++) {
      for (const value of pickRandomItems(pool, 3)) {
        expect(pool).toContain(value);
      }
    }
  });

  it('lar input-lista være urørt', () => {
    const original = [...pool];
    pickRandomItems(pool, 3);
    expect(pool).toEqual(original);
  });

  it('varierer utvalget over mange kall', () => {
    const seen = new Set(
      Array.from({ length: 100 }, () => pickRandomItems(pool, 3).join(','))
    );
    expect(seen.size).toBeGreaterThan(1);
  });
});
