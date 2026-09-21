/**
 * Where a product runs. Separate from `productType` (what it is) and `productCategory`
 * (what we build it with). Values are WEB / APP / DESKTOP — never MOBILE_APP.
 *
 * Not a compensation axis: the same function costs the same units on every platform.
 * Applies only to Code (all three values) and WordPress/Shopify (WEB). Marketing has
 * no platform — store null, do not show the field.
 *
 * New Code type picks follow the owner matrix: sites only on WEB; systems on WEB / APP /
 * DESKTOP. `MOBILE_APP` stays in the enum for legacy cards and is not offered.
 */

export const PRODUCT_PLATFORMS = ['WEB', 'APP', 'DESKTOP'] as const;

export type ProductPlatform = (typeof PRODUCT_PLATFORMS)[number];

export const PRODUCT_CATEGORIES = ['CODE', 'WORDPRESS', 'SHOPIFY', 'MARKETING', 'OTHER'] as const;

export const PRODUCT_TYPES = [
  'BUSINESS_CARD_WEBSITE',
  'COMPANY_WEBSITE',
  'MOBILE_APP',
  'WEB_APP',
  'CRM',
  'ECOMMERCE',
  'SAAS',
  'LANDING',
  'ERP',
  'LOGO',
  'BRANDING',
  'DESIGN',
  'SEO',
  'PPC',
  'SMM',
  'OTHER',
] as const;

/** Sites are WEB-only. Same list on APP and DESKTOP. */
export const CODE_SITE_PRODUCT_TYPES = [
  'BUSINESS_CARD_WEBSITE',
  'COMPANY_WEBSITE',
  'LANDING',
] as const;

export const CODE_CROSS_PLATFORM_PRODUCT_TYPES = [
  'ECOMMERCE',
  'CRM',
  'ERP',
  'SAAS',
  'WEB_APP',
] as const;

export const CODE_WEB_PRODUCT_TYPES = [
  ...CODE_SITE_PRODUCT_TYPES,
  ...CODE_CROSS_PLATFORM_PRODUCT_TYPES,
] as const;

export const PRODUCT_TYPES_BY_CATEGORY: Record<string, readonly string[]> = {
  CODE: CODE_WEB_PRODUCT_TYPES,
  WORDPRESS: ['BUSINESS_CARD_WEBSITE', 'COMPANY_WEBSITE', 'ECOMMERCE', 'LANDING'],
  SHOPIFY: ['ECOMMERCE'],
  MARKETING: ['LOGO', 'BRANDING', 'DESIGN', 'SEO', 'PPC', 'SMM'],
  OTHER: [],
} as const;

export const PRODUCT_TYPE_PLATFORM_MISMATCH = 'Product type is not available on this platform';

const WEB_ONLY_PRODUCT_CATEGORIES = new Set(['WORDPRESS', 'SHOPIFY']);
const PLATFORM_APPLIES_CATEGORIES = new Set(['CODE', 'WORDPRESS', 'SHOPIFY']);
const HIDDEN_FROM_NEW_PRODUCT_TYPE_PICK = new Set(['MOBILE_APP']);

export function isProductPlatform(value: string): value is ProductPlatform {
  return (PRODUCT_PLATFORMS as readonly string[]).includes(value);
}

/** Platform field exists only for Code, WordPress and Shopify. */
export function productPlatformApplies(productCategory: string | null | undefined): boolean {
  return Boolean(productCategory && PLATFORM_APPLIES_CATEGORIES.has(productCategory));
}

export function allowedProductPlatforms(
  productCategory: string | null | undefined,
): readonly ProductPlatform[] {
  if (!productCategory || !productPlatformApplies(productCategory)) {
    return [];
  }
  if (WEB_ONLY_PRODUCT_CATEGORIES.has(productCategory)) {
    return ['WEB'];
  }
  return PRODUCT_PLATFORMS;
}

/**
 * Legacy `ProductTypeEnum.MOBILE_APP` is a platform pretending to be a kind.
 * New cards should pick a real kind plus platform APP; this default only backfills that mix.
 */
export function defaultProductPlatform(productType: string | null | undefined): ProductPlatform {
  return productType === 'MOBILE_APP' ? 'APP' : 'WEB';
}

export function coerceProductPlatform(input: {
  productCategory?: string | null;
  productType?: string | null;
  requested?: string | null;
}): ProductPlatform {
  const allowed = allowedProductPlatforms(input.productCategory);
  const fallback = allowed.includes(defaultProductPlatform(input.productType))
    ? defaultProductPlatform(input.productType)
    : (allowed[0] ?? 'WEB');
  if (!input.requested || !isProductPlatform(input.requested)) return fallback;
  return allowed.includes(input.requested) ? input.requested : fallback;
}

/** Platform picker is only for Code. WordPress/Shopify write WEB without a field. */
export function productPlatformPickerApplies(productCategory: string | null | undefined): boolean {
  return allowedProductPlatforms(productCategory).length > 1;
}

