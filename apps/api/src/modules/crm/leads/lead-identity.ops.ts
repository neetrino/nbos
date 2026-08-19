import type { LeadStatusEnum, Prisma } from '@nbos/database';
import { AUTO_ATTACH_EXCLUDED_LEAD_STATUSES } from '@nbos/shared';
import {
  atsPhoneLookupVariants,
  normalizeAtsCallerPhone,
} from '../../integrations/ats/ats-phone.util';

export const LEAD_MERGE_ERROR = {
  SQL: 'LEAD_MERGE_BLOCKED_SQL',
  DEAL: 'LEAD_MERGE_BLOCKED_DEAL',
  ABSORBED: 'LEAD_MERGE_BLOCKED_ABSORBED',
  TRASH: 'LEAD_MERGE_BLOCKED_TRASH',
  FORBIDDEN: 'LEAD_MERGE_FORBIDDEN',
  INVALID_STATUS: 'LEAD_MERGE_INVALID_STATUS',
  SAME_LEAD: 'LEAD_MERGE_SAME_LEAD',
  RESTORE: 'LEAD_RESTORE_BLOCKED_MERGED',
} as const;

export const LEAD_ATTACH_ERROR = {
  SQL: 'LEAD_ATTACH_BLOCKED_SQL',
  DEAL: 'LEAD_ATTACH_BLOCKED_DEAL',
  ABSORBED: 'LEAD_ATTACH_BLOCKED_ABSORBED',
  TRASH: 'LEAD_ATTACH_BLOCKED_TRASH',
  FORBIDDEN: 'LEAD_ATTACH_FORBIDDEN',
  DEAL_NOT_OPEN: 'LEAD_ATTACH_DEAL_NOT_OPEN',
  DEAL_CONTACT_MISMATCH: 'LEAD_ATTACH_DEAL_CONTACT_MISMATCH',
  CONTACT_MISMATCH: 'LEAD_ATTACH_CONTACT_MISMATCH',
  CONTACT_TRASH: 'LEAD_ATTACH_CONTACT_TRASHED',
} as const;

export type LeadAttachPhoneHandling = 'written' | 'noted' | 'same' | 'none';

const AUTO_ATTACH_EXCLUDED: LeadStatusEnum[] = [...AUTO_ATTACH_EXCLUDED_LEAD_STATUSES];

export function normalizeLeadEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase();
  return trimmed ? trimmed : null;
}

/** Lookup variants using the existing ATS/WhatsApp normalizer — not a third phone scheme. */
export function phoneLookupVariantsFromRaw(raw: string | null | undefined): string[] {
  const trimmed = raw?.trim();
  if (!trimmed) return [];
  const normalized = normalizeAtsCallerPhone(trimmed);
  if (!normalized.success) {
    return [trimmed];
  }
  return atsPhoneLookupVariants(normalized.e164, normalized.digits);
}

export function openLeadAutoAttachWhere(extra: Prisma.LeadWhereInput = {}): Prisma.LeadWhereInput {
  return {
    ...extra,
    trashedAt: null,
    mergedIntoId: null,
    status: extra.status ?? { notIn: AUTO_ATTACH_EXCLUDED },
  };
}

/** Manual banner / merge search: include SPAM, exclude SQL / absorbed / trash. */
export function openLeadBannerWhere(extra: Prisma.LeadWhereInput = {}): Prisma.LeadWhereInput {
  return {
    ...extra,
    trashedAt: null,
    mergedIntoId: null,
    status: extra.status ?? { not: 'SQL' },
  };
}

export function isOpenDealStatus(status: string): boolean {
  return status !== 'WON' && status !== 'FAILED';
}

export function phonesOverlap(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  const rightSet = new Set(phoneLookupVariantsFromRaw(right));
  if (rightSet.size === 0) return false;
  return phoneLookupVariantsFromRaw(left).some((variant) => rightSet.has(variant));
}

export function normalizePhoneForStorage(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const normalized = normalizeAtsCallerPhone(trimmed);
  return normalized.success ? normalized.e164 : trimmed;
}

export function appendNoteLine(existing: string | null | undefined, line: string): string {
  const trimmed = existing?.trim();
  return trimmed ? `${trimmed}\n${line}` : line;
}
