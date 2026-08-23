import { ForbiddenException } from '@nestjs/common';
import type { CallRbacScope } from './call-access.types';
import { CALL_CREATE_PERMISSION } from './click-to-call.constants';
import { crmEditScope } from './click-to-call-access-where';
import type { CallListParent } from './calls-access';

export function resolveCallCreateScope(
  permissions: Record<string, string | undefined>,
  parent: CallListParent,
): CallRbacScope {
  if (parent === 'lead') return crmEditScope(permissions, 'CRM_LEADS');
  if (parent === 'deal') return crmEditScope(permissions, 'CRM_DEALS');
  const leads = crmEditScope(permissions, 'CRM_LEADS');
  return leads !== 'NONE' ? leads : crmEditScope(permissions, 'CRM_DEALS');
}

export function hasCallCreatePermission(
  permissions: Record<string, string | undefined>,
  parent: CallListParent,
): boolean {
  return resolveCallCreateScope(permissions, parent) !== 'NONE';
}

export function assertCallCreatePermission(
  permissions: Record<string, string | undefined>,
  parent: CallListParent,
): void {
  if (hasCallCreatePermission(permissions, parent)) return;
  throw new ForbiddenException(`No permission: ${CALL_CREATE_PERMISSION}`);
}
