import type { PrismaClient, TransactionClient } from '@nbos/database';
import type { AuditService } from '../../audit/audit.service';
import { normalizePhoneForStorage } from './lead-identity.ops';
import { LEAD_SVYAZAT_ERROR } from './lead-identity.ops';
import { addContactToWorkTarget } from './lead-entity-contact.ops';
import { personNameFromLead } from './lead-person-name.ops';
import { repointLeadAtsAndMeta } from './lead-merge-relations.ops';
import {
  assertSvyazatPermission,
  assertSvyazatSourceLead,
  loadSvyazatLead,
  svyazatBlocked,
  type SvyazatActor,
  type SvyazatLeadRow,
} from './lead-svyazat-shared.ops';
import type { LeadCreateContactAttachType } from './dto/create-lead-contact.dto';

export interface CreateLeadContactAttach {
  type: LeadCreateContactAttachType;
  id: string;
}

export interface CreateLeadContactInput extends SvyazatActor {
  leadId: string;
  attach?: CreateLeadContactAttach;
}

export interface CreateLeadContactResult {
  leadId: string;
  contactId: string;
  trashed: boolean;
  attachedTo: CreateLeadContactAttach | null;
  cascadedProjectId: string | null;
}

export async function createContactFromLead(
  prisma: InstanceType<typeof PrismaClient>,
  audit: AuditService,
  input: CreateLeadContactInput,
): Promise<CreateLeadContactResult> {
  const result = await prisma.$transaction((tx) => runCreateContact(tx, input));
  await audit.log({
    entityType: 'lead',
    entityId: result.leadId,
    action: result.trashed ? 'lead.contact_created_and_attached' : 'lead.contact_created',
    userId: input.actorId,
    changes: {
      contactId: result.contactId,
      attachedTo: result.attachedTo
        ? { type: result.attachedTo.type, id: result.attachedTo.id }
        : null,
      cascadedProjectId: result.cascadedProjectId,
      trashed: result.trashed,
    },
  });
  return result;
}

async function runCreateContact(
  tx: TransactionClient,
  input: CreateLeadContactInput,
): Promise<CreateLeadContactResult> {
  const lead = await loadSvyazatLead(tx, input.leadId);
  assertSvyazatSourceLead(lead);
  assertSvyazatPermission(input, lead);
  if (lead.contactId) {
    throw svyazatBlocked(
      LEAD_SVYAZAT_ERROR.ALREADY_IDENTIFIED,
      'This Lead already has a Contact. Use the contacts picker or merge with a Contact.',
    );
  }
  const contact = await createContactRow(tx, lead);
  if (!input.attach) {
    await tx.lead.update({ where: { id: lead.id }, data: { contactId: contact.id } });
    return {
      leadId: lead.id,
      contactId: contact.id,
      trashed: false,
      attachedTo: null,
      cascadedProjectId: null,
    };
  }
  return attachAndTrash(tx, lead, contact.id, input.attach);
}

async function createContactRow(tx: TransactionClient, lead: SvyazatLeadRow) {
  const { firstName, lastName } = personNameFromLead(lead);
  return tx.contact.create({
    data: {
      firstName,
      lastName,
      phone: normalizePhoneForStorage(lead.phone),
      email: lead.email?.trim() || null,
      notes: lead.notes?.trim() || null,
      role: 'CLIENT',
    },
    select: { id: true },
  });
}

async function attachAndTrash(
  tx: TransactionClient,
  lead: SvyazatLeadRow,
  contactId: string,
  attach: CreateLeadContactAttach,
): Promise<CreateLeadContactResult> {
  const placed = await addContactToWorkTarget(tx, attach.type, attach.id, contactId, lead.id);
  await maybeRepointChannels(tx, lead.id, attach, placed.dealLeadId);
  await tx.lead.update({
    where: { id: lead.id },
    data: { contactId, trashedAt: new Date() },
  });
  return {
    leadId: lead.id,
    contactId,
    trashed: true,
    attachedTo: attach,
    cascadedProjectId: placed.cascadedProjectId,
  };
}

async function maybeRepointChannels(
  tx: TransactionClient,
  sourceLeadId: string,
  attach: CreateLeadContactAttach,
  dealLeadId: string | null,
): Promise<void> {
  if (attach.type === 'lead') {
    await repointLeadAtsAndMeta(tx, sourceLeadId, attach.id);
    return;
  }
  if (attach.type === 'deal' && dealLeadId && dealLeadId !== sourceLeadId) {
    await repointLeadAtsAndMeta(tx, sourceLeadId, dealLeadId);
  }
}
