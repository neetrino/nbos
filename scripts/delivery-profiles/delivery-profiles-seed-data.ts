import { DELIVERY_CONFIG_SIZES, type DeliveryConfigSize } from '@nbos/shared';
import { COMPANY_SITE_PROFILE } from './data/company-site-profile';
import { CRM_PROFILE } from './data/crm-profile';
import { LANDING_PROFILE } from './data/landing-profile';
import { MOBILE_APP_PROFILE } from './data/mobile-app-profile';
import { SHOP_PROFILE } from './data/shop-profile';
import {
  unitsForSize,
  type ProfileSeedKind,
  type ProfileSeedUnits,
} from './data/profile-seed-types';

export type { ProfileSeedCoreItem, ProfileSeedKind } from './data/profile-seed-types';

/**
 * Первая волна раскладки: магазин, сайт компании, лендинг, CRM и мобильное приложение. Остальные
 * виды получают ядро по мере первых сделок — раскладывать весь список сразу дороже, чем полезнее.
 */
export const PROFILE_SEED_KINDS: readonly ProfileSeedKind[] = [
  SHOP_PROFILE,
  COMPANY_SITE_PROFILE,
  LANDING_PROFILE,
  CRM_PROFILE,
  MOBILE_APP_PROFILE,
];

/**
 * Одна публикуемая норма ядра. Ключ включает размер, потому что публикация архивирует прошлую
 * опубликованную версию того же ключа: общий ключ на пять размеров означал бы, что публикация
 * CLASSIC гасит SMALL.
 */
export type ProfileSeedVersion = {
  profileKey: string;
  kind: ProfileSeedKind;
  configSize: DeliveryConfigSize;
  units: ProfileSeedUnits;
  presetFunctionCodes: readonly string[];
};

/**
 * Комбинация параметров, для которой сеются черновики. Это самая частая продажа, а не весь
 * декартов набор: канон прямо требует публиковать используемые профили, а не все возможные.
 */
export const SEED_IMPLEMENTATION_BASE = 'FROM_SCRATCH';
export const SEED_DESIGN_MODE = 'AI_DESIGN';
export const SEED_ENTITY_KIND = 'PRODUCT';

export function buildProfileSeedVersions(
  kinds: readonly ProfileSeedKind[] = PROFILE_SEED_KINDS,
): ProfileSeedVersion[] {
  return kinds.flatMap((kind) =>
    DELIVERY_CONFIG_SIZES.map((configSize) => ({
      profileKey: profileKeyFor(kind, configSize),
      kind,
      configSize,
      units: unitsForSize(kind.classicUnits, configSize),
      presetFunctionCodes: kind.presets[configSize],
    })),
  );
}

export function profileKeyFor(kind: ProfileSeedKind, configSize: DeliveryConfigSize): string {
  return `${kind.keyStem}-${configSize.toLowerCase().replace(/_/g, '-')}`;
}

/** The keys this seed owns, so a caller can scope a query to them and leave everything else alone. */
export function buildSeededProfileKeys(
  kinds: readonly ProfileSeedKind[] = PROFILE_SEED_KINDS,
): string[] {
  return kinds.flatMap((kind) => DELIVERY_CONFIG_SIZES.map((size) => profileKeyFor(kind, size)));
}

/** Every catalog code a profile references, so the seed can refuse before writing orphans. */
export function referencedFunctionCodes(
  kinds: readonly ProfileSeedKind[] = PROFILE_SEED_KINDS,
): string[] {
  const codes = kinds.flatMap((kind) => [
    ...kind.includedFunctionCodes,
    ...DELIVERY_CONFIG_SIZES.flatMap((size) => kind.presets[size]),
  ]);
  return [...new Set(codes)].sort();
}
