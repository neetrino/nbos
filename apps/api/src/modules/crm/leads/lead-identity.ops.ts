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
