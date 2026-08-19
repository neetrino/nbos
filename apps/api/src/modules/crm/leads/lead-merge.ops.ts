import { NotFoundException } from '@nestjs/common';
import type { Prisma, PrismaClient, TransactionClient } from '@nbos/database';
import type { LeadMergeFieldChoices } from '@nbos/shared';
import type { AuditService } from '../../audit/audit.service';
import {
  assertCanMergeLeadPair,
  assertLeadMergeEligible,
  assertLeadMergePair,
} from './lead-merge-guards.ops';
import { resolveLeadMergeFields } from './lead-merge-fields.ops';
import { moveLeadMergeRelations } from './lead-merge-relations.ops';

const MERGE_LEAD_SELECT = {
  id: true,
  code: true,
  name: true,
  contactName: true,
  phone: true,
  email: true,
  assignedTo: true,
  notes: true,
  contactId: true,
  source: true,
  sourceDetail: true,
  sourcePartnerId: true,
  sourceContactId: true,
  marketingAccountId: true,
  marketingActivityId: true,
  status: true,
  createdAt: true,
  trashedAt: true,
  mergedIntoId: true,
  deal: { select: { id: true } },
} as const;

export interface MergeLeadsInput {
  survivorId: string;
  absorbedId: string;
  fieldChoices: LeadMergeFieldChoices;
  status?: string;
  actorId: string;
  actorRoleSlug: string;
}

export interface MergeLeadsResult {
  survivorId: string;
  absorbedId: string;
  firstTouchLeadId: string;
  metaUnlinked: boolean;
  metaReassigned: boolean;
}

/**
 * Merge absorbed into survivor: field picks, first-touch marketing, move channels,
 * then `mergedIntoId` + Profile A Trash. No MERGED stage. No hard delete.
 */
export async function mergeLeads(
  prisma: InstanceType<typeof PrismaClient>,
  audit: AuditService,
  input: MergeLeadsInput,
): Promise<MergeLeadsResult> {
  assertLeadMergePair(input.survivorId, input.absorbedId);

  const result = await prisma.$transaction(async (tx) => {
    const [survivor, absorbed] = await Promise.all([
      loadMergeLead(tx, input.survivorId),
      loadMergeLead(tx, input.absorbedId),
    ]);
    assertLeadMergeEligible(survivor, 'survivor');
    assertLeadMergeEligible(absorbed, 'absorbed');
    assertCanMergeLeadPair({
      roleSlug: input.actorRoleSlug,
      actorId: input.actorId,
      survivor,
      absorbed,
    });

    const resolved = resolveLeadMergeFields(survivor, absorbed, input.fieldChoices, input.status);
    const relations = await moveLeadMergeRelations(tx, {
      survivorId: survivor.id,
      absorbedId: absorbed.id,
      survivorContactId: survivor.contactId,
      absorbedContactId: absorbed.contactId,
    });
    const now = new Date();

    await tx.lead.update({
      where: { id: survivor.id },
      data: {
        name: resolved.name,
        contactName: resolved.contactName ?? '',
        phone: resolved.phone,
        email: resolved.email,
        assignedTo: resolved.assignedTo,
        source: resolved.source as Prisma.LeadUpdateInput['source'],
        sourceDetail: resolved.sourceDetail,
        sourcePartnerId: resolved.sourcePartnerId,
        sourceContactId: resolved.sourceContactId,
        marketingAccountId: resolved.marketingAccountId,
        marketingActivityId: resolved.marketingActivityId,
        status: resolved.status as Prisma.LeadUpdateInput['status'],
        notes: resolved.notes,
      },
    });

    await tx.lead.update({
      where: { id: absorbed.id },
      data: { mergedIntoId: survivor.id, trashedAt: now },
    });

    return {
      survivorId: survivor.id,
      absorbedId: absorbed.id,
      survivorCode: survivor.code,
      absorbedCode: absorbed.code,
      firstTouchLeadId: resolved.firstTouchLeadId,
      otherSourceNote: resolved.otherSourceNote,
      status: resolved.status,
      fieldChoices: input.fieldChoices,
      metaUnlinked: relations.metaUnlinked,
      metaReassigned: relations.metaReassigned,
      atsEventsMoved: relations.atsEventsMoved,
      additionalContactsMoved: relations.additionalContactsMoved,
    };
  });

  await audit.log({
    entityType: 'lead',
    entityId: result.survivorId,
    action: 'lead.merged',
    userId: input.actorId,
    changes: {
      absorbedId: result.absorbedId,
      absorbedCode: result.absorbedCode,
      survivorId: result.survivorId,
      survivorCode: result.survivorCode,
      fieldChoices: result.fieldChoices,
      status: result.status,
      firstTouchLeadId: result.firstTouchLeadId,
      otherSourceNote: result.otherSourceNote,
      metaUnlinked: result.metaUnlinked,
      metaReassigned: result.metaReassigned,
      atsEventsMoved: result.atsEventsMoved,
      additionalContactsMoved: result.additionalContactsMoved,
    },
  });

  return {
    survivorId: result.survivorId,
    absorbedId: result.absorbedId,
    firstTouchLeadId: result.firstTouchLeadId,
    metaUnlinked: result.metaUnlinked,
    metaReassigned: result.metaReassigned,
  };
}

async function loadMergeLead(tx: TransactionClient, id: string) {
  const lead = await tx.lead.findUnique({ where: { id }, select: MERGE_LEAD_SELECT });
  if (!lead) throw new NotFoundException(`Lead ${id} not found`);
  return lead;
}
