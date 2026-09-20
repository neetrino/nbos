import { describe, expect, it } from 'vitest';
import {
  DELIVERY_COMPENSATION_ROLE_KEYS,
  DELIVERY_FUNCTION_CATEGORIES,
  DELIVERY_FUNCTION_ICON_ALLOWLIST,
  isDeliveryFunctionCategory,
} from '@nbos/shared';
import { DELIVERY_CATALOG_SEED_ITEMS, totalSeedUnits } from './delivery-catalog-seed-data';
import { seedUnitVectors } from './data/catalog-seed-types';

const MIN_EXPECTED_ITEMS = 100;

describe('delivery catalog seed data', () => {
  it('covers the whole business surface, not a sample', () => {
    expect(DELIVERY_CATALOG_SEED_ITEMS.length).toBeGreaterThanOrEqual(MIN_EXPECTED_ITEMS);
  });

  it('has unique codes', () => {
    const codes = DELIVERY_CATALOG_SEED_ITEMS.map((item) => item.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('uses only canonical categories', () => {
    const unknown = DELIVERY_CATALOG_SEED_ITEMS.filter(
      (item) => !isDeliveryFunctionCategory(item.category),
    );
    expect(unknown).toEqual([]);
  });

  it('uses only allowed icon keys', () => {
    const allowed = new Set<string>(DELIVERY_FUNCTION_ICON_ALLOWLIST);
    const unknown = DELIVERY_CATALOG_SEED_ITEMS.filter((item) => !allowed.has(item.iconKey)).map(
      (item) => `${item.code}:${item.iconKey}`,
    );
    expect(unknown).toEqual([]);
  });

  it('fills every category of the rail', () => {
    const used = new Set(DELIVERY_CATALOG_SEED_ITEMS.map((item) => item.category));
    const empty = DELIVERY_FUNCTION_CATEGORIES.filter((category) => !used.has(category));
    expect(empty).toEqual([]);
  });

  it('proposes positive units for every card and every gradation', () => {
    const withoutUnits = DELIVERY_CATALOG_SEED_ITEMS.filter((item) =>
      seedUnitVectors(item).some((units) => totalSeedUnits(units) <= 0),
    ).map((item) => item.code);
    expect(withoutUnits).toEqual([]);
    expect(DELIVERY_CATALOG_SEED_ITEMS.every((item) => seedUnitVectors(item).length > 0)).toBe(
      true,
    );
  });

  it('puts units either on the card or on its gradations, never on both', () => {
    const both = DELIVERY_CATALOG_SEED_ITEMS.filter((item) => item.units && item.tiers).map(
      (item) => item.code,
    );
    expect(both).toEqual([]);
  });

  it('gives every gradation a unique code and a label', () => {
    for (const item of DELIVERY_CATALOG_SEED_ITEMS) {
      if (!item.tiers) continue;
      const codes = item.tiers.map((tier) => tier.code);
      expect(new Set(codes).size, item.code).toBe(codes.length);
      expect(
        item.tiers.every((tier) => tier.label.length > 3),
        item.code,
      ).toBe(true);
    }
  });

  it('never maps one product type to two gradations of the same card', () => {
    for (const item of DELIVERY_CATALOG_SEED_ITEMS) {
      if (!item.tiers) continue;
      const types = item.tiers.flatMap((tier) => [...tier.productTypes]);
      expect(new Set(types).size, item.code).toBe(types.length);
    }
  });

  it('never proposes a negative or unknown role', () => {
    const roles = new Set<string>(DELIVERY_COMPENSATION_ROLE_KEYS);
    for (const item of DELIVERY_CATALOG_SEED_ITEMS) {
      for (const vector of seedUnitVectors(item)) {
        for (const [role, units] of Object.entries(vector)) {
          expect(roles.has(role), `${item.code} has unknown role ${role}`).toBe(true);
          expect(units, `${item.code}.${role}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('keeps every card described well enough to be sold and executed', () => {
    for (const item of DELIVERY_CATALOG_SEED_ITEMS) {
      expect(item.title.length, item.code).toBeGreaterThan(3);
      expect(item.summary.length, item.code).toBeGreaterThan(20);
      expect(item.scopeBoundaries.length, item.code).toBeGreaterThan(40);
    }
  });
});
