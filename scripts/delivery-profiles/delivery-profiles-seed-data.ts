import {
  collectionsForKind,
  type ProfileSeedCollection,
  type ProfileSeedKind,
  type ProfileSeedUnits,
} from './data/profile-seed-types';
import { BUSINESS_CARD_PROFILE } from './data/business-card-profile';
import {
  BLOG_PROFILE,
  EVENT_WEBSITE_PROFILE,
  NEWS_MEDIA_PROFILE,
  PRODUCT_CATALOG_PROFILE,
} from './data/site-kind-profiles';
import {
  B2B_COMMERCE_PROFILE,
  BOOKING_PROFILE,
  MARKETPLACE_PROFILE,
  POS_PROFILE,
  TICKETING_PROFILE,
} from './data/commerce-kind-profiles';
import { COMPANY_SITE_PROFILE } from './data/company-site-profile';
import { CRM_PROFILE } from './data/crm-profile';
import { ERP_PROFILE } from './data/erp-profile';
import { LANDING_PROFILE } from './data/landing-profile';
import { MOBILE_APP_PROFILE } from './data/mobile-app-profile';
import {
  HELP_DESK_PROFILE,
  HRM_PROFILE,
  LMS_PROFILE,
  TASK_MANAGEMENT_PROFILE,
} from './data/ops-people-kind-profiles';
import {
  DOCUMENT_MANAGEMENT_PROFILE,
  EVENT_MANAGEMENT_PROFILE,
  INVENTORY_PROFILE,
  REGISTRATION_PROFILE,
} from './data/ops-flow-kind-profiles';
import {
  BOS_PROFILE,
  INDUSTRY_OPS_PROFILE,
  KNOWLEDGE_BASE_PROFILE,
} from './data/ops-platform-kind-profiles';
import { CUSTOMER_PORTAL_PROFILE, PARTNER_PORTAL_PROFILE } from './data/portal-kind-profiles';
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
 * Один вид — одно ядро. OTHER, маркетинг, MOBILE_APP и SAAS не сеем:
 * платформа и подписка — не виды.
 */
export const PROFILE_SEED_KINDS: readonly ProfileSeedKind[] = [
  BUSINESS_CARD_PROFILE,
  COMPANY_SITE_PROFILE,
  LANDING_PROFILE,
  PRODUCT_CATALOG_PROFILE,
  BLOG_PROFILE,
  NEWS_MEDIA_PROFILE,
  EVENT_WEBSITE_PROFILE,
  SHOP_PROFILE,
  MARKETPLACE_PROFILE,
  B2B_COMMERCE_PROFILE,
  BOOKING_PROFILE,
  TICKETING_PROFILE,
  POS_PROFILE,
  CRM_PROFILE,
  ERP_PROFILE,
  HRM_PROFILE,
  LMS_PROFILE,
  TASK_MANAGEMENT_PROFILE,
  HELP_DESK_PROFILE,
  REGISTRATION_PROFILE,
  EVENT_MANAGEMENT_PROFILE,
  DOCUMENT_MANAGEMENT_PROFILE,
  INVENTORY_PROFILE,
  KNOWLEDGE_BASE_PROFILE,
  INDUSTRY_OPS_PROFILE,
  BOS_PROFILE,
  CUSTOMER_PORTAL_PROFILE,
  PARTNER_PORTAL_PROFILE,
  WEB_APP_PROFILE,
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
const RETIRED_KIND_STEMS = [MOBILE_APP_PROFILE.keyStem, SAAS_PROFILE.keyStem] as const;
const RETIRED_UNSIZED_PROFILE_KEYS = RETIRED_KIND_STEMS;

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
    ...RETIRED_KIND_STEMS.flatMap((stem) => RETIRED_SIZE_SLUGS.map((slug) => `${stem}-${slug}`)),
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
