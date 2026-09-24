import type {
  DeliveryCompensationRoleKey,
  DeliveryFunctionCategory,
  DeliveryFunctionIconKey,
  ProductTypeKey,
} from '@nbos/shared';

/**
 * Proposed units per role. `null` means the role is not involved in this function at all, which is
 * a different statement from `0`. Every number here is a draft for the Owner to review: the seed
 * writes them as DRAFT price versions and publishes nothing.
 *
 * Scale used across the whole catalog: 1 unit is one thousand AMD of developer cost.
 * The card sale price is 5 000 AMD per seeded unit (10 units → 50 000, 20 → 100 000).
 */
export type CatalogSeedUnits = Partial<Record<DeliveryCompensationRoleKey, number>>;

/**
 * One volume of the same work. `productTypes` lists the kinds of product this volume is the default
 * for, so the configurator resolves it without asking. An empty list means only a person can decide,
 * which is the case for catalogue import: the volume comes from the client's data, not from the
 * product kind, so the server refuses to guess and asks.
 */
export type CatalogSeedTier = {
  code: string;
  label: string;
  productTypes: readonly ProductTypeKey[];
  units: CatalogSeedUnits;
};

export type CatalogSeedItem = {
  code: string;
  category: DeliveryFunctionCategory;
  iconKey: DeliveryFunctionIconKey;
  title: string;
  summary: string;
  scopeBoundaries: string;
  /** Set for a card sold at one volume. Mutually exclusive with `tiers`. */
  units?: CatalogSeedUnits;
  /** Set for a card sold at several volumes. Units then live on each gradation. */
  tiers?: readonly CatalogSeedTier[];
};

/** Total proposed units of a function, used for review listings and sanity checks. */
export function totalSeedUnits(units: CatalogSeedUnits): number {
  return Object.values(units).reduce((sum, value) => sum + (value ?? 0), 0);
}

/** Every unit vector a card proposes: one for a plain card, one per gradation for a tiered one. */
export function seedUnitVectors(item: CatalogSeedItem): CatalogSeedUnits[] {
  if (item.tiers) {
    return item.tiers.map((tier) => tier.units);
  }
  return item.units ? [item.units] : [];
}
