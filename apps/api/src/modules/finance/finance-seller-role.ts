import { isSellerRoleSlug, SELLER_ROLE_SLUG } from '@nbos/shared';

export const FINANCE_SELLER_ROLE_SLUG = SELLER_ROLE_SLUG;

/**
 * Sellers see finance only through the deals they take part in, either as the deal owner
 * or as its assistant. Both cases are the `seller` role; the difference is on the deal.
 */
export function financeUsesDealScopedParticipation(roleSlug: string | undefined): boolean {
  return isSellerRoleSlug(roleSlug);
}
