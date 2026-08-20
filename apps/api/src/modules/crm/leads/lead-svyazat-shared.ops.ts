import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { TransactionClient } from '@nbos/database';
import { canAttachLeadToContact } from '@nbos/shared';
import {
  contactOwnsPhone,
  createExtraContactPhone,
} from '../../clients/contacts/contact-phone.ops';
import {
  LEAD_SVYAZAT_ERROR,
  normalizePhoneForStorage,
  type LeadAttachPhoneHandling,
} from './lead-identity.ops';

export const SVYAZAT_LEAD_SELECT = {
  id: true,
  code: true,
  name: true,
  contactName: true,
  phone: true,
  email: true,
  notes: true,
  assignedTo: true,
  contactId: true,
  status: true,
  trashedAt: true,
  mergedIntoId: true,
  deal: { select: { id: true } },
} as const;

export const SVYAZAT_CONTACT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  email: true,
  notes: true,
  trashedAt: true,
  extraPhones: { select: { e164: true } },
} as const;

export type SvyazatLeadRow = {
  id: string;
  code: string;
  name: string | null;
  contactName: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  assignedTo: string | null;
  contactId: string | null;
  status: string;
  trashedAt: Date | null;
  mergedIntoId: string | null;
  deal: { id: string } | null;
};

export type SvyazatContactRow = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  trashedAt: Date | null;
  extraPhones: Array<{ e164: string }>;
};

export interface SvyazatActor {
  actorId: string;
  actorRoleSlug: string;
  isPlatformOwner?: boolean;
}

export function svyazatBlocked(code: string, message: string): BadRequestException {
  return new BadRequestException({ statusCode: 400, code, message });
}

export function assertSvyazatSourceLead(lead: SvyazatLeadRow): void {
  if (lead.trashedAt) {
    throw svyazatBlocked(LEAD_SVYAZAT_ERROR.TRASH, 'Cannot use a Lead that is in Trash.');
  }
  if (lead.mergedIntoId) {
    throw svyazatBlocked(
      LEAD_SVYAZAT_ERROR.ABSORBED,
      'Cannot use a Lead that was already absorbed.',
    );
  }
  if (lead.status === 'SQL') {
    throw svyazatBlocked(LEAD_SVYAZAT_ERROR.SQL, 'Cannot use a Lead that is already SQL.');
  }
  if (lead.deal) {
    throw svyazatBlocked(LEAD_SVYAZAT_ERROR.DEAL, 'Cannot use a Lead that already has a Deal.');
  }
}

export function assertSvyazatPermission(actor: SvyazatActor, lead: SvyazatLeadRow): void {
  if (
    canAttachLeadToContact({
      roleSlug: actor.actorRoleSlug,
      actorId: actor.actorId,
      assignedTo: lead.assignedTo,
      isPlatformOwner: actor.isPlatformOwner === true,
    })
  ) {
    return;
  }
  throw new ForbiddenException({
    statusCode: 403,
    code: LEAD_SVYAZAT_ERROR.FORBIDDEN,
    message:
      'You cannot link this Lead. Seller may act only on a card assigned to them; Marketing cannot.',
  });
}

export async function loadSvyazatLead(tx: TransactionClient, id: string): Promise<SvyazatLeadRow> {
  const lead = await tx.lead.findUnique({ where: { id }, select: SVYAZAT_LEAD_SELECT });
  if (!lead) throw new NotFoundException(`Lead ${id} not found`);
  return lead;
}

export async function loadSvyazatContact(
  tx: TransactionClient,
  id: string,
): Promise<SvyazatContactRow> {
  const contact = await tx.contact.findUnique({ where: { id }, select: SVYAZAT_CONTACT_SELECT });
  if (!contact) throw new NotFoundException(`Contact ${id} not found`);
  return contact;
}

export async function applyLeadPhoneToContact(
  tx: TransactionClient,
  lead: Pick<SvyazatLeadRow, 'phone'>,
  contact: SvyazatContactRow,
): Promise<LeadAttachPhoneHandling> {
  const stored = normalizePhoneForStorage(lead.phone);
  if (!stored) return 'none';
  if (!contact.phone?.trim()) {
    await tx.contact.update({ where: { id: contact.id }, data: { phone: stored } });
    return 'written';
  }
  if (contactOwnsPhone(contact.phone, contact.extraPhones, stored)) return 'same';
  await createExtraContactPhone(tx, contact.id, stored);
  return 'extra';
}
