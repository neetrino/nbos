import type { UpdateOwnProfilePayload } from '@/lib/api/me';
import type { EmployeeGeneralDraft } from './employee-general-form-state';

const TERMINATED_STATUS = 'TERMINATED';

export function canEditOwnAccountFields(selfProfile: boolean, status: string): boolean {
  return selfProfile && status !== TERMINATED_STATUS;
}

export function canEditHrEmployeeFields(canEditCompany: boolean, status: string): boolean {
  return canEditCompany && status !== TERMINATED_STATUS;
}

function strEq(a: string, b: string): boolean {
  return a.trim() === b.trim();
}

function optionalContact(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Personal fields any employee may change on their own My Account sheet. */
export function buildEmployeeOwnProfilePatch(
  snap: EmployeeGeneralDraft,
  draft: EmployeeGeneralDraft,
): UpdateOwnProfilePayload {
  const out: UpdateOwnProfilePayload = {};
  if (draft.firstName !== snap.firstName) out.firstName = draft.firstName.trim();
  if (draft.lastName !== snap.lastName) out.lastName = draft.lastName.trim();
  if (!strEq(draft.phone, snap.phone)) out.phone = optionalContact(draft.phone);
  if (!strEq(draft.telegram, snap.telegram)) out.telegram = optionalContact(draft.telegram);
  if (!strEq(draft.sipId, snap.sipId)) out.sipId = optionalContact(draft.sipId);
  if (draft.birthday !== snap.birthday) {
    out.birthday = draft.birthday ? new Date(draft.birthday).toISOString() : null;
  }
  return out;
}

export function isEmployeeOwnProfileDirty(
  draft: EmployeeGeneralDraft,
  snap: EmployeeGeneralDraft,
): boolean {
  return Object.keys(buildEmployeeOwnProfilePatch(snap, draft)).length > 0;
}
