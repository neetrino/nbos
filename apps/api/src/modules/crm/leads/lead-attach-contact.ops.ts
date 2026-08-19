import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaClient, TransactionClient } from '@nbos/database';
import { canAttachLeadToContact } from '@nbos/shared';
import type { AuditService } from '../../audit/audit.service';
import {
  appendNoteLine,
  isOpenDealStatus,
  LEAD_ATTACH_ERROR,
  normalizePhoneForStorage,
  phonesOverlap,
  type LeadAttachPhoneHandling,
} from './lead-identity.ops';
import { repointLeadAtsAndMeta } from './lead-merge-relations.ops';

const ATTACH_LEAD_SELECT = {
  id: true,
  code: true,
  phone: true,
  assignedTo: true,
  contactId: true,
  status: true,
  trashedAt: true,
  mergedIntoId: true,
  deal: { select: { id: true } },
} as const;

const ATTACH_CONTACT_SELECT = {
  id: true,
  phone: true,
  notes: true,
  trashedAt: true,
} as const;

const ATTACH_DEAL_SELECT = {
  id: true,
  code: true,
  status: true,
  contactId: true,
  leadId: true,
  notes: true,
  trashedAt: true,
} as const;

type AttachLeadRow = {
  id: string;
  code: string;
  phone: string | null;
  assignedTo: string | null;
  contactId: string | null;
  status: string;
  trashedAt: Date | null;
  mergedIntoId: string | null;
  deal: { id: string } | null;
};

type AttachContactRow = {
  id: string;
  phone: string | null;
  notes: string | null;
  trashedAt: Date | null;
};

type AttachDealRow = {
  id: string;
  code: string;
  status: string;
  contactId: string | null;
  leadId: string | null;
  notes: string | null;
  trashedAt: Date | null;
};

export interface AttachLeadToContactInput {
  leadId: string;
  contactId: string;
  aboutDealId?: string;
  actorId: string;
  actorRoleSlug: string;
}

export interface AttachLeadToContactResult {
  leadId: string;
  contactId: string;
  aboutDealId: string | null;
  trashed: boolean;
  phoneHandling: LeadAttachPhoneHandling;
}

export async function attachLeadToContact(
  prisma: InstanceType<typeof PrismaClient>,
  audit: AuditService,
  input: AttachLeadToContactInput,
): Promise<AttachLeadToContactResult> {
  const result = await prisma.$transaction(async (tx) => runAttach(tx, input));

  await audit.log({
    entityType: 'lead',
    entityId: result.leadId,
    action: 'lead.attached_to_contact',
    userId: input.actorId,
    changes: {
      contactId: result.contactId,
      aboutDealId: result.aboutDealId,
      phoneHandling: result.phoneHandling,
      trashed: result.trashed,
    },
  });

  return result;
}

async function runAttach(
  tx: TransactionClient,
  input: AttachLeadToContactInput,
): Promise<AttachLeadToContactResult> {
  const [lead, contact] = await Promise.all([
    loadAttachLead(tx, input.leadId),
    loadAttachContact(tx, input.contactId),
  ]);
  assertAttachLeadEligible(lead);
  assertAttachContactEligible(contact, lead);
  assertCanAttachLead(input, lead);

  const deal = input.aboutDealId
    ? assertAboutDeal(await loadAttachDeal(tx, input.aboutDealId), contact.id)
    : null;
  const phoneHandling = await applyContactPhone(tx, lead, contact);

  await tx.lead.update({
    where: { id: lead.id },
    data: { contactId: contact.id },
  });

  if (!deal) {
    return {
      leadId: lead.id,
      contactId: contact.id,
      aboutDealId: null,
      trashed: false,
      phoneHandling,
    };
  }

  return applyAboutDeal(tx, lead, contact, deal, phoneHandling);
}

async function applyAboutDeal(
  tx: TransactionClient,
  lead: AttachLeadRow,
  contact: AttachContactRow,
  deal: AttachDealRow,
  phoneHandling: LeadAttachPhoneHandling,
): Promise<AttachLeadToContactResult> {
  if (deal.leadId && deal.leadId !== lead.id) {
    await repointLeadAtsAndMeta(tx, lead.id, deal.leadId);
  }
  await tx.lead.update({
    where: { id: lead.id },
    data: { trashedAt: new Date() },
  });
  const phone = normalizePhoneForStorage(lead.phone);
  const dealNote = phone
    ? `Inbound Lead ${lead.code} identified as this Deal (new phone ${phone}).`
    : `Inbound Lead ${lead.code} identified as this Deal.`;
  await tx.deal.update({
    where: { id: deal.id },
    data: { notes: appendNoteLine(deal.notes, dealNote) },
  });
  return {
    leadId: lead.id,
    contactId: contact.id,
    aboutDealId: deal.id,
    trashed: true,
    phoneHandling,
  };
}

