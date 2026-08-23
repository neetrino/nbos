import type { Prisma } from '@nbos/database';
import type { CallListParent } from './calls-access';
import type { CallRbacScope } from './call-access.types';

export const CALL_ACCESS_DENIED_WHERE: Prisma.AtsCallEventWhereInput = { id: { in: [] } };

export function normalizeCallRbacScope(raw: string | undefined): CallRbacScope {
  const scope = raw?.trim().toUpperCase();
  if (scope === 'ALL' || scope === 'OWN' || scope === 'DEPARTMENT' || scope === 'NONE') {
    return scope;
  }
  return 'NONE';
}

export function callEmployeeIdsForScope(
  scope: CallRbacScope,
  actorId: string,
  departmentEmployeeIds: string[],
): string[] {
  if (scope === 'OWN') return [actorId];
  if (scope === 'DEPARTMENT') return uniqueIds([actorId, ...departmentEmployeeIds]);
  return [];
}

export function buildCallEmployeeWhere(
  employeeIds: string[],
): Prisma.AtsCallEventWhereInput | null {
  if (employeeIds.length === 0) return null;
  return {
    OR: [
      { responsibleEmployeeId: { in: employeeIds } },
      { initiatedByEmployeeId: { in: employeeIds } },
      { answeredEmployeeId: { in: employeeIds } },
    ],
  };
}

export function buildLeadAssignedCallWhere(employeeIds: string[]): Prisma.AtsCallEventWhereInput {
  return { lead: { assignedTo: { in: employeeIds } } };
}

export function buildDealAssignedCallWhere(employeeIds: string[]): Prisma.AtsCallEventWhereInput {
  return {
    deal: {
      OR: [{ sellerId: { in: employeeIds } }, { sellerAssistantId: { in: employeeIds } }],
    },
  };
}

export function buildCallParentWhere(
  parent: CallListParent,
  ids: { leadId?: string; contactId?: string; dealId?: string },
): Prisma.AtsCallEventWhereInput {
  if (parent === 'lead') return { leadId: ids.leadId };
  if (parent === 'deal') return { dealId: ids.dealId };
  return buildCallContactParentWhere(ids.contactId ?? '');
}

export function mergeCallListWhere(
  parentWhere: Prisma.AtsCallEventWhereInput,
  accessWhere: Prisma.AtsCallEventWhereInput,
): Prisma.AtsCallEventWhereInput {
  return { AND: [parentWhere, accessWhere] };
}

/** Prisma object-level filter for CRM Calls. Shared by list findMany/count and detail gates. */
export function buildCallAccessWhere(params: {
  leadsScope: CallRbacScope;
  dealsScope: CallRbacScope;
  actorId: string;
  departmentEmployeeIds: string[];
}): Prisma.AtsCallEventWhereInput {
  if (params.leadsScope === 'ALL' && params.dealsScope === 'ALL') return {};
  const ors: Prisma.AtsCallEventWhereInput[] = [];
  appendModuleGrant(ors, 'lead', params.leadsScope, params.actorId, params.departmentEmployeeIds);
  appendModuleGrant(ors, 'deal', params.dealsScope, params.actorId, params.departmentEmployeeIds);
  appendContactOnlyGrant(ors, params.leadsScope, params.dealsScope);
  const employeeOr = buildCallEmployeeWhere(
    uniqueIds([
      ...callEmployeeIdsForScope(params.leadsScope, params.actorId, params.departmentEmployeeIds),
      ...callEmployeeIdsForScope(params.dealsScope, params.actorId, params.departmentEmployeeIds),
    ]),
  )?.OR;
  if (Array.isArray(employeeOr)) ors.push(...employeeOr);
  return ors.length > 0 ? { OR: ors } : CALL_ACCESS_DENIED_WHERE;
}

function buildCallContactParentWhere(contactId: string): Prisma.AtsCallEventWhereInput {
  return {
    OR: [
      { contactId },
      { lead: { OR: [{ contactId }, { additionalContacts: { some: { contactId } } }] } },
      { deal: { OR: [{ contactId }, { additionalContacts: { some: { contactId } } }] } },
    ],
  };
}

function appendModuleGrant(
  ors: Prisma.AtsCallEventWhereInput[],
  module: 'lead' | 'deal',
  scope: CallRbacScope,
  actorId: string,
  departmentEmployeeIds: string[],
): void {
  if (scope === 'NONE') return;
  if (scope === 'ALL') {
    ors.push(module === 'lead' ? { leadId: { not: null } } : { dealId: { not: null } });
    return;
  }
  const employeeIds = callEmployeeIdsForScope(scope, actorId, departmentEmployeeIds);
  if (employeeIds.length === 0) return;
  ors.push(
    module === 'lead'
      ? buildLeadAssignedCallWhere(employeeIds)
      : buildDealAssignedCallWhere(employeeIds),
  );
}

function appendContactOnlyGrant(
  ors: Prisma.AtsCallEventWhereInput[],
  leadsScope: CallRbacScope,
  dealsScope: CallRbacScope,
): void {
  if (leadsScope !== 'ALL' && dealsScope !== 'ALL') return;
  ors.push({ AND: [{ leadId: null }, { dealId: null }] });
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}
