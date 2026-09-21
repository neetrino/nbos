import {
  collectionsForKind,
  type ProfileSeedCollection,
  type ProfileSeedKind,
  type ProfileSeedUnits,
} from './data/profile-seed-types';
import { BUSINESS_CARD_PROFILE } from './data/business-card-profile';
import { COMPANY_SITE_PROFILE } from './data/company-site-profile';
import { CRM_PROFILE } from './data/crm-profile';
import { ERP_PROFILE } from './data/erp-profile';
import { LANDING_PROFILE } from './data/landing-profile';
import { MOBILE_APP_PROFILE } from './data/mobile-app-profile';
import { SAAS_PROFILE } from './data/saas-profile';
import { SHOP_PROFILE } from './data/shop-profile';
import { WEB_APP_PROFILE } from './data/web-app-profile';

export type {
  ProfileSeedCollection,
  ProfileSeedCoreItem,
  ProfileSeedKind,
} from './data/profile-seed-types';
export { collectionsForKind } from './data/profile-seed-types';

/**
 * Виды с ядром в существующем enum. Один вид — одно ядро. OTHER, маркетинг и
 * MOBILE_APP не сеем: Mobile App больше не предлагается как вид.
 */
export const PROFILE_SEED_KINDS: readonly ProfileSeedKind[] = [
  SHOP_PROFILE,
  COMPANY_SITE_PROFILE,
  LANDING_PROFILE,
  BUSINESS_CARD_PROFILE,
  CRM_PROFILE,
  WEB_APP_PROFILE,
  ERP_PROFILE,
  SAAS_PROFILE,
];

export type ProfileSeedVersion = {
  profileKey: string;
  kind: ProfileSeedKind;
  units: ProfileSeedUnits;
};

export const SEED_IMPLEMENTATION_BASE = 'FROM_SCRATCH';
export const SEED_DESIGN_MODE = 'AI_DESIGN';
export const SEED_ENTITY_KIND = 'PRODUCT';

const RETIRED_SIZE_SLUGS = ['small', 'classic', 'large', 'very-large', 'enterprise'] as const;
const RETIRED_UNSIZED_PROFILE_KEYS = [MOBILE_APP_PROFILE.keyStem] as const;

export function buildProfileSeedVersions(
  kinds: readonly ProfileSeedKind[] = PROFILE_SEED_KINDS,
): ProfileSeedVersion[] {
  return kinds.map((kind) => ({
    profileKey: profileKeyFor(kind),
    kind,
    units: kind.units,
  }));
}

export function profileKeyFor(kind: ProfileSeedKind): string {
  return kind.keyStem;
}

export function buildSeededProfileKeys(
  kinds: readonly ProfileSeedKind[] = PROFILE_SEED_KINDS,
): string[] {
  return kinds.map((kind) => profileKeyFor(kind));
}

/** Keys the 2026-09-21 size-axis seed wrote, plus cores no longer offered. */
export function retiredSizedProfileKeys(
  kinds: readonly ProfileSeedKind[] = PROFILE_SEED_KINDS,
): string[] {
  return [
    ...kinds.flatMap((kind) => RETIRED_SIZE_SLUGS.map((slug) => `${kind.keyStem}-${slug}`)),
    ...RETIRED_UNSIZED_PROFILE_KEYS,
  ];
}

export function referencedFunctionCodes(
  kinds: readonly ProfileSeedKind[] = PROFILE_SEED_KINDS,
): string[] {
  const codes = kinds.flatMap((kind) => [
    ...kind.includedFunctionCodes,
    ...collectionsForKind(kind).flatMap((collection) => collection.functionCodes),
  ]);
  return [...new Set(codes)].sort();
}

export function seededCollections(
  kinds: readonly ProfileSeedKind[] = PROFILE_SEED_KINDS,
): Array<{ productType: ProfileSeedKind['productType']; collection: ProfileSeedCollection }> {
  return kinds.flatMap((kind) =>
    collectionsForKind(kind).map((collection) => ({
      productType: kind.productType,
      collection,
    })),
  );
}
