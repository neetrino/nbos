/** System role ids / slugs for the sales seat (Seller + Seller Assistant). */

export const ROLE_SELLER_ID = 'role-seller' as const;
export const ROLE_SELLER_ASSISTANT_ID = 'role-seller-assistant' as const;

export const SELLER_ROLE_SLUG = 'seller' as const;
export const SELLER_ASSISTANT_ROLE_SLUG = 'seller-assistant' as const;

export const SALES_SEAT_ROLE_SLUGS = [SELLER_ROLE_SLUG, SELLER_ASSISTANT_ROLE_SLUG] as const;

export function isSalesSeatRoleSlug(roleSlug: string | undefined): boolean {
  const normalized = roleSlug?.trim().toLowerCase();
  return Boolean(normalized && (SALES_SEAT_ROLE_SLUGS as readonly string[]).includes(normalized));
}
