import { DELIVERY_COMPENSATION_ROLE_KEYS } from '@nbos/shared';
import type { CatalogSeedUnits } from './data/catalog-seed-types';

export type SeedRoleUnitRow = {
  roleKey: (typeof DELIVERY_COMPENSATION_ROLE_KEYS)[number];
  unitKind: 'REQUIRED' | 'NOT_REQUIRED';
  units: string | null;
};

/**
 * Builds the complete six-role vector a price version needs. A role the card does not involve is
 * written as NOT_REQUIRED with null units, which is a different statement from zero units, and the
 * difference is what keeps an unconfigured role from silently paying nothing.
 */
export function buildSeedRoleUnits(units: CatalogSeedUnits): SeedRoleUnitRow[] {
  return DELIVERY_COMPENSATION_ROLE_KEYS.map((roleKey) => {
    const value = units[roleKey];
    if (value === undefined) {
      return { roleKey, unitKind: 'NOT_REQUIRED' as const, units: null };
    }
    return { roleKey, unitKind: 'REQUIRED' as const, units: value.toFixed(4) };
  });
}
