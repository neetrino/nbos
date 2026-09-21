import { productPlatformApplies } from '@nbos/shared';

/**
 * Deal composition lives on a product deal until a Product exists. After Won the operational
 * catalog on the product takes over. The card can render before type/platform; it stays disabled.
 */
export function canShowDealConstructor(deal: {
  type: string | null;
  status?: string | null;
  existingProductId: string | null;
  existingProduct?: { id: string } | null;
  handoff?: { product?: { id: string } | null } | null;
}): boolean {
  if (deal.type !== 'PRODUCT') return false;
  if (deal.status === 'WON') return false;
  if (deal.existingProductId || deal.existingProduct) return false;
  return deal.handoff?.product == null;
}

export function isDealCompositionReady(deal: {
  productType: string | null;
  productCategory: string | null;
  productPlatform: string | null;
}): boolean {
  if (!deal.productType) return false;
  if (!productPlatformApplies(deal.productCategory)) return true;
  return Boolean(deal.productPlatform);
}