/** Type waits for an explicit Code platform. Other stacks show type after category. */
export function productTypeFieldReady(input: {
  productCategory: string | null | undefined;
  productPlatform: string | null | undefined;
}): boolean {
  if (!input.productCategory) return false;
  if (input.productCategory === 'CODE') {
    return isProductPlatform(input.productPlatform ?? '');
  }
  return true;
}

/**
 * Deal taxonomy is optional until SEND_OFFER. Code stays empty until the seller picks
 * WEB / APP / DESKTOP. WordPress and Shopify write WEB. Marketing stays null.
 */
export function coerceOptionalProductPlatform(input: {
  productCategory?: string | null;
  productType?: string | null;
  requested?: string | null;
}): ProductPlatform | null {
  if (!productPlatformApplies(input.productCategory)) return null;
  if (input.productCategory && WEB_ONLY_PRODUCT_CATEGORIES.has(input.productCategory)) {
    return 'WEB';
  }
  if (input.requested && isProductPlatform(input.requested)) {
    const allowed = allowedProductPlatforms(input.productCategory);
    return allowed.includes(input.requested) ? input.requested : null;
  }
  if (input.productType === 'MOBILE_APP') return 'APP';
  return null;
}

export function offeredCodeProductTypes(
  productPlatform: string | null | undefined,
): readonly string[] {
  if (productPlatform === 'WEB') return CODE_WEB_PRODUCT_TYPES;
  if (productPlatform === 'APP' || productPlatform === 'DESKTOP') {
    return CODE_CROSS_PLATFORM_PRODUCT_TYPES;
  }
  return [];
}

export function offeredProductTypesForPicker(
  category: string | null | undefined,
  productPlatform?: string | null,
): string[] {
  if (!category) return [];
  if (category === 'CODE') return [...offeredCodeProductTypes(productPlatform)];
  const mapped = PRODUCT_TYPES_BY_CATEGORY[category];
  if (mapped && mapped.length > 0) return [...mapped];
  return PRODUCT_TYPES.filter((type) => !HIDDEN_FROM_NEW_PRODUCT_TYPE_PICK.has(type));
}

/**
 * Types shown when creating/editing. `MOBILE_APP` and an already stored invalid pair stay
 * in the list only while they are the current value.
 */
export function listedProductTypesForPicker(
  category: string | null | undefined,
  currentType?: string | null,
  productPlatform?: string | null,
): string[] {
  const listed = offeredProductTypesForPicker(category, productPlatform);
  if (
    currentType &&
    !listed.includes(currentType) &&
    (PRODUCT_TYPES as readonly string[]).includes(currentType)
  ) {
    listed.push(currentType);
  }
  return listed;
}

export function isProductTypeOfferedForPlatform(input: {
  productCategory?: string | null;
  productType?: string | null;
  productPlatform?: string | null;
}): boolean {
  const { productCategory, productType, productPlatform } = input;
  if (!productCategory || !productType) return false;
  return offeredProductTypesForPicker(productCategory, productPlatform).includes(productType);
}

export function keepProductTypeAfterPlatformChange(
  productCategory: string | null | undefined,
  productType: string | null | undefined,
  productPlatform: string | null | undefined,
): string | null {
  if (!productType) return null;
  if (productCategory === 'CODE' && !isProductPlatform(productPlatform ?? '')) {
    return productType;
  }
  return isProductTypeOfferedForPlatform({
    productCategory,
    productType,
    productPlatform,
  })
    ? productType
    : null;
}

export function isHiddenFromNewProductTypePick(productType: string | null | undefined): boolean {
  return Boolean(productType && HIDDEN_FROM_NEW_PRODUCT_TYPE_PICK.has(productType));
}

export function productTypePlatformPairError(
  input: {
    productCategory?: string | null;
    productType?: string | null;
    productPlatform?: string | null;
  },
  options: { allowLegacyMobileApp?: boolean } = {},
): string | null {
  const category = input.productCategory ?? null;
  const type = input.productType ?? null;
  const platform = input.productPlatform ?? null;
  if (!category || !type) return null;
  if (!productPlatformApplies(category)) {
    return isProductTypeOfferedForPlatform({ productCategory: category, productType: type })
      ? null
      : PRODUCT_TYPE_PLATFORM_MISMATCH;
  }
  if (!platform) return null;
  if (
    isProductTypeOfferedForPlatform({
      productCategory: category,
      productType: type,
      productPlatform: platform,
    })
  ) {
    return null;
  }
  if (options.allowLegacyMobileApp && isLegacyMobileAppPair(category, type, platform)) {
    return null;
  }
  return PRODUCT_TYPE_PLATFORM_MISMATCH;
}

function isLegacyMobileAppPair(
  category: string,
  productType: string,
  productPlatform: string,
): boolean {
  return category === 'CODE' && productType === 'MOBILE_APP' && productPlatform === 'APP';
}
