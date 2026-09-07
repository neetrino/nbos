import { isSalesSeatRoleSlug, SELLER_ROLE_SLUG } from '@nbos/shared';

export const FINANCE_SELLER_ROLE_SLUG = SELLER_ROLE_SLUG;

export function financeUsesDealScopedParticipation(roleSlug: string | undefined): boolean {
  return isSalesSeatRoleSlug(roleSlug);
}
