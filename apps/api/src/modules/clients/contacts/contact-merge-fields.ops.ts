import {
  isEmptyMergeField,
  type ContactMergeFieldChoices,
  type ContactMergeFieldKey,
  type ContactMergeFieldSide,
} from '@nbos/shared';
import type { ContactRole, InputJsonValue } from '@nbos/database';
import { appendNoteLine, normalizePhoneForStorage } from '../../crm/leads/lead-identity.ops';
import { unionExtraPhoneE164 } from './contact-phone.ops';

export interface ContactMergeFieldSource {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  role: string;
  notes: string | null;
  messengerLinks: InputJsonValue | null;
  extraPhones: Array<{ e164: string }>;
}

export interface ResolvedContactMergeFields {
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  role: ContactRole;
  notes: string | null;
  messengerLinks: InputJsonValue | null;
  extraPhoneE164: string[];
}

function fieldValue(contact: ContactMergeFieldSource, key: ContactMergeFieldKey): string | null {
  const value = contact[key];
  return value == null ? null : String(value);
}

function pickSide(
  survivor: ContactMergeFieldSource,
  absorbed: ContactMergeFieldSource,
  key: ContactMergeFieldKey,
  side: ContactMergeFieldSide | undefined,
): string | null {
  if (side === 'absorbed') return fieldValue(absorbed, key);
  if (side === 'survivor') return fieldValue(survivor, key);
  const survivorVal = fieldValue(survivor, key);
  const absorbedVal = fieldValue(absorbed, key);
  if (isEmptyMergeField(survivorVal) && !isEmptyMergeField(absorbedVal)) return absorbedVal;
  return survivorVal;
}

export function resolveContactMergeFields(
  survivor: ContactMergeFieldSource,
  absorbed: ContactMergeFieldSource,
  choices: ContactMergeFieldChoices,
): ResolvedContactMergeFields {
  const picked: Record<ContactMergeFieldKey, string | null> = {
    firstName: pickSide(survivor, absorbed, 'firstName', choices.firstName),
    lastName: pickSide(survivor, absorbed, 'lastName', choices.lastName),
    phone: pickSide(survivor, absorbed, 'phone', choices.phone),
    email: pickSide(survivor, absorbed, 'email', choices.email),
    role: pickSide(survivor, absorbed, 'role', choices.role),
  };
  const primary = normalizePhoneForStorage(picked.phone);
  return {
    firstName: picked.firstName?.trim() || survivor.firstName,
    lastName: picked.lastName?.trim() || survivor.lastName,
    phone: primary,
    email: picked.email?.trim() || null,
    role: (picked.role as ContactRole) || (survivor.role as ContactRole),
    notes: absorbed.notes?.trim()
      ? appendNoteLine(survivor.notes, absorbed.notes.trim())
      : survivor.notes,
    messengerLinks: survivor.messengerLinks ?? absorbed.messengerLinks,
    extraPhoneE164: unionExtraPhoneE164(primary, [
      survivor.phone,
      absorbed.phone,
      ...survivor.extraPhones.map((phone) => phone.e164),
      ...absorbed.extraPhones.map((phone) => phone.e164),
    ]),
  };
}
