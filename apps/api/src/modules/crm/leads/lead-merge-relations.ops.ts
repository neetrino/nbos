import type { TransactionClient } from '@nbos/database';

export interface LeadMergeRelationInput {
  survivorId: string;
  absorbedId: string;
  survivorContactId: string | null;
  absorbedContactId: string | null;
}

export interface LeadMergeRelationResult {
  metaReassigned: boolean;
  metaUnlinked: boolean;
  atsEventsMoved: number;
  additionalContactsMoved: number;
}

/**
 * Always-move relations: ATS events, Meta 1:1 conversation, extra contacts.
 * Empty survivor primary Contact is filled from absorbed; a different absorbed
 * primary becomes an extra contact. Lead has no files/links in runtime.
 */
export async function moveLeadMergeRelations(
  tx: TransactionClient,
  input: LeadMergeRelationInput,
): Promise<LeadMergeRelationResult> {
  const { survivorId, absorbedId } = input;
  const ats = await tx.atsCallEvent.updateMany({
    where: { leadId: absorbedId },
    data: { leadId: survivorId },
  });

  const meta = await reassignMetaConversation(tx, survivorId, absorbedId);
  const additionalContactsMoved =
    (await adoptAbsorbedPrimaryContact(tx, input)) +
    (await moveAdditionalContacts(tx, survivorId, absorbedId));

  return {
    metaReassigned: meta.reassigned,
    metaUnlinked: meta.unlinked,
    atsEventsMoved: ats.count,
    additionalContactsMoved,
  };
}

async function adoptAbsorbedPrimaryContact(
  tx: TransactionClient,
  input: LeadMergeRelationInput,
): Promise<number> {
  const absorbedContactId = input.absorbedContactId;
  if (!absorbedContactId) return 0;

  if (!input.survivorContactId) {
    await tx.lead.update({
      where: { id: input.survivorId },
      data: { contactId: absorbedContactId },
    });
    return 1;
  }
  if (input.survivorContactId === absorbedContactId) return 0;

  const created = await tx.leadAdditionalContact.createMany({
    data: [{ leadId: input.survivorId, contactId: absorbedContactId }],
    skipDuplicates: true,
  });
  return created.count;
}

async function reassignMetaConversation(
  tx: TransactionClient,
  survivorId: string,
  absorbedId: string,
): Promise<{ reassigned: boolean; unlinked: boolean }> {
  const [survivorConv, absorbedConv] = await Promise.all([
    tx.metaConversation.findUnique({ where: { leadId: survivorId }, select: { id: true } }),
    tx.metaConversation.findUnique({ where: { leadId: absorbedId }, select: { id: true } }),
  ]);

  if (!absorbedConv) {
    return { reassigned: false, unlinked: false };
  }
  if (!survivorConv) {
    await tx.metaConversation.update({
      where: { id: absorbedConv.id },
      data: { leadId: survivorId },
    });
    return { reassigned: true, unlinked: false };
  }
  await tx.metaConversation.update({
    where: { id: absorbedConv.id },
    data: { leadId: null },
  });
  return { reassigned: false, unlinked: true };
}

async function moveAdditionalContacts(
  tx: TransactionClient,
  survivorId: string,
  absorbedId: string,
): Promise<number> {
  const [survivorLinks, absorbedLinks] = await Promise.all([
    tx.leadAdditionalContact.findMany({
      where: { leadId: survivorId },
      select: { contactId: true },
    }),
    tx.leadAdditionalContact.findMany({
      where: { leadId: absorbedId },
      select: { contactId: true },
    }),
  ]);
  const existing = new Set(survivorLinks.map((link) => link.contactId));
  const toMove = absorbedLinks.filter((link) => !existing.has(link.contactId));
  if (toMove.length > 0) {
    await tx.leadAdditionalContact.createMany({
      data: toMove.map((link) => ({ leadId: survivorId, contactId: link.contactId })),
    });
  }
  await tx.leadAdditionalContact.deleteMany({ where: { leadId: absorbedId } });
  return toMove.length;
}
