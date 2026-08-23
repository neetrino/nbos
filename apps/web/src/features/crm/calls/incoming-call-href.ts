import {
  CRM_OPEN_DEAL_QUERY,
  CRM_OPEN_LEAD_QUERY,
} from '@/features/crm/constants/crm-list-sheet-url';

export const CLIENTS_OPEN_CONTACT_QUERY = 'openId';

export function incomingCallCrmHref(call: {
  dealId: string | null;
  leadId: string | null;
  contactId: string | null;
}): string | null {
  if (call.dealId) {
    return `/crm/deals?${CRM_OPEN_DEAL_QUERY}=${encodeURIComponent(call.dealId)}`;
  }
  if (call.leadId) {
    return `/crm/leads?${CRM_OPEN_LEAD_QUERY}=${encodeURIComponent(call.leadId)}`;
  }
  if (call.contactId) {
    return `/clients/contacts?${CLIENTS_OPEN_CONTACT_QUERY}=${encodeURIComponent(call.contactId)}`;
  }
  return null;
}
