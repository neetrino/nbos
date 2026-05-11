import { describe, expect, it } from 'vitest';
import { getAccessSlotsForProduct } from './product-access-slots';

describe('getAccessSlotsForProduct', () => {
  it('returns domain and hosting for CODE websites', () => {
    const slots = getAccessSlotsForProduct('CODE', 'COMPANY_WEBSITE');
    const keys = slots.map((s) => s.slotKey);
    expect(keys).toContain('DOMAIN');
    expect(keys).toContain('HOSTING');
  });

  it('adds app store slot for MOBILE_APP type', () => {
    const slots = getAccessSlotsForProduct('CODE', 'MOBILE_APP');
    expect(slots.some((s) => s.slotKey === 'APP_STORE')).toBe(true);
  });

  it('returns empty for unknown category', () => {
    expect(getAccessSlotsForProduct('UNKNOWN', 'OTHER')).toEqual([]);
  });
});
