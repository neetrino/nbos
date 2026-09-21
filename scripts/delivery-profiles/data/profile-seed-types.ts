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
  units: ProfileSeedUnits;
  includedFunctionCodes: readonly string[];
  /** Named extra-function kits. A click replaces extras; it does not price the core. */
  presets: {
    BASE: readonly string[];
    EXTENDED: readonly string[];
    FULL: readonly string[];
  };
};

export const SEEDED_COLLECTION_NAMES = {
  BASE: 'Базовый',
  EXTENDED: 'Расширенный',
  FULL: 'Полный',
} as const;

export function collectionsForKind(kind: ProfileSeedKind): ProfileSeedCollection[] {
  return [
    { name: SEEDED_COLLECTION_NAMES.BASE, functionCodes: kind.presets.BASE },
    { name: SEEDED_COLLECTION_NAMES.EXTENDED, functionCodes: kind.presets.EXTENDED },
    { name: SEEDED_COLLECTION_NAMES.FULL, functionCodes: kind.presets.FULL },
  ];
}
