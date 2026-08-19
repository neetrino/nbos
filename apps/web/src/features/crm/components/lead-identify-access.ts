import { canAttachLeadToContact, canOfferLeadAttach } from '@nbos/shared';
import type { Lead } from '@/lib/api/leads';

export function canIdentifyLeadByState(lead: Lead, isTrashView: boolean): boolean {
  if (isTrashView) return false;
  if (lead.status === 'SQL' || lead.deal) return false;
  if (lead.mergedIntoId) return false;
  return true;
}

export interface LeadIdentifyAccessParams {
  lead: Lead;
  isTrashView: boolean;
  roleSlug: string | null | undefined;
  actorId: string | null | undefined;
}

/** Same attach rules as API: role + Seller assignment on this Lead. */
export function canShowLeadIdentifySection(params: LeadIdentifyAccessParams): boolean {
  if (!canIdentifyLeadByState(params.lead, params.isTrashView)) return false;
  if (!canOfferLeadAttach(params.roleSlug)) return false;
  if (!params.roleSlug || !params.actorId) return false;
  return canAttachLeadToContact({
    roleSlug: params.roleSlug,
    actorId: params.actorId,
    assignedTo: params.lead.assignedTo,
  });
}
