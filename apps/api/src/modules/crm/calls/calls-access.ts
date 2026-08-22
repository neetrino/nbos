import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CALL_LIST_FORBIDDEN_MESSAGE } from './calls.constants';

export type CallListParent = 'lead' | 'contact' | 'deal';

export type CallListQueryIds = {
  leadId?: string;
  contactId?: string;
  dealId?: string;
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
  throw new ForbiddenException(CALL_LIST_FORBIDDEN_MESSAGE);
}
