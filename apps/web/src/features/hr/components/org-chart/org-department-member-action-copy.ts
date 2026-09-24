import type { useTranslations } from 'next-intl';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { DepartmentMember } from '@/lib/api/employees';
import type { OrgSeat } from '@/lib/api/org-seats';
import type { OrgMemberPendingAction } from './OrgDepartmentMemberConfirmDialog';
import {
  applyDepartmentMemberRole,
  removeEmployeeFromDepartment,
  transferEmployeeToDepartment,
} from './org-department-member-actions';

type HrT = ReturnType<typeof useTranslations<'hr'>>;

export async function executeOrgMemberPendingAction(params: {
  pending: OrgMemberPendingAction;
  member: DepartmentMember;
  departmentId: string;
  seats: readonly OrgSeat[];
  transferTargetId: string;
}): Promise<void> {
  const { pending, member, departmentId, seats, transferTargetId } = params;
  if (pending.kind === 'role') {
    await applyDepartmentMemberRole({
      employeeId: member.employeeId,
      departmentId,
      role: pending.role,
      seats,
    });
    return;
  }
  if (pending.kind === 'remove') {
    await removeEmployeeFromDepartment({
      employeeId: member.employeeId,
      departmentId,
      seats,
    });
    return;
  }
  if (!transferTargetId) return;
  await transferEmployeeToDepartment({
    employeeId: member.employeeId,
    fromDepartmentId: departmentId,
    toDepartmentId: transferTargetId,
    seats,
  });
}

export function orgMemberActionSuccessMessage(pending: OrgMemberPendingAction, t: HrT): string {
  if (pending.kind === 'remove') return t('orgChart.memberActions.removeSuccess');
  if (pending.kind === 'transfer') return t('orgChart.memberActions.transferSuccess');
  return t(`orgChart.memberActions.roleSuccess.${pending.role}`);
}

export function orgMemberActionConfirmTitle(
  pending: OrgMemberPendingAction | null,
  t: HrT,
): string {
  if (!pending) return '';
  if (pending.kind === 'remove') return t('orgChart.memberActions.removeConfirmTitle');
  if (pending.kind === 'transfer') return t('orgChart.memberActions.transferConfirmTitle');
  return t(`orgChart.memberActions.roleConfirmTitle.${pending.role}`);
}

export function orgMemberActionConfirmDescription(
  pending: OrgMemberPendingAction | null,
  t: HrT,
  name: string,
  departmentName: string,
): string {
  if (!pending) return '';
  if (pending.kind === 'remove') {
    return t('orgChart.memberActions.removeConfirmBody', { name, department: departmentName });
  }
  if (pending.kind === 'transfer') {
    return t('orgChart.memberActions.transferConfirmBody', { name, department: departmentName });
  }
  return t(`orgChart.memberActions.roleConfirmBody.${pending.role}`, {
    name,
    department: departmentName,
  });
}

export function orgMemberActionErrorMessage(error: unknown, t: HrT): string {
  if (error instanceof Error && error.message === 'LEADERSHIP_SEAT_MISSING') {
    return t('orgChart.memberActions.seatMissing');
  }
  return getApiErrorMessage(error, t('orgChart.memberActions.failed'));
}
