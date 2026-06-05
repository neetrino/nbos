/** Linked CRM deal id on a product / extension order (when API includes `order.deal`). */
export function getEntityOrderDealId(
  order?: { deal?: { id: string } | null } | null,
): string | null {
  const id = order?.deal?.id?.trim();
  return id || null;
}
