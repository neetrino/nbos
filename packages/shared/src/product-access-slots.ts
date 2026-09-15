/**
 * Delivery "Access & infrastructure" slots: visibility and binding rules by product profile.
 * Slot keys are persisted in `product_access_slot_bindings.slot_key`.
 */

import { credentialTypeForCategory } from './credentials/credential-category-catalog';

export const CREDENTIAL_CATEGORY_CODES = [
  'ADMIN',
  'DOMAIN',
  'HOSTING',
  'SERVICE',
  'APP',
  'MAIL',
  'API_KEY',
  'DATABASE',
  'ENV',
  'SSH',
  'OTHER',
] as const;

export type CredentialCategoryCode = (typeof CREDENTIAL_CATEGORY_CODES)[number];

/** Catch-all slot; bindings requested here may route to a typed slot by credential category. */
export const UNIVERSAL_ACCESS_SLOT_KEY = 'UNIVERSAL';

/** Create from UNIVERSAL writes Service, not legacy Other. */
export const UNIVERSAL_DEFAULT_CATEGORY = 'SERVICE';

/** Domain and Hosting must be linked before Product Done. Admin stays optional. */
export const PRODUCT_DONE_REQUIRED_ACCESS_SLOT_KEYS = ['DOMAIN', 'HOSTING'] as const;

export type ProductDoneRequiredAccessSlotKey =
  (typeof PRODUCT_DONE_REQUIRED_ACCESS_SLOT_KEYS)[number];

export type AccessSlotDefinition = {
  slotKey: string;
  label: string;
  required: boolean;
  kind: 'credential';
  allowedCategories: readonly CredentialCategoryCode[];
  /** Suggested type when creating from this slot (NBOS credential_type). */
  defaultCredentialType?: string;
};

const DOMAIN_SLOT: AccessSlotDefinition = {
  slotKey: 'DOMAIN',
  label: 'Domain account',
  required: true,
  kind: 'credential',
  allowedCategories: ['DOMAIN'],
  defaultCredentialType: 'DOMAIN_REGISTRAR',
};

const HOSTING_SLOT: AccessSlotDefinition = {
  slotKey: 'HOSTING',
  label: 'Hosting account',
  required: true,
  kind: 'credential',
  allowedCategories: ['HOSTING'],
  defaultCredentialType: 'HOSTING_SERVER',
};

const ADMIN_SLOT: AccessSlotDefinition = {
  slotKey: 'ADMIN',
  label: 'Admin / CMS access',
  required: false,
  kind: 'credential',
  allowedCategories: ['ADMIN'],
  defaultCredentialType: 'LOGIN_PASSWORD',
};

const ADMIN_REQUIRED: AccessSlotDefinition = {
  ...ADMIN_SLOT,
  required: true,
};

const MAIL_SLOT: AccessSlotDefinition = {
  slotKey: 'MAIL',
  label: 'Mail account',
  required: false,
  kind: 'credential',
  allowedCategories: ['MAIL'],
  defaultCredentialType: 'MAIL_SMTP',
};

const SERVICE_SLOT: AccessSlotDefinition = {
  slotKey: 'SERVICE',
  label: 'Service account',
  required: false,
  kind: 'credential',
  allowedCategories: ['SERVICE'],
  defaultCredentialType: 'LOGIN_PASSWORD',
};

const API_SLOT: AccessSlotDefinition = {
  slotKey: 'API_INTEGRATION',
  label: 'API / integration',
  required: false,
  kind: 'credential',
  allowedCategories: ['API_KEY', 'SERVICE'],
  defaultCredentialType: 'API_KEY',
};

const APP_STORE_SLOT: AccessSlotDefinition = {
  slotKey: 'APP_STORE',
  label: 'App store account',
  required: true,
  kind: 'credential',
  allowedCategories: ['APP'],
  defaultCredentialType: 'APP_STORE_ACCOUNT',
};

const DATABASE_SLOT: AccessSlotDefinition = {
  slotKey: 'DATABASE',
  label: 'Database access',
  required: false,
  kind: 'credential',
  allowedCategories: ['DATABASE'],
  defaultCredentialType: 'DATABASE',
};

const UNIVERSAL_SLOT: AccessSlotDefinition = {
  slotKey: UNIVERSAL_ACCESS_SLOT_KEY,
  label: 'Other / not listed',
  required: false,
  kind: 'credential',
  allowedCategories: [...CREDENTIAL_CATEGORY_CODES],
  defaultCredentialType: 'LOGIN_PASSWORD',
};

function slotsForCategory(category: string): AccessSlotDefinition[] {
  switch (category) {
    case 'CODE':
      return [DOMAIN_SLOT, HOSTING_SLOT, ADMIN_SLOT, API_SLOT, SERVICE_SLOT];
    case 'WORDPRESS':
      return [DOMAIN_SLOT, HOSTING_SLOT, ADMIN_REQUIRED, MAIL_SLOT, SERVICE_SLOT];
    case 'SHOPIFY':
      return [DOMAIN_SLOT, HOSTING_SLOT, ADMIN_REQUIRED, SERVICE_SLOT];
    case 'MARKETING':
      return [MAIL_SLOT, SERVICE_SLOT, ADMIN_SLOT];
    case 'OTHER':
      return [DOMAIN_SLOT, HOSTING_SLOT, SERVICE_SLOT, ADMIN_SLOT];
    default:
      return [];
  }
}

