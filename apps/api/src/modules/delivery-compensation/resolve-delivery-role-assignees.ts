import type { DeliveryCompensationRoleKey } from '@nbos/shared';
import { DELIVERY_COMPENSATION_ROLE_KEYS } from '@nbos/shared';

export type ProductRoleSlots = {
  developerId?: string | null;
  frontendDeveloperId?: string | null;
  pmId?: string | null;
  designerId?: string | null;
  qaLeadId?: string | null;
  technicalSpecialistId?: string | null;
};

export type ExtensionRoleAssignmentRow = {
  roleKey: DeliveryCompensationRoleKey;
  employeeId: string;
};

export function resolveProductRoleAssignees(
  slots: ProductRoleSlots,
): Partial<Record<DeliveryCompensationRoleKey, string>> {
  return omitEmpty({
    BACKEND: slots.developerId,
    FRONTEND: slots.frontendDeveloperId,
    PM: slots.pmId,
    DESIGNER: slots.designerId,
    QA: slots.qaLeadId,
    TECHNICAL_SPECIALIST: slots.technicalSpecialistId,
  });
}

export function resolveExtensionRoleAssignees(
  rows: readonly ExtensionRoleAssignmentRow[],
): Partial<Record<DeliveryCompensationRoleKey, string>> {
  const next: Partial<Record<DeliveryCompensationRoleKey, string>> = {};
  for (const row of rows) {
    if (!DELIVERY_COMPENSATION_ROLE_KEYS.includes(row.roleKey)) {
      continue;
    }
    if (row.employeeId) {
      next[row.roleKey] = row.employeeId;
    }
  }
  return next;
}

function omitEmpty(
  input: Record<DeliveryCompensationRoleKey, string | null | undefined>,
): Partial<Record<DeliveryCompensationRoleKey, string>> {
  const next: Partial<Record<DeliveryCompensationRoleKey, string>> = {};
  for (const role of DELIVERY_COMPENSATION_ROLE_KEYS) {
    const employeeId = input[role];
    if (employeeId) {
      next[role] = employeeId;
    }
  }
  return next;
}
