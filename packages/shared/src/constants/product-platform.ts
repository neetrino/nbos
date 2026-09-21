/**
 * Where a product runs. Separate from `productType` (what it is) and `productCategory`
 * (what we build it with). Values are WEB / APP / DESKTOP — never MOBILE_APP.
 *
 * Not a compensation axis: the same function costs the same units on every platform.
 */

export const PRODUCT_PLATFORMS = ['WEB', 'APP', 'DESKTOP'] as const;

export type ProductPlatform = (typeof PRODUCT_PLATFORMS)[number];

/** Stacks that only produce sites — an app or desktop build is not a valid combo. */
const WEB_ONLY_PRODUCT_CATEGORIES = new Set(['WORDPRESS', 'SHOPIFY', 'MARKETING']);

export function isProductPlatform(value: string): value is ProductPlatform {
  return (PRODUCT_PLATFORMS as readonly string[]).includes(value);
}

export function allowedProductPlatforms(
  productCategory: string | null | undefined,
): readonly ProductPlatform[] {
  if (productCategory && WEB_ONLY_PRODUCT_CATEGORIES.has(productCategory)) {
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

/** Deal taxonomy is optional until SEND_OFFER; no category means no platform. */
export function coerceOptionalProductPlatform(input: {
  productCategory?: string | null;
  productType?: string | null;
  requested?: string | null;
}): ProductPlatform | null {
  if (!input.productCategory) return null;
  return coerceProductPlatform(input);
}
