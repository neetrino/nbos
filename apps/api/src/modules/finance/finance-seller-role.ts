/** RBAC role slug for sales seat — finance lists use deal participation, not full project graph. */
export const FINANCE_SELLER_ROLE_SLUG = 'seller';

export function financeUsesDealScopedParticipation(roleSlug: string | undefined): boolean {
  return roleSlug?.trim().toLowerCase() === FINANCE_SELLER_ROLE_SLUG;
}
