import { responsibleEmployeeLabel } from '../responsible-employee';
import type { ResponsibleEmployee } from '@/lib/api/clients';

export interface ResponsibleEmployeeDraftFields {
  responsibleEmployeeId: string;
  responsibleDisplayLabel: string;
  responsibleAvatar: string | null;
}

export function createResponsibleEmployeeDraft(
  employee: ResponsibleEmployee | null | undefined,
  employeeId?: string | null,
): ResponsibleEmployeeDraftFields {
  return {
    responsibleEmployeeId: employee?.id ?? employeeId ?? '',
    responsibleDisplayLabel: responsibleEmployeeLabel(employee),
    responsibleAvatar: employee?.avatar ?? null,
  };
}

export function responsibleEmployeePatch(
  snap: ResponsibleEmployeeDraftFields,
  draft: ResponsibleEmployeeDraftFields,
): { responsibleEmployeeId: string | null } | Record<string, never> {
  if (draft.responsibleEmployeeId === snap.responsibleEmployeeId) return {};
  return { responsibleEmployeeId: draft.responsibleEmployeeId.trim() || null };
}
