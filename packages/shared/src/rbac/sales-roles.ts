/**
 * System role id / slug for the sales seat.
 *
 * Assistant participation is not a permission role. Two sellers can work one deal, one as
 * the owner and one as the assistant, so the distinction is per deal and lives on
 * `Deal.sellerAssistantId`. Both people hold the `seller` role.
 */

export const ROLE_SELLER_ID = 'role-seller' as const;

export const SELLER_ROLE_SLUG = 'seller' as const;

export function isSellerRoleSlug(roleSlug: string | undefined): boolean {
  return roleSlug?.trim().toLowerCase() === SELLER_ROLE_SLUG;
}
