import type { Company } from '@/lib/api/clients';

/** Editable company sheet fields (tax status is read-only after create; not part of draft). */
export interface CompanyGeneralDraft {
  name: string;
  type: string;
  taxId: string;
  legalAddress: string;
  notes: string;
  phone: string;
  email: string;
  country: string;
  primaryContactId: string;
  primaryContactLabel: string;
  billingContactId: string;
  billingContactLabel: string;
}

export function createCompanyGeneralDraft(company: Company): CompanyGeneralDraft {
  return {
    name: company.name,
    type: company.type,
    taxId: company.taxId ?? '',
    legalAddress: company.legalAddress ?? '',
    notes: company.notes ?? '',
    phone: company.phone ?? '',
    email: company.email ?? '',
    country: company.country ?? '',
    primaryContactId: company.contact.id,
    primaryContactLabel: `${company.contact.firstName} ${company.contact.lastName}`.trim(),
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
  if (strOrNull(draft.legalAddress) !== strOrNull(snap.legalAddress)) {
    out.legalAddress = strOrNull(draft.legalAddress);
  }
  if (strOrNull(draft.notes) !== strOrNull(snap.notes)) out.notes = strOrNull(draft.notes);
  if (strOrNull(draft.phone) !== strOrNull(snap.phone)) out.phone = strOrNull(draft.phone);
  if (strOrNull(draft.email) !== strOrNull(snap.email)) out.email = strOrNull(draft.email);
  if (strOrNull(draft.country) !== strOrNull(snap.country)) out.country = strOrNull(draft.country);
  if (draft.primaryContactId !== snap.primaryContactId) {
    out.contactId = draft.primaryContactId;
  }
  const billingId =
    draft.billingContactId.trim() && draft.billingContactId !== draft.primaryContactId
      ? draft.billingContactId
      : null;
  const snapBillingId =
    snap.billingContactId.trim() && snap.billingContactId !== snap.primaryContactId
      ? snap.billingContactId
      : null;
  if (billingId !== snapBillingId) out.billingContactId = billingId;
  return out;
}

export function isCompanyGeneralDirty(a: CompanyGeneralDraft, b: CompanyGeneralDraft): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}
