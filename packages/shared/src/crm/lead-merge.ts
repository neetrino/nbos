/** Role slugs that may merge any Lead pair (canon §9 + Owner as CEO-equivalent). */
export const LEAD_MERGE_UNRESTRICTED_ROLE_SLUGS = ['owner', 'ceo', 'head-sales'] as const;

/** Seller may merge only when both Leads are assigned to them. */
export const LEAD_MERGE_SELLER_ROLE_SLUG = 'seller';

export const LEAD_MERGE_BLOCKED_ROLE_SLUGS = ['marketing', 'head-marketing'] as const;

export const LEAD_MERGE_FIELD_KEYS = [
  'name',
  'contactName',
  'phone',
  'email',
  'assignedTo',
  'source',
  'sourceDetail',
  'sourcePartnerId',
  'sourceContactId',
  'marketingAccountId',
  'marketingActivityId',
] as const;

export type LeadMergeFieldKey = (typeof LEAD_MERGE_FIELD_KEYS)[number];

export type LeadMergeFieldSide = 'survivor' | 'absorbed';

export type LeadMergeFieldChoices = Partial<Record<LeadMergeFieldKey, LeadMergeFieldSide>>;

const MARKETING_FIELD_KEYS = [
  'source',
  'sourceDetail',
  'sourcePartnerId',
  'sourceContactId',
  'marketingAccountId',
  'marketingActivityId',
] as const;

export type LeadMergeMarketingFieldKey = (typeof MARKETING_FIELD_KEYS)[number];

export const LEAD_MERGE_MARKETING_FIELD_KEYS: readonly LeadMergeMarketingFieldKey[] =
  MARKETING_FIELD_KEYS;

/** Active pipeline ranks. On Hold / Spam / SQL are not “more advanced”. */
export const LEAD_MERGE_ACTIVE_STAGE_RANK: Readonly<Record<string, number>> = {
  NEW: 1,
  DIDNT_GET_THROUGH: 2,
  CONTACT_ESTABLISHED: 3,
  MQL: 4,
};

export const LEAD_MERGE_ALLOWED_STATUS_OVERRIDES = [
  'NEW',
  'ON_HOLD',
  'DIDNT_GET_THROUGH',
  'CONTACT_ESTABLISHED',
  'MQL',
] as const;

export const AUTO_ATTACH_EXCLUDED_LEAD_STATUSES = ['SQL', 'SPAM'] as const;

export function isLeadMergeUnrestrictedRole(roleSlug: string): boolean {
  return (LEAD_MERGE_UNRESTRICTED_ROLE_SLUGS as readonly string[]).includes(roleSlug);
}

export function isLeadMergeBlockedRole(roleSlug: string): boolean {
  return (LEAD_MERGE_BLOCKED_ROLE_SLUGS as readonly string[]).includes(roleSlug);
}

/**
 * Canon §9: Seller only if both assigned to them; Head of Sales / CEO / Owner any;
 * Marketing never.
 */
export function canMergeLeads(params: {
  roleSlug: string;
  actorId: string;
  survivorAssignedTo: string | null;
  absorbedAssignedTo: string | null;
}): boolean {
  if (isLeadMergeBlockedRole(params.roleSlug)) return false;
  if (isLeadMergeUnrestrictedRole(params.roleSlug)) return true;
  if (params.roleSlug !== LEAD_MERGE_SELLER_ROLE_SLUG) return false;
  return (
    params.survivorAssignedTo === params.actorId && params.absorbedAssignedTo === params.actorId
  );
}

export function canOfferLeadMerge(roleSlug: string | null | undefined): boolean {
  if (!roleSlug) return false;
  if (isLeadMergeBlockedRole(roleSlug)) return false;
  return isLeadMergeUnrestrictedRole(roleSlug) || roleSlug === LEAD_MERGE_SELLER_ROLE_SLUG;
}

export function isEmptyMergeField(value: string | null | undefined): boolean {
  return value == null || value.trim() === '';
}

/**
 * Default survivor stage: more advanced active stage. On Hold is not ahead of an
 * active stage. Spam must not become the default target. Frozen is not in runtime.
 */
export function defaultLeadMergeStatus(survivorStatus: string, absorbedStatus: string): string {
  const survivorSpam = survivorStatus === 'SPAM';
  const absorbedSpam = absorbedStatus === 'SPAM';
  if (survivorSpam && absorbedSpam) return 'NEW';
  if (survivorSpam)
    return absorbedStatus === 'ON_HOLD' ? 'ON_HOLD' : fallbackActive(absorbedStatus);
  if (absorbedSpam)
    return survivorStatus === 'ON_HOLD' ? 'ON_HOLD' : fallbackActive(survivorStatus);

  const survivorRank = LEAD_MERGE_ACTIVE_STAGE_RANK[survivorStatus];
  const absorbedRank = LEAD_MERGE_ACTIVE_STAGE_RANK[absorbedStatus];
  if (survivorRank != null && absorbedRank != null) {
    return absorbedRank > survivorRank ? absorbedStatus : survivorStatus;
  }
  if (survivorRank != null) return survivorStatus;
  if (absorbedRank != null) return absorbedStatus;
  return survivorStatus;
}

function fallbackActive(status: string): string {
  return LEAD_MERGE_ACTIVE_STAGE_RANK[status] != null ? status : 'NEW';
}

export function isAllowedLeadMergeStatusOverride(status: string): boolean {
  return (LEAD_MERGE_ALLOWED_STATUS_OVERRIDES as readonly string[]).includes(status);
}
