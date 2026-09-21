import type {
  DeliveryCompensationRoleKey,
  DeliveryConfigSize,
  ProductCategoryKey,
  ProductTypeKey,
} from '@nbos/shared';

/**
 * Proposed core units per role. A role left out is written as NOT_REQUIRED with null units, which
 * is a different statement from zero. Same scale as the function catalog: one unit is a thousand
 * AMD of developer cost.
 */
export type ProfileSeedUnits = Partial<Record<DeliveryCompensationRoleKey, number>>;

/** One line of the core composition, as a client and an acceptance argument would read it. */
export type ProfileSeedCoreItem = {
  label: string;
  note?: string;
};

/**
 * The core of one kind of product. The core is indivisible: it cannot be switched off, taken apart
 * or discounted, and its composition is identical at every size. Only its volume grows, because the
 * same framework, design system and regression serve thirty modules instead of ten — which is where
 * the agreed non-linearity lives instead of a size price axis.
 */
export type ProfileSeedKind = {
  /** Stem of the profile key; the size is appended, because one key carries one live norm. */
  keyStem: string;
  productType: ProductTypeKey;
  productCategory: ProductCategoryKey;
  description: string;
  coreItems: readonly ProfileSeedCoreItem[];
  /** Units at CLASSIC. Other sizes are derived from these by `CORE_SIZE_FACTORS`. */
  classicUnits: ProfileSeedUnits;
  /**
   * Catalog cards whose work is already paid by the core units of this kind. This is a strong
   * claim — it makes the card free — so it holds only where the card and a core line describe the
   * same work. Everything else stays a paid extra, including cards that merely sound similar.
   */
  includedFunctionCodes: readonly string[];
  /**
   * Modules pre-checked in the constructor at each size. A preset does NOT make a module free: it
   * is charged as an ordinary extra. Mixing this up with `includedFunctionCodes` would hand away
   * the whole largest level.
   */
  presets: Readonly<Record<DeliveryConfigSize, readonly string[]>>;
};

/**
 * How core volume scales with size. Drafts for the Owner to correct: the shape is the decision
 * (composition fixed, volume grows), the numbers are a starting point.
 */
export const CORE_SIZE_FACTORS: Readonly<Record<DeliveryConfigSize, number>> = {
  SMALL: 0.8,
  CLASSIC: 1,
  LARGE: 1.25,
  VERY_LARGE: 1.5,
  ENTERPRISE: 2,
};

/** Scales a core vector to a size, rounded to whole units so the Owner reviews readable numbers. */
export function unitsForSize(units: ProfileSeedUnits, size: DeliveryConfigSize): ProfileSeedUnits {
  const factor = CORE_SIZE_FACTORS[size];
  const scaled: ProfileSeedUnits = {};
  for (const [roleKey, value] of Object.entries(units)) {
    scaled[roleKey as DeliveryCompensationRoleKey] = Math.round(value * factor);
  }
  return scaled;
}