async function applyContactPhone(
  tx: TransactionClient,
  lead: AttachLeadRow,
  contact: AttachContactRow,
): Promise<LeadAttachPhoneHandling> {
  const stored = normalizePhoneForStorage(lead.phone);
  if (!stored) return 'none';
  if (!contact.phone?.trim()) {
    await tx.contact.update({ where: { id: contact.id }, data: { phone: stored } });
    return 'written';
  }
  if (phonesOverlap(contact.phone, stored)) return 'same';
  await tx.contact.update({
    where: { id: contact.id },
    data: { notes: appendNoteLine(contact.notes, `${stored} added from Lead ${lead.code}`) },
  });
  return 'noted';
}

function assertAttachLeadEligible(lead: AttachLeadRow): void {
  if (lead.trashedAt) {
    throw attachBlocked(LEAD_ATTACH_ERROR.TRASH, 'Cannot attach: Lead is in Trash.');
  }
  if (lead.mergedIntoId) {
    throw attachBlocked(LEAD_ATTACH_ERROR.ABSORBED, 'Cannot attach: Lead was already absorbed.');
  }
  if (lead.status === 'SQL') {
    throw attachBlocked(LEAD_ATTACH_ERROR.SQL, 'Cannot attach a Lead that is already SQL.');
  }
  if (lead.deal) {
    throw attachBlocked(LEAD_ATTACH_ERROR.DEAL, 'Cannot attach a Lead that already has a Deal.');
  }
}

function assertAttachContactEligible(contact: AttachContactRow, lead: AttachLeadRow): void {
  if (contact.trashedAt) {
    throw attachBlocked(LEAD_ATTACH_ERROR.CONTACT_TRASH, 'Cannot attach to a trashed Contact.');
  }
  if (lead.contactId && lead.contactId !== contact.id) {
    throw attachBlocked(
      LEAD_ATTACH_ERROR.CONTACT_MISMATCH,
      'This Lead is already linked to a different Contact.',
    );
  }
}

function assertCanAttachLead(input: AttachLeadToContactInput, lead: AttachLeadRow): void {
  if (
    canAttachLeadToContact({
      roleSlug: input.actorRoleSlug,
      actorId: input.actorId,
      assignedTo: lead.assignedTo,
    })
  ) {
    return;
  }
  throw new ForbiddenException({
    statusCode: 403,
    code: LEAD_ATTACH_ERROR.FORBIDDEN,
    message:
      'You cannot attach this Lead. Seller may attach only a card assigned to them; Marketing cannot attach.',
  });
}

function assertAboutDeal(deal: AttachDealRow, contactId: string): AttachDealRow {
  if (deal.trashedAt || !isOpenDealStatus(deal.status)) {
    throw attachBlocked(
      LEAD_ATTACH_ERROR.DEAL_NOT_OPEN,
      'Cannot treat this inbound as a closed Deal. Attach to the Contact only.',
    );
  }
  if (deal.contactId && deal.contactId !== contactId) {
    throw attachBlocked(
      LEAD_ATTACH_ERROR.DEAL_CONTACT_MISMATCH,
      'This Deal belongs to a different Contact.',
    );
  }
  return deal;
}

async function loadAttachLead(tx: TransactionClient, id: string): Promise<AttachLeadRow> {
  const lead = await tx.lead.findUnique({ where: { id }, select: ATTACH_LEAD_SELECT });
  if (!lead) throw new NotFoundException(`Lead ${id} not found`);
  return lead;
}

async function loadAttachContact(tx: TransactionClient, id: string): Promise<AttachContactRow> {
  const contact = await tx.contact.findUnique({ where: { id }, select: ATTACH_CONTACT_SELECT });
  if (!contact) throw new NotFoundException(`Contact ${id} not found`);
  return contact;
}

async function loadAttachDeal(tx: TransactionClient, id: string): Promise<AttachDealRow> {
  const deal = await tx.deal.findUnique({ where: { id }, select: ATTACH_DEAL_SELECT });
  if (!deal) throw new NotFoundException(`Deal ${id} not found`);
  return deal;
}

function attachBlocked(code: string, message: string): BadRequestException {
  return new BadRequestException({ statusCode: 400, code, message });
}
