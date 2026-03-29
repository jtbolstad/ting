import { describe, it, expect } from 'vitest';
import { isAvailable, canBorrow, getItemUrl } from './itemUtils';

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
