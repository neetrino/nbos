import {
  LEAD_MERGE_FIELD_KEYS,
  LEAD_MERGE_MARKETING_FIELD_KEYS,
  defaultLeadMergeStatus,
  isEmptyMergeField,
  type LeadMergeFieldChoices,
  type LeadMergeFieldKey,
  type LeadMergeFieldSide,
} from '@nbos/shared';
import type { Lead, LeadDuplicateCandidate } from '@/lib/api/leads';
import { getLeadStage } from '../constants/leadPipeline';
import { getLeadDisplayTitle } from '../utils/crm-entity-display';

export const LEAD_MERGE_RECENT_LIMIT = 10;

export type LeadMergeSearchHit = Pick<
  LeadDuplicateCandidate,
  'id' | 'code' | 'name' | 'contactName' | 'phone' | 'email' | 'status' | 'hasOpenDeal'
>;

export const LEAD_MERGE_FIELD_LABELS: Record<LeadMergeFieldKey, string> = {
  name: 'Title',
  contactName: 'Contact name',
  phone: 'Phone',
  email: 'Email',
  assignedTo: 'Assignee',
  source: 'From',
  sourceDetail: 'Where',
  sourcePartnerId: 'Partner',
  sourceContactId: 'Source contact',
  marketingAccountId: 'Marketing account',
  marketingActivityId: 'Marketing activity',
};

export interface LeadMergeConflictRow {
  key: LeadMergeFieldKey;
  label: string;
  survivorValue: string;
  absorbedValue: string;
}

export function displayMergeField(lead: Lead, key: LeadMergeFieldKey): string {
  if (key === 'assignedTo') {
    if (!lead.assignedTo) return '';
    return lead.assignee ? `${lead.assignee.firstName} ${lead.assignee.lastName}` : lead.assignedTo;
  }
  if (key === 'sourcePartnerId') return lead.sourcePartner?.name ?? lead.sourcePartnerId ?? '';
  if (key === 'sourceContactId' && lead.sourceContact) {
    return `${lead.sourceContact.firstName} ${lead.sourceContact.lastName}`;
  }
  if (key === 'marketingAccountId') {
    return lead.marketingAccount?.name ?? lead.marketingAccountId ?? '';
  }
  if (key === 'marketingActivityId') {
    return lead.marketingActivity?.title ?? lead.marketingActivityId ?? '';
  }
  const value = lead[key];
  return value == null ? '' : String(value);
}

export function buildLeadMergeConflicts(survivor: Lead, absorbed: Lead): LeadMergeConflictRow[] {
  const rows: LeadMergeConflictRow[] = [];
  for (const key of LEAD_MERGE_FIELD_KEYS) {
    const survivorValue = displayMergeField(survivor, key);
    const absorbedValue = displayMergeField(absorbed, key);
    if (isEmptyMergeField(survivorValue) || isEmptyMergeField(absorbedValue)) continue;
    if (survivorValue === absorbedValue) continue;
    rows.push({
      key,
      label: LEAD_MERGE_FIELD_LABELS[key],
      survivorValue,
      absorbedValue,
    });
  }
  return rows;
}

export function defaultFieldChoices(
  survivor: Lead,
  absorbed: Lead,
  conflicts: LeadMergeConflictRow[],
): LeadMergeFieldChoices {
  const firstTouch: LeadMergeFieldSide =
    new Date(survivor.createdAt) <= new Date(absorbed.createdAt) ? 'survivor' : 'absorbed';
  const choices: LeadMergeFieldChoices = {};
  for (const row of conflicts) {
    const isMarketing = (LEAD_MERGE_MARKETING_FIELD_KEYS as readonly string[]).includes(row.key);
    choices[row.key] = isMarketing ? firstTouch : 'survivor';
  }
  return choices;
}

export function mergePreviewLines(survivor: Lead, absorbed: Lead, status: string): string[] {
  const stage = getLeadStage(status)?.label ?? status;
  return [
    `Survivor stays ${survivor.code}; ${absorbed.code} moves to Trash with a merge pointer.`,
    `Stage: ${stage} (more advanced by default; On Hold is not ahead of an active stage).`,
    'Notes are appended. ATS calls move. Meta conversation is reassigned or unlinked (1:1).',
    'From/Where is not overwritten silently — first-touch keeps the earlier card; the other channel is noted.',
  ];
}

export function suggestedMergeStatus(survivor: Lead, absorbed: Lead): string {
  return defaultLeadMergeStatus(survivor.status, absorbed.status);
}

/** Primary line for merge search / survivor labels — human title, not code. */
export function getLeadMergeCandidateTitle(
  hit: Pick<LeadMergeSearchHit, 'name' | 'contactName' | 'code'>,
): string {
  const name = hit.name?.trim();
  if (name) return name;
  const contact = hit.contactName?.trim();
  if (contact) return contact;
  return hit.code;
}

/** Secondary line: code (when not the title), contact name, phone/email, blockers. */
export function getLeadMergeCandidateSubtitle(
  hit: Pick<
    LeadMergeSearchHit,
    'name' | 'contactName' | 'code' | 'phone' | 'email' | 'hasOpenDeal'
  >,
): string {
  const title = getLeadMergeCandidateTitle(hit);
  const parts: string[] = [];
  if (hit.code !== title) parts.push(hit.code);
  const contact = hit.contactName?.trim();
  if (contact && contact !== title) parts.push(contact);
  const channel = [hit.phone, hit.email].filter(Boolean).join(' · ');
  if (channel) parts.push(channel);
  if (hit.hasOpenDeal) parts.push('has Deal (cannot merge)');
  return parts.join(' · ');
}

export function getLeadMergeEntityLabel(lead: Lead): string {
  const title = getLeadDisplayTitle(lead);
  if (title !== lead.code) return title;
  const contact = lead.contactName?.trim();
  return contact || lead.code;
}

export function isLeadMergePickBlocked(
  hit: Pick<LeadMergeSearchHit, 'hasOpenDeal' | 'status'>,
): boolean {
  return hit.hasOpenDeal || hit.status === 'SQL';
}

export function leadToMergeSearchHit(lead: Lead): LeadMergeSearchHit {
  const deal = lead.deal;
  const hasOpenDeal = Boolean(deal && deal.status !== 'WON' && deal.status !== 'FAILED');
  return {
    id: lead.id,
    code: lead.code,
    name: lead.name,
    contactName: lead.contactName,
    phone: lead.phone,
    email: lead.email,
    status: lead.status,
    hasOpenDeal,
  };
}

export function filterRecentLeadMergeHits(
  leads: Lead[],
  excludeId: string,
  limit = LEAD_MERGE_RECENT_LIMIT,
): LeadMergeSearchHit[] {
  return leads
    .filter(
      (lead) =>
        lead.id !== excludeId && lead.status !== 'SQL' && !lead.mergedIntoId && !lead.trashedAt,
    )
    .slice(0, limit)
    .map(leadToMergeSearchHit);
}