/**
 * Typed slots only (no UNIVERSAL). Order matches {@link getAccessSlotsForProduct} before the universal row.
 */
export function getTypedAccessSlotsForProduct(
  productCategory: string,
  productType: string,
): AccessSlotDefinition[] {
  const base = slotsForCategory(productCategory);
  if (base.length === 0) {
    return [];
  }
  if (productType === 'MOBILE_APP') {
    const extra: AccessSlotDefinition[] = [APP_STORE_SLOT];
    if (!base.some((s) => s.slotKey === DATABASE_SLOT.slotKey)) {
      extra.push(DATABASE_SLOT);
    }
    const keys = new Set(base.map((s) => s.slotKey));
    return [...base, ...extra.filter((s) => !keys.has(s.slotKey))];
  }
  return base;
}

/**
 * Returns ordered access slot definitions for a product profile.
 * Appends {@link UNIVERSAL_ACCESS_SLOT_KEY} after typed slots when the profile has any typed slots.
 */
export function getAccessSlotsForProduct(
  productCategory: string,
  productType: string,
): AccessSlotDefinition[] {
  const typed = getTypedAccessSlotsForProduct(productCategory, productType);
  if (typed.length === 0) {
    return [];
  }
  return [...typed, UNIVERSAL_SLOT];
}

/**
 * When the user binds via UNIVERSAL, pick the first typed slot (profile order) that allows the credential category.
 * If none match, keep UNIVERSAL.
 */
export function resolveEffectiveAccessSlotKey(
  productCategory: string,
  productType: string,
  requestedSlotKey: string,
  credentialCategory: string,
): string {
  if (requestedSlotKey !== UNIVERSAL_ACCESS_SLOT_KEY) {
    return requestedSlotKey;
  }
  const typed = getTypedAccessSlotsForProduct(productCategory, productType);
  for (const def of typed) {
    if (isCategoryAllowedForSlot(def, credentialCategory)) {
      return def.slotKey;
    }
  }
  return UNIVERSAL_ACCESS_SLOT_KEY;
}

export function findAccessSlotDefinition(
  productCategory: string,
  productType: string,
  slotKey: string,
): AccessSlotDefinition | undefined {
  return getAccessSlotsForProduct(productCategory, productType).find((s) => s.slotKey === slotKey);
}

export function isCategoryAllowedForSlot(
  slot: AccessSlotDefinition,
  category: string,
): category is CredentialCategoryCode {
  return (slot.allowedCategories as readonly string[]).includes(category);
}

export function isProductDoneRequiredAccessSlot(
  slotKey: string,
): slotKey is ProductDoneRequiredAccessSlotKey {
  return (PRODUCT_DONE_REQUIRED_ACCESS_SLOT_KEYS as readonly string[]).includes(slotKey);
}

/** Shared infra (`projectId` null) may bind across projects; client rows stay same-project. */
export function isCredentialBindableToProductProject(
  credentialProjectId: string | null | undefined,
  productProjectId: string,
): boolean {
  if (!credentialProjectId) return true;
  return credentialProjectId === productProjectId;
}

/** Fill empty `productId` only for project-scoped rows. Shared infra stays unowned. */
export function shouldWriteCredentialProductIdOnBind(input: {
  credentialProjectId: string | null | undefined;
  credentialProductId: string | null | undefined;
}): boolean {
  if (!input.credentialProjectId) return false;
  return !input.credentialProductId;
}

/**
 * Required Done slots that exist on this profile and have no binding yet.
 */
export function getMissingRequiredAccessSlotsForDone(input: {
  productCategory: string;
  productType: string;
  boundSlotKeys: readonly string[];
}): string[] {
  const profileKeys = new Set(
    getAccessSlotsForProduct(input.productCategory, input.productType).map((slot) => slot.slotKey),
  );
  const bound = new Set(input.boundSlotKeys);
  return PRODUCT_DONE_REQUIRED_ACCESS_SLOT_KEYS.filter(
    (slotKey) => profileKeys.has(slotKey) && !bound.has(slotKey),
  );
}

/** Preset Category when creating from a Delivery slot. Field stays editable if allowed > 1. */
export function resolveSlotCreateCategory(slot: {
  slotKey: string;
  allowedCategories: readonly string[];
  defaultCredentialType?: string | null;
}): string {
  if (slot.slotKey === UNIVERSAL_ACCESS_SLOT_KEY) return UNIVERSAL_DEFAULT_CATEGORY;
  const allowed = slot.allowedCategories.filter((value) => value !== 'OTHER');
  const defaultType = slot.defaultCredentialType;
  if (defaultType) {
    const match = allowed.find((category) => credentialTypeForCategory(category) === defaultType);
    if (match) return match;
  }
  return allowed[0] ?? '';
}
