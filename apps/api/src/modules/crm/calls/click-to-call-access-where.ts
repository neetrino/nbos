import type { Prisma } from '@nbos/database';
import type { CallRbacScope } from './call-access.types';
import { callEmployeeIdsForScope, normalizeCallRbacScope } from './call-access.where';

/** Empty-id predicate shared by Lead / Deal / Contact click-to-call gates. */
export const CLICK_TO_CALL_DENIED_WHERE = { id: { in: [] as string[] } };

const CRM_ACTIVE = { trashedAt: null } as const;

export function crmEditScope(
  permissions: Record<string, string | undefined>,
  module: 'CRM_LEADS' | 'CRM_DEALS',
): CallRbacScope {
  return normalizeCallRbacScope(permissions[`${module}_EDIT`]);
}

/**
 * Object-level Lead filter for click-to-call. DEPARTMENT uses EmployeeDepartment ids,
 * not the scope label. Unassigned leads do not match OWN / DEPARTMENT.
 */
export function buildLeadClickToCallWhere(
  scope: CallRbacScope,
  actorId: string,
  departmentEmployeeIds: string[],
): Prisma.LeadWhereInput {
  if (scope === 'NONE') return CLICK_TO_CALL_DENIED_WHERE;
  if (scope === 'ALL') return {};
  const employeeIds = callEmployeeIdsForScope(scope, actorId, departmentEmployeeIds);
  if (employeeIds.length === 0) return CLICK_TO_CALL_DENIED_WHERE;
  return { assignedTo: { in: employeeIds } };
}

/**
 * Object-level Deal filter. Non-trashed WON / FAILED deals still confer access —
 * same lifecycle as Deal click-to-call (trash only).
 */
export function buildDealClickToCallWhere(
  scope: CallRbacScope,
  actorId: string,
  departmentEmployeeIds: string[],
): Prisma.DealWhereInput {
  if (scope === 'NONE') return CLICK_TO_CALL_DENIED_WHERE;
  if (scope === 'ALL') return {};
  const employeeIds = callEmployeeIdsForScope(scope, actorId, departmentEmployeeIds);
  if (employeeIds.length === 0) return CLICK_TO_CALL_DENIED_WHERE;
  return assignedDealWhere(employeeIds);
}

/**
 * Contact click-to-call predicate. Project membership is not a grant
 * (canon: button on Lead / Contact / Deal only).
 *
 * ALL on either CRM EDIT module allows an active Contact, including unowned.
 * OWN / DEPARTMENT require a live Lead or Deal relation under that module.
 */
export function buildContactClickToCallWhere(params: {
  leadsScope: CallRbacScope;
  dealsScope: CallRbacScope;
  actorId: string;
  departmentEmployeeIds: string[];
}): Prisma.ContactWhereInput {
  if (params.leadsScope === 'NONE' && params.dealsScope === 'NONE') {
    return CLICK_TO_CALL_DENIED_WHERE;
  }
  if (params.leadsScope === 'ALL' || params.dealsScope === 'ALL') return {};
  const ors: Prisma.ContactWhereInput[] = [];
  appendLeadContactGrant(ors, params.leadsScope, params.actorId, params.departmentEmployeeIds);
  appendDealContactGrant(ors, params.dealsScope, params.actorId, params.departmentEmployeeIds);
  return ors.length > 0 ? { OR: ors } : CLICK_TO_CALL_DENIED_WHERE;
}

function assignedDealWhere(employeeIds: string[]): Prisma.DealWhereInput {
  return {
    OR: [{ sellerId: { in: employeeIds } }, { sellerAssistantId: { in: employeeIds } }],
  };
}

function appendLeadContactGrant(
  ors: Prisma.ContactWhereInput[],
  scope: CallRbacScope,
  actorId: string,
  departmentEmployeeIds: string[],
): void {
  if (scope === 'NONE' || scope === 'ALL') return;
  const employeeIds = callEmployeeIdsForScope(scope, actorId, departmentEmployeeIds);
  if (employeeIds.length === 0) return;
  const lead = { ...CRM_ACTIVE, assignedTo: { in: employeeIds } };
  ors.push({ leads: { some: lead } });
  ors.push({ leadAdditionalLinks: { some: { lead } } });
}

function appendDealContactGrant(
  ors: Prisma.ContactWhereInput[],
  scope: CallRbacScope,
  actorId: string,
  departmentEmployeeIds: string[],
): void {
  if (scope === 'NONE' || scope === 'ALL') return;
  const employeeIds = callEmployeeIdsForScope(scope, actorId, departmentEmployeeIds);
  if (employeeIds.length === 0) return;
  const deal = { ...CRM_ACTIVE, ...assignedDealWhere(employeeIds) };
  ors.push({ deals: { some: deal } });
  ors.push({ dealAdditionalLinks: { some: { deal } } });
}
