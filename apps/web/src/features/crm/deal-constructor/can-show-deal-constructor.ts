/**
 * Deal constructor lives on a product deal until a Product exists. After Won the operational
 * catalog on the product takes over.
 */
export function canShowDealConstructor(deal: {
  type: string | null;
  status?: string | null;
  productType: string | null;
  existingProductId: string | null;
  existingProduct?: { id: string } | null;
  handoff?: { product?: { id: string } | null } | null;
}): boolean {
  if (deal.type !== 'PRODUCT') return false;
  if (deal.status === 'WON') return false;
  if (!deal.productType) return false;
  if (deal.existingProductId || deal.existingProduct) return false;
  return deal.handoff?.product == null;
}
