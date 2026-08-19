import { NotFoundException } from '@nestjs/common';
import type { TransactionClient } from '@nbos/database';
import { isOpenDealStatus, LEAD_SVYAZAT_ERROR } from './lead-identity.ops';
import { svyazatBlocked } from './lead-svyazat-shared.ops';
import type { LeadCreateContactAttachType } from './dto/create-lead-contact.dto';

export type ContactAttachRole = 'primary' | 'additional' | 'already';

export interface AddContactToWorkResult {
  role: ContactAttachRole;
  cascadedProjectId: string | null;
  dealLeadId: string | null;
}

export async function addContactToWorkTarget(
  tx: TransactionClient,
  kind: LeadCreateContactAttachType,
  targetId: string,
  contactId: string,
  sourceLeadId: string,
): Promise<AddContactToWorkResult> {
  if (kind === 'deal') return addContactToDeal(tx, targetId, contactId);
  if (kind === 'project') {
    const role = await addContactToProject(tx, targetId, contactId);
    return { role, cascadedProjectId: null, dealLeadId: null };
  }
  return addContactToLead(tx, targetId, contactId, sourceLeadId);
}

async function addContactToDeal(
  tx: TransactionClient,
  dealId: string,
  contactId: string,
): Promise<AddContactToWorkResult> {
  const deal = await tx.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      contactId: true,
      projectId: true,
      leadId: true,
      status: true,
      trashedAt: true,
    },
  });
  if (!deal || deal.trashedAt) {
    throw svyazatBlocked(LEAD_SVYAZAT_ERROR.TARGET_NOT_FOUND, 'Target Deal was not found.');
  }
  if (!isOpenDealStatus(deal.status)) {
    throw svyazatBlocked(
      LEAD_SVYAZAT_ERROR.TARGET_NOT_OPEN,
      'Attach Contact to work only on an open Deal. After delivery use the Project.',
    );
  }
  const role = await placeContactOnDeal(tx, deal, contactId);
  const cascadedProjectId = deal.projectId
    ? await cascadeContactToProject(tx, deal.projectId, contactId)
    : null;
  return { role, cascadedProjectId, dealLeadId: deal.leadId };
}

async function placeContactOnDeal(
  tx: TransactionClient,
  deal: { id: string; contactId: string | null },
  contactId: string,
): Promise<ContactAttachRole> {
  if (!deal.contactId) {
    await tx.deal.update({ where: { id: deal.id }, data: { contactId } });
    return 'primary';
  }
  if (deal.contactId === contactId) return 'already';
  await tx.dealAdditionalContact.createMany({
    data: [{ dealId: deal.id, contactId }],
    skipDuplicates: true,
  });
  return 'additional';
}

async function cascadeContactToProject(
  tx: TransactionClient,
  projectId: string,
  contactId: string,
): Promise<string> {
  await addContactToProject(tx, projectId, contactId);
  return projectId;
}

async function addContactToProject(
  tx: TransactionClient,
  projectId: string,
  contactId: string,
): Promise<ContactAttachRole> {
  const project = await tx.project.findUnique({
    where: { id: projectId },
    select: { id: true, contactId: true, trashedAt: true },
  });
  if (!project || project.trashedAt) {
    throw svyazatBlocked(LEAD_SVYAZAT_ERROR.TARGET_NOT_FOUND, 'Target Project was not found.');
  }
  if (project.contactId === contactId) return 'already';
  await tx.projectAdditionalContact.createMany({
    data: [{ projectId: project.id, contactId }],
    skipDuplicates: true,
  });
  return 'additional';
}

async function addContactToLead(
  tx: TransactionClient,
  targetLeadId: string,
  contactId: string,
  sourceLeadId: string,
): Promise<AddContactToWorkResult> {
  if (targetLeadId === sourceLeadId) {
    throw svyazatBlocked(
      LEAD_SVYAZAT_ERROR.TARGET_SELF,
      'Cannot attach a Contact to the same Lead.',
    );
  }
  const target = await tx.lead.findUnique({
    where: { id: targetLeadId },
    select: {
      id: true,
      contactId: true,
      status: true,
      trashedAt: true,
      mergedIntoId: true,
      deal: { select: { id: true } },
    },
  });
  assertOpenTargetLead(target);
  const role = await placeContactOnLead(tx, target, contactId);
  return { role, cascadedProjectId: null, dealLeadId: null };
}

function assertOpenTargetLead(
  target: {
    id: string;
    contactId: string | null;
    status: string;
    trashedAt: Date | null;
    mergedIntoId: string | null;
    deal: { id: string } | null;
  } | null,
): asserts target is {
  id: string;
  contactId: string | null;
  status: string;
  trashedAt: Date | null;
  mergedIntoId: string | null;
  deal: { id: string } | null;
} {
  if (!target || target.trashedAt) {
    throw svyazatBlocked(LEAD_SVYAZAT_ERROR.TARGET_NOT_FOUND, 'Target Lead was not found.');
  }
  if (target.mergedIntoId || target.status === 'SQL' || target.deal) {
    throw svyazatBlocked(
      LEAD_SVYAZAT_ERROR.TARGET_NOT_OPEN,
      'Attach Contact only to an open Lead that is not SQL and has no Deal.',
    );
  }
}

async function placeContactOnLead(
  tx: TransactionClient,
  target: { id: string; contactId: string | null },
  contactId: string,
): Promise<ContactAttachRole> {
  if (!target.contactId) {
    await tx.lead.update({ where: { id: target.id }, data: { contactId } });
    return 'primary';
  }
  if (target.contactId === contactId) return 'already';
  await tx.leadAdditionalContact.createMany({
    data: [{ leadId: target.id, contactId }],
    skipDuplicates: true,
  });
  return 'additional';
}

export async function requireExistingContact(
  tx: TransactionClient,
  contactId: string,
): Promise<void> {
  const found = await tx.contact.findUnique({ where: { id: contactId }, select: { id: true } });
  if (!found) throw new NotFoundException(`Contact ${contactId} not found`);
}
