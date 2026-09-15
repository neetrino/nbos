import type { Prisma } from '@nbos/database';
import {
  buildCallAccessWhere,
  buildCallEmployeeWhere,
  CALL_ACCESS_DENIED_WHERE,
  callEmployeeIdsForScope,
} from './call-access.where';
import type { CallRbacScope } from './call-access.types';

export function isDeniedCallWhere(where: Prisma.AtsCallEventWhereInput): boolean {
  const ids = where.id && typeof where.id === 'object' && 'in' in where.id ? where.id.in : null;
  return Array.isArray(ids) && ids.length === 0;
}

export function isUnrestrictedCallWhere(where: Prisma.AtsCallEventWhereInput): boolean {
  return Object.keys(where).length === 0;
}

/**
 * Journal CRM fallback is assignment OWN only. CRM VIEW ALL must not widen CALLS OWN/DEPARTMENT.
 */
export function buildJournalCrmAssignmentWhere(params: {
  leadsScope: CallRbacScope;
  dealsScope: CallRbacScope;
  actorId: string;
}): Prisma.AtsCallEventWhereInput | null {
  const leadsScope = params.leadsScope === 'NONE' ? 'NONE' : 'OWN';
  const dealsScope = params.dealsScope === 'NONE' ? 'NONE' : 'OWN';
  if (leadsScope === 'NONE' && dealsScope === 'NONE') return null;
  return buildCallAccessWhere({
    leadsScope,
    dealsScope,
    actorId: params.actorId,
    departmentEmployeeIds: [],
  });
}

/**
 * Company journal filter. CALLS ALL sees every row. OWN/DEPARTMENT match Call employees.
 * Narrow CRM assignment is OR-ed when the actor also has CRM VIEW.
 */
export function buildCallJournalAccessWhere(params: {
  callsScope: CallRbacScope;
  actorId: string;
  departmentEmployeeIds: string[];
  crmWhere: Prisma.AtsCallEventWhereInput | null;
}): Prisma.AtsCallEventWhereInput {
  if (params.callsScope === 'ALL') return {};

  const ors: Prisma.AtsCallEventWhereInput[] = [];
  const employeeWhere = buildCallEmployeeWhere(
    callEmployeeIdsForScope(params.callsScope, params.actorId, params.departmentEmployeeIds),
  );
  if (employeeWhere) ors.push(employeeWhere);
  if (canOrJournalCrmWhere(params.crmWhere)) ors.push(params.crmWhere);
  return ors.length > 0 ? { OR: ors } : CALL_ACCESS_DENIED_WHERE;
}

function canOrJournalCrmWhere(
  crmWhere: Prisma.AtsCallEventWhereInput | null,
): crmWhere is Prisma.AtsCallEventWhereInput {
  if (!crmWhere) return false;
  return !isDeniedCallWhere(crmWhere) && !isUnrestrictedCallWhere(crmWhere);
}
