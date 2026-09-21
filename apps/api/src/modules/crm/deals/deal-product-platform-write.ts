import {
  resolveDealProductPlatform,
  assertProductTypePlatformPair,
} from '../../projects/products/resolve-product-platform';

type DealTaxonomy = {
  productCategory: string | null;
  productType: string | null;
  productPlatform: string | null;
};

type DealTaxonomyPatch = {
  productCategory?: string | null;
  productType?: string | null;
  productPlatform?: string | null;
};

/**
 * Recomputes platform whenever category, type or platform is in the patch, so a WordPress
 * deal cannot keep APP after the category changes and a cleared taxonomy does not leave a
 * stale platform behind.
 */
export function dealProductPlatformWrite(
  patch: DealTaxonomyPatch,
  existing?: DealTaxonomy,
): { productPlatform: ReturnType<typeof resolveDealProductPlatform> } | Record<string, never> {
  if (
    patch.productPlatform === undefined &&
    patch.productCategory === undefined &&
    patch.productType === undefined
  ) {
    return {};
  }
  const productCategory =
    patch.productCategory !== undefined
      ? patch.productCategory
      : (existing?.productCategory ?? null);
  const productType =
    patch.productType !== undefined ? patch.productType : (existing?.productType ?? null);
  const productPlatform = resolveDealProductPlatform({
    productCategory,
    productType,
    requested:
      patch.productPlatform !== undefined
        ? patch.productPlatform
        : (existing?.productPlatform ?? null),
  });
  assertProductTypePlatformPair(
    { productCategory, productType, productPlatform },
    { allowLegacyMobileApp: existing?.productType === 'MOBILE_APP' },
  );
  return { productPlatform };
}
