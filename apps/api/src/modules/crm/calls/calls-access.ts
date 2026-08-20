import { BadRequestException, ForbiddenException } from '@nestjs/common';

export type CallListParent = 'lead' | 'contact' | 'deal';

export type CallListQueryIds = {
  leadId?: string;
  contactId?: string;
  dealId?: string;
};

export type CallParentRefs = {
  leadId: string | null;
  contactId: string | null;
  dealId: string | null;
};

export function hasCrmModuleView(
  permissions: Record<string, string | undefined>,
  module: 'CRM_LEADS' | 'CRM_DEALS',
): boolean {
  const scope = permissions[`${module}_VIEW`]?.trim().toUpperCase();
  return Boolean(scope && scope !== 'NONE');
}

export function canViewLeadCalls(permissions: Record<string, string | undefined>): boolean {
  return hasCrmModuleView(permissions, 'CRM_LEADS');
}

export function canViewDealCalls(permissions: Record<string, string | undefined>): boolean {
  return hasCrmModuleView(permissions, 'CRM_DEALS');
}

export function canViewContactCalls(permissions: Record<string, string | undefined>): boolean {
  return canViewLeadCalls(permissions) || canViewDealCalls(permissions);
}

export function resolveCallListParent(query: CallListQueryIds): CallListParent {
  const selected = [
    query.leadId ? 'lead' : null,
    query.contactId ? 'contact' : null,
    query.dealId ? 'deal' : null,
  ].filter((value): value is CallListParent => value != null);

  if (selected.length !== 1) {
    throw new BadRequestException('Provide exactly one of leadId, contactId, or dealId');
  }
  const parent = selected[0];
  if (!parent) {
    throw new BadRequestException('Provide exactly one of leadId, contactId, or dealId');
  }
  return parent;
}

export function assertCanListCalls(
  permissions: Record<string, string | undefined>,
  parent: CallListParent,
): void {
  if (parent === 'lead' && canViewLeadCalls(permissions)) return;
  if (parent === 'deal' && canViewDealCalls(permissions)) return;
  if (parent === 'contact' && canViewContactCalls(permissions)) return;
  throw new ForbiddenException('No permission to view these calls');
}

export function assertCanViewCall(
  permissions: Record<string, string | undefined>,
  call: CallParentRefs,
): void {
  if (call.leadId && canViewLeadCalls(permissions)) return;
  if (call.dealId && canViewDealCalls(permissions)) return;
  if (call.contactId && canViewContactCalls(permissions)) return;
  if (!call.leadId && !call.dealId && !call.contactId && canViewContactCalls(permissions)) {
    return;
  }
  throw new ForbiddenException('No permission to view this call');
}
