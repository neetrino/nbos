/**
 * Where a product runs. Separate from `productType` (what it is) and `productCategory`
 * (what we build it with). Values are WEB / APP / DESKTOP — never MOBILE_APP.
 *
 * Not a compensation axis: the same function costs the same units on every platform.
 * Applies only to Code (all three values) and WordPress/Shopify (WEB). Marketing has
 * no platform — store null, do not show the field.
 */

export const PRODUCT_PLATFORMS = ['WEB', 'APP', 'DESKTOP'] as const;

export type ProductPlatform = (typeof PRODUCT_PLATFORMS)[number];

const WEB_ONLY_PRODUCT_CATEGORIES = new Set(['WORDPRESS', 'SHOPIFY']);
const PLATFORM_APPLIES_CATEGORIES = new Set(['CODE', 'WORDPRESS', 'SHOPIFY']);

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

/** Deal taxonomy is optional until SEND_OFFER; no category / no-platform stack means no platform. */
export function coerceOptionalProductPlatform(input: {
  productCategory?: string | null;
  productType?: string | null;
  requested?: string | null;
}): ProductPlatform | null {
  if (!productPlatformApplies(input.productCategory)) return null;
  return coerceProductPlatform(input);
}
