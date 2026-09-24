/**
 * What the client buys. Separate from platform (WEB / APP / DESKTOP) and from
 * category (Code / WordPress / Shopify / Marketing).
 *
 * `MOBILE_APP` and `SAAS` stay for legacy cards and are hidden from new picks.
 */

const WEB_ONLY = ['WEB'] as const;
const WEB_AND_APP = ['WEB', 'APP'] as const;
const APP_AND_DESKTOP = ['APP', 'DESKTOP'] as const;
const ALL_PLATFORMS = ['WEB', 'APP', 'DESKTOP'] as const;

export const CODE_SITE_PRODUCT_TYPES = [
  'BUSINESS_CARD_WEBSITE',
  'COMPANY_WEBSITE',
  'LANDING',
  'PRODUCT_CATALOG',
  'BLOG',
  'NEWS_MEDIA_PORTAL',
  'EVENT_WEBSITE',
  'REAL_ESTATE_WEBSITE',
  'SERVICE_WEBSITE',
  'TRAVEL_WEBSITE',
  'CLASSIFIEDS_PORTAL',
  'JOB_BOARD',
] as const;

export const CODE_COMMERCE_PRODUCT_TYPES = [
  'ECOMMERCE',
  'MARKETPLACE',
  'B2B_COMMERCE_PORTAL',
  'BOOKING_SYSTEM',
  'TICKETING_SYSTEM',
  'POS',
] as const;

export const CODE_OPERATIONS_PRODUCT_TYPES = [
  'CRM',
  'ERP',
  'HRM',
  'LMS',
  'TASK_MANAGEMENT_SYSTEM',
  'HELP_DESK_SYSTEM',
  'REGISTRATION_SYSTEM',
  'EVENT_MANAGEMENT_SYSTEM',
  'DOCUMENT_MANAGEMENT_SYSTEM',
  'INVENTORY_SYSTEM',
  'KNOWLEDGE_BASE',
  'INDUSTRY_OPERATIONS_SYSTEM',
  'BOS',
] as const;

export const CODE_PORTAL_PRODUCT_TYPES = ['CUSTOMER_PORTAL', 'PARTNER_PORTAL', 'WEB_APP'] as const;

/** Code kinds offered on new Deal / Product picks, in picker order. */
export const OFFERED_CODE_PRODUCT_TYPES = [
  ...CODE_SITE_PRODUCT_TYPES,
  ...CODE_COMMERCE_PRODUCT_TYPES,
  ...CODE_OPERATIONS_PRODUCT_TYPES,
  ...CODE_PORTAL_PRODUCT_TYPES,
] as const;

export type OfferedCodeProductType = (typeof OFFERED_CODE_PRODUCT_TYPES)[number];

export const CODE_KIND_PLATFORMS = {
  BUSINESS_CARD_WEBSITE: WEB_ONLY,
  COMPANY_WEBSITE: WEB_ONLY,
  LANDING: WEB_ONLY,
  PRODUCT_CATALOG: WEB_ONLY,
  BLOG: WEB_ONLY,
  NEWS_MEDIA_PORTAL: WEB_ONLY,
  EVENT_WEBSITE: WEB_ONLY,
  REAL_ESTATE_WEBSITE: WEB_ONLY,
  SERVICE_WEBSITE: WEB_ONLY,
  TRAVEL_WEBSITE: WEB_ONLY,
  CLASSIFIEDS_PORTAL: WEB_ONLY,
  JOB_BOARD: WEB_ONLY,
  ECOMMERCE: WEB_AND_APP,
  MARKETPLACE: WEB_AND_APP,
  B2B_COMMERCE_PORTAL: WEB_AND_APP,
  BOOKING_SYSTEM: ALL_PLATFORMS,
  TICKETING_SYSTEM: WEB_AND_APP,
  POS: APP_AND_DESKTOP,
  CRM: ALL_PLATFORMS,
  ERP: ALL_PLATFORMS,
  HRM: ALL_PLATFORMS,
  LMS: WEB_AND_APP,
  TASK_MANAGEMENT_SYSTEM: ALL_PLATFORMS,
  HELP_DESK_SYSTEM: ALL_PLATFORMS,
  REGISTRATION_SYSTEM: ALL_PLATFORMS,
  EVENT_MANAGEMENT_SYSTEM: ALL_PLATFORMS,
  DOCUMENT_MANAGEMENT_SYSTEM: ALL_PLATFORMS,
  INVENTORY_SYSTEM: ALL_PLATFORMS,
  KNOWLEDGE_BASE: WEB_AND_APP,
  INDUSTRY_OPERATIONS_SYSTEM: ALL_PLATFORMS,
  BOS: ALL_PLATFORMS,
  CUSTOMER_PORTAL: WEB_AND_APP,
  PARTNER_PORTAL: WEB_AND_APP,
  WEB_APP: ALL_PLATFORMS,
} as const satisfies Record<OfferedCodeProductType, readonly string[]>;

export const LEGACY_HIDDEN_PRODUCT_TYPES = ['MOBILE_APP', 'SAAS'] as const;

export const MARKETING_PRODUCT_TYPES = ['LOGO', 'BRANDING', 'DESIGN', 'SEO', 'PPC', 'SMM'] as const;

export const WORDPRESS_PRODUCT_TYPES = [
  'BUSINESS_CARD_WEBSITE',
  'COMPANY_WEBSITE',
  'LANDING',
  'PRODUCT_CATALOG',
  'BLOG',
  'REAL_ESTATE_WEBSITE',
  'SERVICE_WEBSITE',
  'TRAVEL_WEBSITE',
  'ECOMMERCE',
] as const;

export const SHOPIFY_PRODUCT_TYPES = ['ECOMMERCE'] as const;

export const PRODUCT_TYPES = [
  ...OFFERED_CODE_PRODUCT_TYPES,
  ...LEGACY_HIDDEN_PRODUCT_TYPES,
  ...MARKETING_PRODUCT_TYPES,
  'OTHER',
] as const;

export const PRODUCT_TYPES_BY_CATEGORY: Record<string, readonly string[]> = {
  CODE: OFFERED_CODE_PRODUCT_TYPES,
  WORDPRESS: WORDPRESS_PRODUCT_TYPES,
  SHOPIFY: SHOPIFY_PRODUCT_TYPES,
  MARKETING: MARKETING_PRODUCT_TYPES,
  OTHER: [],
} as const;

export function isOfferedCodeProductType(value: string): value is OfferedCodeProductType {
  return (OFFERED_CODE_PRODUCT_TYPES as readonly string[]).includes(value);
}

/** Kinds a new product can select. Legacy hidden kinds stay in the enum only. */
export function productTypesOfferedForNewProduct(): readonly (typeof PRODUCT_TYPES)[number][] {
  const hidden = new Set<string>(LEGACY_HIDDEN_PRODUCT_TYPES);
  return PRODUCT_TYPES.filter((type) => !hidden.has(type));
}

export function isProductTypeOfferedForNewProduct(value: string): boolean {
  return (productTypesOfferedForNewProduct() as readonly string[]).includes(value);
}

export function codeProductTypesForPlatform(platform: string): readonly OfferedCodeProductType[] {
  return OFFERED_CODE_PRODUCT_TYPES.filter((type) =>
    (CODE_KIND_PLATFORMS[type] as readonly string[]).includes(platform),
  );
}
