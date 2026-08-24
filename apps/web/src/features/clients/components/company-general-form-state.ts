import { contactIdListsEqual } from '@nbos/shared';
import { contactIdsAndLabelsFromRows } from '@/lib/entity-contact-list';
import type { Company } from '@/lib/api/clients';

/** Editable company sheet fields (tax status is read-only after create; not part of draft). */
export interface CompanyGeneralDraft {
  name: string;
  type: string;
  taxId: string;
  legalName: string;
  legalAddress: string;
  notes: string;
  phone: string;
  email: string;
  country: string;
  contactIds: string[];
  contactLabels: Record<string, string>;
  billingContactId: string;
  billingContactLabel: string;
}

export function createCompanyGeneralDraft(company: Company): CompanyGeneralDraft {
  const { contactIds, contactLabels } = contactIdsAndLabelsFromRows(
    company.contact,
    company.additionalContacts,
  );
  return {
    name: company.name,
    type: company.type,
    taxId: company.taxId ?? '',
    legalName: company.legalName ?? '',
    legalAddress: company.legalAddress ?? '',
    notes: company.notes ?? '',
    phone: company.phone ?? '',
    email: company.email ?? '',
    country: company.country ?? '',
    contactIds,
    contactLabels,
    billingContactId: company.billingContact?.id ?? '',
    billingContactLabel: company.billingContact
      ? `${company.billingContact.firstName} ${company.billingContact.lastName}`.trim()
      : '',
  };
}

function strOrNull(v: string): string | null {
  const t = v.trim();
  return t ? t : null;
}

export function buildCompanyGeneralPatch(
  snap: CompanyGeneralDraft,
  draft: CompanyGeneralDraft,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (draft.name !== snap.name) out.name = draft.name;
  if (draft.type !== snap.type) out.type = draft.type;
  if (strOrNull(draft.taxId) !== strOrNull(snap.taxId)) out.taxId = strOrNull(draft.taxId);
  if (strOrNull(draft.legalName) !== strOrNull(snap.legalName)) {
    out.legalName = strOrNull(draft.legalName);
  }
  if (strOrNull(draft.legalAddress) !== strOrNull(snap.legalAddress)) {
    out.legalAddress = strOrNull(draft.legalAddress);
  }
  if (strOrNull(draft.notes) !== strOrNull(snap.notes)) out.notes = strOrNull(draft.notes);
  if (strOrNull(draft.phone) !== strOrNull(snap.phone)) out.phone = strOrNull(draft.phone);
  if (strOrNull(draft.email) !== strOrNull(snap.email)) out.email = strOrNull(draft.email);
  if (strOrNull(draft.country) !== strOrNull(snap.country)) out.country = strOrNull(draft.country);
  if (!contactIdListsEqual(draft.contactIds, snap.contactIds)) {
    out.contactIds = draft.contactIds;
  }
  const primaryId = draft.contactIds[0] ?? '';
  const billingId =
    draft.billingContactId.trim() && draft.billingContactId !== primaryId
      ? draft.billingContactId
      : null;
  const snapPrimaryId = snap.contactIds[0] ?? '';
  const snapBillingId =
    snap.billingContactId.trim() && snap.billingContactId !== snapPrimaryId
      ? snap.billingContactId
      : null;
  if (billingId !== snapBillingId) out.billingContactId = billingId;
  return out;
}

export function isCompanyGeneralDirty(a: CompanyGeneralDraft, b: CompanyGeneralDraft): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}
