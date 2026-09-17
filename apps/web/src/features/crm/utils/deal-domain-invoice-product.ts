import type { Deal } from '@/lib/api/deals';

export function resolveDealPresetProduct(deal: Deal): { id: string; label: string } | null {
  if (deal.existingProductId) {
    return {
      id: deal.existingProductId,
      label: deal.existingProduct?.name ?? deal.handoff?.product?.name ?? deal.existingProductId,
    };
  }

  const orderProductIds = [
    ...new Set(
      (deal.orders ?? []).map((order) => order.productId).filter((id): id is string => Boolean(id)),
    ),
  ];
  if (orderProductIds.length !== 1) return null;
  const productId = orderProductIds[0]!;
  const label = deal.handoff?.product?.id === productId ? deal.handoff.product.name : productId;
  return { id: productId, label };
}
