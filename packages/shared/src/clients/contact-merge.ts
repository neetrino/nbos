/** CEO / PM / Owner (Owner as CEO-equivalent). No Seller “own contacts” rule in runtime. */
export const CONTACT_MERGE_ALLOWED_ROLE_SLUGS = ['owner', 'ceo', 'pm'] as const;

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

export function isContactMergeAllowedRole(roleSlug: string): boolean {
  return (CONTACT_MERGE_ALLOWED_ROLE_SLUGS as readonly string[]).includes(roleSlug);
}

export function isContactMergeBlockedRole(roleSlug: string): boolean {
  return (CONTACT_MERGE_BLOCKED_ROLE_SLUGS as readonly string[]).includes(roleSlug);
}

/** Canon §7: CEO / PM; Owner treated as CEO. Seller and Marketing cannot merge. */
export function canMergeContacts(roleSlug: string): boolean {
  if (isContactMergeBlockedRole(roleSlug)) return false;
  return isContactMergeAllowedRole(roleSlug);
}

export function canOfferContactMerge(roleSlug: string | null | undefined): boolean {
  if (!roleSlug) return false;
  return canMergeContacts(roleSlug);
}
