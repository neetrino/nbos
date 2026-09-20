import { describe, expect, it } from 'vitest';
import { DELIVERY_CATALOG_SEED_ITEMS } from './delivery-catalog-seed-data';
import { formatSeedPlan, planDeliveryCatalogSeed } from './plan-delivery-catalog-seed';

const items = [
  {
    code: 'BANK_PAYMENT',
    category: 'payments',
    iconKey: 'credit-card',
    title: 'Bank payment',
    summary: 'One gateway',
    scopeBoundaries: 'One gateway only',
  },
  {
    code: 'BOOKING_FLOW',
    category: 'platform',
    iconKey: 'calendar-check',
    title: 'Booking',
    summary: 'Resources',
    scopeBoundaries: 'No double booking',
  },
];

describe('planDeliveryCatalogSeed', () => {
  it('creates missing codes and keeps existing ones untouched', () => {
    const plan = planDeliveryCatalogSeed([{ id: 'fn-1', code: 'BANK_PAYMENT' }], items);

    expect(plan.createCount).toBe(1);
    expect(plan.keepCount).toBe(1);
    expect(plan.entries).toEqual([
      { action: 'KEEP', item: items[0], existingId: 'fn-1' },
      { action: 'CREATE', item: items[1] },
    ]);
  });

  it('is a no-op on a second run', () => {
    const existing = items.map((item, index) => ({ id: `fn-${index}`, code: item.code }));
    const plan = planDeliveryCatalogSeed(existing, items);

    expect(plan.createCount).toBe(0);
    expect(plan.entries.every((entry) => entry.action === 'KEEP')).toBe(true);
  });

  it('ships unique codes in the shipped catalog data', () => {
    const codes = DELIVERY_CATALOG_SEED_ITEMS.map((item) => item.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('marks a dry run in the printed plan', () => {
    const plan = planDeliveryCatalogSeed([], items);
    expect(formatSeedPlan(plan, false)).toContain('Dry run');
    expect(formatSeedPlan(plan, true)).toContain('Applying');
  });
});
