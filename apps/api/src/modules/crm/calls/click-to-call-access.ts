import { ForbiddenException } from '@nestjs/common';
import { CALL_CREATE_PERMISSION } from './click-to-call.constants';
import type { CallListParent } from './calls-access';

export type ClickToCallActor = {
  id: string;
  permissions: Record<string, string | undefined>;
};

export type ClickToCallObjectAccess = {
  parent: CallListParent;
  assignedEmployeeIds: string[];
};

function crmEditScope(
  permissions: Record<string, string | undefined>,
  module: 'CRM_LEADS' | 'CRM_DEALS',
): string | null {
  const scope = permissions[`${module}_EDIT`]?.trim().toUpperCase() ?? '';
  if (!scope || scope === 'NONE') return null;
  return scope;
}

export function resolveCallCreateScope(
  permissions: Record<string, string | undefined>,
  parent: CallListParent,
): string | null {
  if (parent === 'lead') return crmEditScope(permissions, 'CRM_LEADS');
  if (parent === 'deal') return crmEditScope(permissions, 'CRM_DEALS');
  return crmEditScope(permissions, 'CRM_LEADS') ?? crmEditScope(permissions, 'CRM_DEALS');
}

export function hasCallCreatePermission(
  permissions: Record<string, string | undefined>,
  parent: CallListParent,
): boolean {
  return resolveCallCreateScope(permissions, parent) != null;
}

export function assertCanCreateCall(
  actor: ClickToCallActor,
  objectAccess: ClickToCallObjectAccess,
): void {
  const scope = resolveCallCreateScope(actor.permissions, objectAccess.parent);
  if (!scope) {
    throw new ForbiddenException(`No permission: ${CALL_CREATE_PERMISSION}`);
  }
  if (objectAccess.parent === 'contact') return;
  if (scope === 'ALL' || scope === 'DEPARTMENT') return;
  if (objectAccess.assignedEmployeeIds.includes(actor.id)) return;
  throw new ForbiddenException(`No permission: ${CALL_CREATE_PERMISSION}`);
}
