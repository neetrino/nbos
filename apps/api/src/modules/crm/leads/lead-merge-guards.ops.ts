import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { canMergeLeads } from '@nbos/shared';
import { LEAD_MERGE_ERROR } from './lead-identity.ops';

export interface LeadMergeGuardRow {
  id: string;
  code: string;
  status: string;
  assignedTo: string | null;
  trashedAt: Date | null;
  mergedIntoId: string | null;
  deal: { id: string } | null;
}

export function assertLeadMergePair(survivorId: string, absorbedId: string): void {
  if (survivorId === absorbedId) {
    throw mergeBlocked(LEAD_MERGE_ERROR.SAME_LEAD, 'Cannot merge a Lead into itself.');
  }
}

export function assertLeadMergeEligible(
  lead: LeadMergeGuardRow,
  label: 'survivor' | 'absorbed',
): void {
  if (lead.trashedAt) {
    throw mergeBlocked(LEAD_MERGE_ERROR.TRASH, `Cannot merge: ${label} is in Trash.`);
  }
  if (lead.mergedIntoId) {
    throw mergeBlocked(LEAD_MERGE_ERROR.ABSORBED, `Cannot merge: ${label} was already absorbed.`);
  }
  if (lead.status === 'SQL') {
    throw mergeBlocked(
      LEAD_MERGE_ERROR.SQL,
      'Cannot merge a Lead that is already SQL / converted. Use the Deal path.',
    );
  }
  if (lead.deal) {
    throw mergeBlocked(
      LEAD_MERGE_ERROR.DEAL,
      'Cannot merge a Lead that already has a Deal. Deal merge is out of scope.',
    );
  }
}

export function assertCanMergeLeadPair(params: {
  roleSlug: string;
  actorId: string;
  survivor: LeadMergeGuardRow;
  absorbed: LeadMergeGuardRow;
}): void {
  if (
    canMergeLeads({
      roleSlug: params.roleSlug,
      actorId: params.actorId,
      survivorAssignedTo: params.survivor.assignedTo,
      absorbedAssignedTo: params.absorbed.assignedTo,
    })
  ) {
    return;
  }
  throw new ForbiddenException({
    statusCode: 403,
    code: LEAD_MERGE_ERROR.FORBIDDEN,
    message:
      'You cannot merge these Leads. Seller may merge only cards assigned to them; Marketing cannot merge.',
  });
}

function mergeBlocked(code: string, message: string): BadRequestException {
  return new BadRequestException({ statusCode: 400, code, message });
}
