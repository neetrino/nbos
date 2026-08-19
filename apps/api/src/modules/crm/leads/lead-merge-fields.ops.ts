import {
  LEAD_MERGE_FIELD_KEYS,
  LEAD_MERGE_MARKETING_FIELD_KEYS,
  defaultLeadMergeStatus,
  isAllowedLeadMergeStatusOverride,
  isEmptyMergeField,
  type LeadMergeFieldChoices,
  type LeadMergeFieldKey,
  type LeadMergeFieldSide,
} from '@nbos/shared';
import { BadRequestException } from '@nestjs/common';
import { LEAD_MERGE_ERROR } from './lead-identity.ops';

export interface LeadMergeFieldSource {
  id: string;
  code: string;
  createdAt: Date;
  name: string | null;
  contactName: string;
  phone: string | null;
  email: string | null;
  assignedTo: string | null;
  notes: string | null;
  source: string | null;
  sourceDetail: string | null;
  sourcePartnerId: string | null;
  sourceContactId: string | null;
  marketingAccountId: string | null;
  marketingActivityId: string | null;
  status: string;
}

export type ResolvedLeadMergeFields = Record<LeadMergeFieldKey, string | null> & {
  status: string;
  notes: string | null;
  firstTouchLeadId: string;
  otherSourceNote: string | null;
};

function fieldValue(lead: LeadMergeFieldSource, key: LeadMergeFieldKey): string | null {
  const value = lead[key];
  if (value == null) return null;
  return value;
}

function pickSide(
  survivor: LeadMergeFieldSource,
  absorbed: LeadMergeFieldSource,
  key: LeadMergeFieldKey,
  side: LeadMergeFieldSide | undefined,
  firstTouch: LeadMergeFieldSource,
): string | null {
  if (side === 'absorbed') return fieldValue(absorbed, key);
  if (side === 'survivor') return fieldValue(survivor, key);
  const survivorVal = fieldValue(survivor, key);
  const absorbedVal = fieldValue(absorbed, key);
  if (isEmptyMergeField(survivorVal) && !isEmptyMergeField(absorbedVal)) return absorbedVal;
  if (
    LEAD_MERGE_MARKETING_FIELD_KEYS.includes(
      key as (typeof LEAD_MERGE_MARKETING_FIELD_KEYS)[number],
    ) &&
    !isEmptyMergeField(survivorVal) &&
    !isEmptyMergeField(absorbedVal)
  ) {
    return fieldValue(firstTouch, key);
  }
  return survivorVal;
}

function describeSource(lead: LeadMergeFieldSource): string {
  const from = lead.source?.trim() || 'unknown';
  const where = lead.sourceDetail?.trim();
  return where ? `${from} / ${where}` : from;
}

export function resolveLeadMergeFields(
  survivor: LeadMergeFieldSource,
  absorbed: LeadMergeFieldSource,
  choices: LeadMergeFieldChoices,
  statusOverride?: string,
): ResolvedLeadMergeFields {
  const firstTouch = survivor.createdAt <= absorbed.createdAt ? survivor : absorbed;
  const later = firstTouch.id === survivor.id ? absorbed : survivor;
  const resolved = {} as Record<LeadMergeFieldKey, string | null>;
  for (const key of LEAD_MERGE_FIELD_KEYS) {
    resolved[key] = pickSide(survivor, absorbed, key, choices[key], firstTouch);
  }

  const status = resolveMergeStatus(survivor.status, absorbed.status, statusOverride);
  const otherSourceNote = buildOtherSourceNote(firstTouch, later);
  const notes = appendMergedNotes(survivor.notes, absorbed.notes, absorbed.code, otherSourceNote);

  return {
    ...resolved,
    status,
    notes,
    firstTouchLeadId: firstTouch.id,
    otherSourceNote,
  };
}

function resolveMergeStatus(
  survivorStatus: string,
  absorbedStatus: string,
  override?: string,
): string {
  if (!override) return defaultLeadMergeStatus(survivorStatus, absorbedStatus);
  if (!isAllowedLeadMergeStatusOverride(override)) {
    throw new BadRequestException({
      statusCode: 400,
      code: LEAD_MERGE_ERROR.INVALID_STATUS,
      message: 'Survivor stage override must be an active Lead stage or On Hold — not SQL or Spam.',
    });
  }
  return override;
}

function buildOtherSourceNote(
  firstTouch: LeadMergeFieldSource,
  later: LeadMergeFieldSource,
): string | null {
  const laterDesc = describeSource(later);
  const firstDesc = describeSource(firstTouch);
  if (laterDesc === firstDesc && later.source === firstTouch.source) return null;
  return `Additional channel from ${later.code} (${later.createdAt.toISOString().slice(0, 10)}): ${laterDesc}. First-touch remains ${firstTouch.code} (${firstDesc}).`;
}

export function appendMergedNotes(
  survivorNotes: string | null,
  absorbedNotes: string | null,
  absorbedCode: string,
  otherSourceNote: string | null,
): string | null {
  const parts: string[] = [];
  if (survivorNotes?.trim()) parts.push(survivorNotes.trim());
  const absorbedBlock = absorbedNotes?.trim()
    ? `--- Merged from ${absorbedCode} ---\n${absorbedNotes.trim()}`
    : `--- Merged from ${absorbedCode} ---`;
  parts.push(absorbedBlock);
  if (otherSourceNote) parts.push(otherSourceNote);
  return parts.join('\n\n');
}
