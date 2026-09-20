import type {
  DeliveryCompensationRoleKey,
  DeliveryFunctionCategory,
  DeliveryFunctionIconKey,
} from '@nbos/shared';

/**
 * Proposed units per role. `null` means the role is not involved in this function at all, which is
 * a different statement from `0`. Every number here is a draft for the Owner to review: the seed
 * writes them as DRAFT price versions and publishes nothing.
 *
 * Scale used across the whole catalog: 1 unit is one thousand AMD of developer cost, and a unit is
 * sold at ten thousand AMD by default. A small online shop therefore lands around 300 units in
 * total, and a ten-million-AMD platform around 1000.
 */
export type CatalogSeedUnits = Partial<Record<DeliveryCompensationRoleKey, number>>;

export type CatalogSeedItem = {
  code: string;
  category: DeliveryFunctionCategory;
  iconKey: DeliveryFunctionIconKey;
  title: string;
  summary: string;
  scopeBoundaries: string;
  units: CatalogSeedUnits;
};

/** Total proposed units of a function, used for review listings and sanity checks. */
export function totalSeedUnits(units: CatalogSeedUnits): number {
  return Object.values(units).reduce((sum, value) => sum + (value ?? 0), 0);
}
