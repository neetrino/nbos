import { CONTACT_MERGE_FIELD_KEYS, isEmptyMergeField } from '@nbos/shared';
import type { ContactMergeFieldKey } from '@nbos/shared';
import type { Contact, ContactMergeFieldChoices } from '@/lib/api/clients';
import { getContactRole } from '../constants/clients';

export const CONTACT_MERGE_FIELD_LABELS: Record<ContactMergeFieldKey, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  phone: 'Primary phone',
  email: 'Email',
  role: 'Contact type',
};

export interface ContactMergeConflictRow {
  key: ContactMergeFieldKey;
  label: string;
  survivorValue: string;
  absorbedValue: string;
}

export function contactDisplayName(contact: Pick<Contact, 'firstName' | 'lastName'>): string {
  return `${contact.firstName} ${contact.lastName}`.trim() || 'Contact';
}

/** Canon §7: restore absorbed without un-merge is blocked, same as Lead. */
export function isContactRestoreBlocked(
  contact: Pick<Contact, 'mergedIntoId'> | null | undefined,
): boolean {
  return Boolean(contact?.mergedIntoId);
}

export function displayContactMergeField(contact: Contact, key: ContactMergeFieldKey): string {
  if (key === 'role') return getContactRole(contact.role)?.label ?? contact.role;
  const value = contact[key];
  return value == null ? '' : String(value);
}

export function buildContactMergeConflicts(
  survivor: Contact,
  absorbed: Contact,
): ContactMergeConflictRow[] {
  const rows: ContactMergeConflictRow[] = [];
  for (const key of CONTACT_MERGE_FIELD_KEYS) {
    const survivorValue = displayContactMergeField(survivor, key);
    const absorbedValue = displayContactMergeField(absorbed, key);
    if (isEmptyMergeField(survivorValue) || isEmptyMergeField(absorbedValue)) continue;
    if (survivorValue === absorbedValue) continue;
    rows.push({
      key,
      label: CONTACT_MERGE_FIELD_LABELS[key],
      survivorValue,
      absorbedValue,
    });
  }
  return rows;
}

export function defaultContactFieldChoices(
  conflicts: ContactMergeConflictRow[],
): ContactMergeFieldChoices {
  const choices: ContactMergeFieldChoices = {};
  for (const row of conflicts) choices[row.key] = 'survivor';
  return choices;
}

export function contactMergePreviewLines(survivor: Contact, absorbed: Contact): string[] {
  return [
    `${contactDisplayName(survivor)} stays active; ${contactDisplayName(absorbed)} moves to Trash with a merge pointer.`,
    'Extra phones are unioned (normalized). Primary phone is the value you picked.',
    'Companies, deals, leads, projects, products, and other links move onto the survivor. Deals are not merged with each other.',
    'Notes are appended. Restore of the absorbed card without un-merge is blocked.',
  ];
}
