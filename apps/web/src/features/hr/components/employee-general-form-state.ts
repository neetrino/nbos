import type { Employee } from '@/lib/api/employees';

export interface EmployeeGeneralDraft {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  telegram: string;
  position: string;
  level: string;
  notes: string;
  hireDate: string;
  status: string;
  roleId: string;
}

function toDateInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function createEmployeeGeneralDraft(employee: Employee): EmployeeGeneralDraft {
  return {
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone ?? '',
    telegram: employee.telegram ?? '',
    position: employee.position ?? '',
    level: employee.level ?? '',
    notes: employee.notes ?? '',
    hireDate: toDateInput(employee.hireDate),
    status: employee.status,
    roleId: employee.role.id,
  };
}

function strEq(a: string, b: string): boolean {
  return a.trim() === b.trim();
}

export function buildEmployeeGeneralPatch(
  snap: EmployeeGeneralDraft,
  draft: EmployeeGeneralDraft,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (draft.firstName !== snap.firstName) out.firstName = draft.firstName.trim();
  if (draft.lastName !== snap.lastName) out.lastName = draft.lastName.trim();
  if (!strEq(draft.email, snap.email)) out.email = draft.email.trim();
  if (!strEq(draft.phone, snap.phone)) out.phone = draft.phone.trim() || null;
  if (!strEq(draft.telegram, snap.telegram)) out.telegram = draft.telegram.trim() || null;
  if (!strEq(draft.position, snap.position)) out.position = draft.position.trim() || null;
  if (draft.level !== snap.level) out.level = draft.level || null;
  if (!strEq(draft.notes, snap.notes)) out.notes = draft.notes.trim() || null;
  if (draft.hireDate !== snap.hireDate) {
    out.hireDate = draft.hireDate ? new Date(draft.hireDate).toISOString() : null;
  }
  return out;
}

export function employeeRoleChanged(
  snap: EmployeeGeneralDraft,
  draft: EmployeeGeneralDraft,
): boolean {
  return draft.roleId !== snap.roleId;
}

export function employeeStatusChanged(
  snap: EmployeeGeneralDraft,
  draft: EmployeeGeneralDraft,
): boolean {
  return draft.status !== snap.status;
}

export function isEmployeeGeneralDirty(a: EmployeeGeneralDraft, b: EmployeeGeneralDraft): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}
