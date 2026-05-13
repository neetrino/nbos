import type { Contact } from '@/lib/api/clients';

export interface ContactGeneralDraft {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  role: string;
  preferredChannel: string;
  language: string;
  whatsapp: string;
  telegram: string;
  notes: string;
}

export function createContactGeneralDraft(contact: Contact): ContactGeneralDraft {
  const links = (contact.messengerLinks as Record<string, string> | null) ?? {};
  return {
    firstName: contact.firstName,
    lastName: contact.lastName,
    phone: contact.phone ?? '',
    email: contact.email ?? '',
    role: contact.role,
    preferredChannel: links.preferredChannel ?? '',
    language: links.language ?? '',
    whatsapp: links.whatsapp ?? '',
    telegram: links.telegram ?? '',
    notes: contact.notes ?? '',
  };
}

function strEq(a: string, b: string): boolean {
  return a.trim() === b.trim();
}

function buildMessengerLinks(draft: ContactGeneralDraft): Record<string, string> {
  const out: Record<string, string> = {};
  const wa = draft.whatsapp.trim();
  const tg = draft.telegram.trim();
  if (wa) out.whatsapp = wa;
  if (tg) out.telegram = tg;
  if (draft.preferredChannel.trim()) out.preferredChannel = draft.preferredChannel.trim();
  if (draft.language.trim()) out.language = draft.language.trim();
  return out;
}

export function buildContactGeneralPatch(
  snap: ContactGeneralDraft,
  draft: ContactGeneralDraft,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (draft.firstName !== snap.firstName) out.firstName = draft.firstName;
  if (draft.lastName !== snap.lastName) out.lastName = draft.lastName;
  if (!strEq(draft.phone, snap.phone)) out.phone = draft.phone.trim() || null;
  if (!strEq(draft.email, snap.email)) out.email = draft.email.trim() || null;
  if (draft.role !== snap.role) out.role = draft.role;
  if (!strEq(draft.notes, snap.notes)) out.notes = draft.notes.trim() || null;
  const nextLinks = buildMessengerLinks(draft);
  const prevLinks = buildMessengerLinks(snap);
  if (JSON.stringify(nextLinks) !== JSON.stringify(prevLinks)) {
    out.messengerLinks = nextLinks;
  }
  return out;
}

export function isContactGeneralDirty(a: ContactGeneralDraft, b: ContactGeneralDraft): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}
