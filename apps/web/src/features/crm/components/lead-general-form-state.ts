import type { Lead } from '@/lib/api/leads';

/** Editable General tab fields + labels for staged search fields. */
export interface LeadGeneralDraft {
  name: string | null;
  contactName: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  sourceDetail: string | null;
  sourcePartnerId: string | null;
  sourceContactId: string | null;
  marketingAccountId: string | null;
  marketingActivityId: string | null;
  marketingPickLabel: string | null;
  partnerPickLabel: string | null;
  clientPickLabel: string | null;
  notes: string | null;
  assignedTo: string | null;
  sellerDisplayLabel: string | null;
  additionalContactIds: string[];
  additionalContactLabels: Record<string, string>;
}

export type LeadGeneralUpdatePayload = Partial<Lead> & {
  additionalContactIds?: string[];
};

function additionalContactsFromLead(lead: Lead): {
  ids: string[];
  labels: Record<string, string>;
} {
  const labels: Record<string, string> = {};
  const ids: string[] = [];
  for (const row of lead.additionalContacts ?? []) {
    const contact = row.contact;
    ids.push(contact.id);
    labels[contact.id] = `${contact.firstName} ${contact.lastName}`.trim();
  }
  return { ids, labels };
}

function contactIdSetsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((id, index) => id === sortedB[index]);
}

export function createLeadGeneralDraft(lead: Lead): LeadGeneralDraft {
  return {
    name: lead.name,
    contactName: lead.contactName ?? '',
    phone: lead.phone,
    email: lead.email,
    source: lead.source,
    sourceDetail: lead.sourceDetail,
    sourcePartnerId: lead.sourcePartnerId,
    sourceContactId: lead.sourceContactId,
    marketingAccountId: lead.marketingAccountId,
    marketingActivityId: lead.marketingActivityId,
    marketingPickLabel: lead.marketingAccount?.name ?? lead.marketingActivity?.title ?? null,
    partnerPickLabel: lead.sourcePartner?.name ?? null,
    clientPickLabel: lead.sourceContact
      ? `${lead.sourceContact.firstName} ${lead.sourceContact.lastName}`
      : null,
    notes: lead.notes,
    assignedTo: lead.assignedTo,
    sellerDisplayLabel: lead.assignee
      ? `${lead.assignee.firstName} ${lead.assignee.lastName}`
      : null,
    ...(() => {
      const additional = additionalContactsFromLead(lead);
      return {
        additionalContactIds: additional.ids,
        additionalContactLabels: additional.labels,
      };
    })(),
  };
}

function strEq(a: string | null | undefined, b: string | null | undefined): boolean {
  return (a ?? '') === (b ?? '');
}

export function buildLeadGeneralPatch(
  snap: LeadGeneralDraft,
  draft: LeadGeneralDraft,
): LeadGeneralUpdatePayload {
  const out: LeadGeneralUpdatePayload = {};

  if (draft.name !== snap.name) out.name = draft.name;
  if (draft.contactName !== snap.contactName) {
    out.contactName = draft.contactName || '';
  }
  if (!strEq(draft.phone, snap.phone)) out.phone = draft.phone;
  if (!strEq(draft.email, snap.email)) out.email = draft.email;
  if (draft.source !== snap.source) out.source = draft.source;
  if (draft.sourceDetail !== snap.sourceDetail) out.sourceDetail = draft.sourceDetail;
  if (draft.sourcePartnerId !== snap.sourcePartnerId) {
    out.sourcePartnerId = draft.sourcePartnerId;
  }
  if (draft.sourceContactId !== snap.sourceContactId) {
    out.sourceContactId = draft.sourceContactId;
  }
  if (draft.marketingAccountId !== snap.marketingAccountId) {
    out.marketingAccountId = draft.marketingAccountId;
  }
  if (draft.marketingActivityId !== snap.marketingActivityId) {
    out.marketingActivityId = draft.marketingActivityId;
  }
  if (!strEq(draft.notes, snap.notes)) out.notes = draft.notes;
  if (draft.assignedTo !== snap.assignedTo) out.assignedTo = draft.assignedTo;
  if (!contactIdSetsEqual(draft.additionalContactIds, snap.additionalContactIds)) {
    out.additionalContactIds = draft.additionalContactIds;
  }

  return out;
}

export function isLeadGeneralDirty(a: LeadGeneralDraft, b: LeadGeneralDraft): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}
