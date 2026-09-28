import { employeesApi, type Employee } from '@/lib/api/employees';
import { meApi } from '@/lib/api/me';
import {
  buildEmployeeGeneralPatch,
  employeeRoleChanged,
  employeeStatusChanged,
  type EmployeeGeneralDraft,
} from './employee-general-form-state';
import { buildEmployeeOwnProfilePatch } from './employee-own-profile-fields';

/** Statuses the employee card may save. Termination uses the offboarding flow. */
const CARD_EMPLOYEE_STATUSES = new Set(['ACTIVE', 'PROBATION', 'ON_LEAVE']);

function cardStatusToSave(snap: EmployeeGeneralDraft, draft: EmployeeGeneralDraft): string | null {
  if (!employeeStatusChanged(snap, draft)) return null;
  if (!CARD_EMPLOYEE_STATUSES.has(draft.status)) return null;
  return draft.status;
}

export async function persistEmployeeGeneral(input: {
  employeeId: string;
  selfProfile: boolean;
  canEditCompany: boolean;
  snap: EmployeeGeneralDraft;
  draft: EmployeeGeneralDraft;
}): Promise<Employee> {
  if (input.selfProfile && !input.canEditCompany) {
    const patch = buildEmployeeOwnProfilePatch(input.snap, input.draft);
    if (Object.keys(patch).length > 0) {
      await meApi.updateProfile(patch);
    }
    return meApi.getEmployee();
  }

  let updatedId = input.employeeId;
  const patch = buildEmployeeGeneralPatch(input.snap, input.draft);
  if (Object.keys(patch).length > 0) {
    const updated = await employeesApi.update(input.employeeId, patch);
    updatedId = updated.id;
  }
  if (employeeRoleChanged(input.snap, input.draft)) {
    const updated = await employeesApi.changeRole(input.employeeId, input.draft.roleId);
    updatedId = updated.id;
  }
  const nextStatus = cardStatusToSave(input.snap, input.draft);
  if (nextStatus) {
    const updated = await employeesApi.changeStatus(input.employeeId, nextStatus);
    updatedId = updated.id;
  }
  return employeesApi.getById(updatedId);
}
