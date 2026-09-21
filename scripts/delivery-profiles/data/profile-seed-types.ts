import type { DeliveryCompensationRoleKey, ProductCategoryKey, ProductTypeKey } from '@nbos/shared';

export type ProfileSeedUnits = Partial<Record<DeliveryCompensationRoleKey, number>>;

export type ProfileSeedCoreItem = {
  label: string;
  note?: string;
};

export type ProfileSeedCollection = {
  name: string;
  functionCodes: readonly string[];
};

export type ProfileSeedKind = {
  keyStem: string;
  productType: ProductTypeKey;
  productCategory: ProductCategoryKey;
  description: string;
  coreItems: readonly ProfileSeedCoreItem[];
  classicUnits: ProfileSeedUnits;
  includedFunctionCodes: readonly string[];
  /**
   * Former size presets, kept as the source for named collections. SMALL and VERY_LARGE are not
   * seeded as kits: three names per kind is enough for a helper.
   */
  presets: {
    CLASSIC: readonly string[];
    LARGE: readonly string[];
    ENTERPRISE: readonly string[];
  };
};

export const SEEDED_COLLECTION_NAMES = {
  CLASSIC: 'Базовый',
  LARGE: 'Расширенный',
  ENTERPRISE: 'Полный',
} as const;

export function collectionsForKind(kind: ProfileSeedKind): ProfileSeedCollection[] {
  return [
    { name: SEEDED_COLLECTION_NAMES.CLASSIC, functionCodes: kind.presets.CLASSIC },
    { name: SEEDED_COLLECTION_NAMES.LARGE, functionCodes: kind.presets.LARGE },
    { name: SEEDED_COLLECTION_NAMES.ENTERPRISE, functionCodes: kind.presets.ENTERPRISE },
  ];
}
