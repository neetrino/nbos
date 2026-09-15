/** CEO / PM. Founder uses `isPlatformOwner`, not slug `owner`. */
export const CONTACT_MERGE_ALLOWED_ROLE_SLUGS = ['ceo', 'pm'] as const;

export const CONTACT_MERGE_BLOCKED_ROLE_SLUGS = ['marketing', 'head-marketing', 'seller'] as const;

export const CONTACT_MERGE_FIELD_KEYS = [
  'firstName',
  'lastName',
  'phone',
  'email',
  'role',
] as const;

export type ContactMergeFieldKey = (typeof CONTACT_MERGE_FIELD_KEYS)[number];

export type ContactMergeFieldSide = 'survivor' | 'absorbed';

export type ContactMergeFieldChoices = Partial<Record<ContactMergeFieldKey, ContactMergeFieldSide>>;

/** Canon §7: CEO / PM. Founder via identity. Seller and Marketing cannot merge. */
export function canMergeContacts(roleSlug: string, isPlatformOwner = false): boolean {
  if (isPlatformOwner) return true;
  if ((CONTACT_MERGE_BLOCKED_ROLE_SLUGS as readonly string[]).includes(roleSlug)) return false;
  return (CONTACT_MERGE_ALLOWED_ROLE_SLUGS as readonly string[]).includes(roleSlug);
}

export function canOfferContactMerge(
  roleSlug: string | null | undefined,
  isPlatformOwner = false,
): boolean {
  if (isPlatformOwner) return true;
  if (!roleSlug) return false;
  return canMergeContacts(roleSlug);
}
