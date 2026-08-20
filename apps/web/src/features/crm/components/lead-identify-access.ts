import { canAttachLeadToContact, canOfferLeadAttach } from '@nbos/shared';
import type { Lead } from '@/lib/api/leads';

export interface LeadIdentifyAccessParams {
  lead: Lead;
  isTrashView: boolean;
  roleSlug: string | null | undefined;
  actorId: string | null | undefined;
  isPlatformOwner?: boolean;
}

/**
 * Связать stays visible on every pipeline stage, including New and SQL.
 * Hidden in Trash, for Marketing, and for Seller on someone else's Lead.
 * Founder uses `isPlatformOwner`, not slug `owner`.
 */
export function canShowLeadIdentifySection(params: LeadIdentifyAccessParams): boolean {
  if (params.isTrashView) return false;
  const isPlatformOwner = params.isPlatformOwner === true;
  if (!canOfferLeadAttach(params.roleSlug, isPlatformOwner)) return false;
  if (!params.actorId) return false;
  if (isPlatformOwner) return true;
  if (!params.roleSlug) return false;
  return canAttachLeadToContact({
    roleSlug: params.roleSlug,
    actorId: params.actorId,
    assignedTo: params.lead.assignedTo,
    isPlatformOwner,
  });
}
