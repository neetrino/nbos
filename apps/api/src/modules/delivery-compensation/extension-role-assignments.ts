import { BadRequestException } from '@nestjs/common';
import { DELIVERY_COMPENSATION_ROLE_KEYS, type DeliveryCompensationRoleKey } from '@nbos/shared';

export type ExtensionRoleAssignmentInput = {
  roleKey: string;
  /** Null clears the role: nobody is assigned yet. */
  employeeId: string | null;
};

export type ParsedExtensionRoleAssignment = {
  roleKey: DeliveryCompensationRoleKey;
  employeeId: string | null;
};

export type ExtensionRoleAssignmentDto = {
  roleKey: DeliveryCompensationRoleKey;
  employeeId: string | null;
  employeeName: string | null;
};

/** Validates role keys and rejects the same employee twice, which would double one person's share. */
export function parseExtensionRoleAssignments(
  input: readonly ExtensionRoleAssignmentInput[],
): ParsedExtensionRoleAssignment[] {
  if (input.length === 0) {
    throw new BadRequestException('assignments is required');
  }
  const seenRoles = new Set<string>();
  const parsed: ParsedExtensionRoleAssignment[] = [];
  for (const row of input) {
    const roleKey = requireRoleKey(row.roleKey);
    if (seenRoles.has(roleKey)) {
      throw new BadRequestException(`assignments contains duplicate roleKey ${roleKey}`);
    }
    seenRoles.add(roleKey);
    parsed.push({ roleKey, employeeId: normalizeEmployeeId(row.employeeId) });
  }
  return parsed;
}

export function serializeExtensionRoleAssignments(
  rows: ReadonlyArray<{
    roleKey: string;
    employeeId: string;
    employee: { firstName: string; lastName: string } | null;
  }>,
): ExtensionRoleAssignmentDto[] {
  const byRole = new Map(rows.map((row) => [row.roleKey, row]));
  return DELIVERY_COMPENSATION_ROLE_KEYS.map((roleKey) => {
    const row = byRole.get(roleKey);
    if (!row) {
      return { roleKey, employeeId: null, employeeName: null };
    }
    return {
      roleKey,
      employeeId: row.employeeId,
      employeeName: row.employee
        ? `${row.employee.firstName} ${row.employee.lastName}`.trim()
        : null,
    };
  });
}

function requireRoleKey(value: string): DeliveryCompensationRoleKey {
  const roleKey = DELIVERY_COMPENSATION_ROLE_KEYS.find((key) => key === value);
  if (!roleKey) {
    throw new BadRequestException(`roleKey ${value} is invalid`);
  }
  return roleKey;
}

function normalizeEmployeeId(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
