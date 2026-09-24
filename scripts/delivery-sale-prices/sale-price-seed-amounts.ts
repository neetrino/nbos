/** Whole card price: 5 000 AMD for each seeded unit. 10 units → 50 000, 20 → 100 000. */
export const SALE_AMD_PER_SEED_UNIT = 5_000;

/**
 * Card price from the seeded unit total. The stored figure is the whole card, not a rate.
 */
export function saleAmountForUnits(totalUnits: number): string {
  if (!Number.isInteger(totalUnits) || totalUnits < 1) {
    throw new Error(`Sale amount needs a positive whole unit total, got ${totalUnits}.`);
  }
  return String(totalUnits * SALE_AMD_PER_SEED_UNIT);
}
