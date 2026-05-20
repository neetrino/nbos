import { getLeadStageGateErrors, type LeadStageGateInput } from '@nbos/shared';
import type { Lead } from '@/lib/api/leads';
import type { ApiFieldError } from '@/lib/api-errors';

export function getLocalLeadStageGateErrors(lead: Lead, targetStatus: string): ApiFieldError[] {
  return getLeadStageGateErrors(toLeadStageGateInput(lead), targetStatus);
}

export function toLeadStageGateInput(lead: Lead): LeadStageGateInput {
  return {
    name: lead.name,
    contactName: lead.contactName,
    phone: lead.phone,
    email: lead.email,
    assignedTo: lead.assignedTo,
    notes: lead.notes,
    source: lead.source,
    sourceDetail: lead.sourceDetail,
    sourcePartnerId: lead.sourcePartnerId,
    sourceContactId: lead.sourceContactId,
    marketingAccountId: lead.marketingAccountId,
    marketingActivityId: lead.marketingActivityId,
  };
}
