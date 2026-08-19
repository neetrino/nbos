import type { PrismaClient, TransactionClient } from '@nbos/database';
import type { AuditService } from '../../audit/audit.service';
import {
  appendNoteLine,
  LEAD_SVYAZAT_ERROR,
  type LeadAttachPhoneHandling,
} from './lead-identity.ops';
import {
  applyLeadPhoneToContact,
  assertSvyazatPermission,
  assertSvyazatSourceLead,
  loadSvyazatContact,
  loadSvyazatLead,
  svyazatBlocked,
  type SvyazatActor,
  type SvyazatContactRow,
  type SvyazatLeadRow,
} from './lead-svyazat-shared.ops';

export interface PourLeadIntoContactInput extends SvyazatActor {
  leadId: string;
  contactId: string;
}

export interface PourLeadIntoContactResult {
  leadId: string;
  contactId: string;
  trashed: true;
  phoneHandling: LeadAttachPhoneHandling;
}

export async function pourLeadIntoContact(
  prisma: InstanceType<typeof PrismaClient>,
  audit: AuditService,
  input: PourLeadIntoContactInput,
): Promise<PourLeadIntoContactResult> {
  const result = await prisma.$transaction(async (tx) => {
    const [lead, contact] = await Promise.all([
      loadSvyazatLead(tx, input.leadId),
      loadSvyazatContact(tx, input.contactId),
    ]);
    assertSvyazatSourceLead(lead);
    assertSvyazatPermission(input, lead);
    assertPourContactEligible(contact, lead);
    const phoneHandling = await applyLeadPhoneToContact(tx, lead, contact);
    await applyPourIdentity(tx, lead, contact);
    await tx.lead.update({
      where: { id: lead.id },
      data: { contactId: contact.id, trashedAt: new Date() },
    });
    return { leadId: lead.id, contactId: contact.id, trashed: true as const, phoneHandling };
  });

  await audit.log({
    entityType: 'lead',
    entityId: result.leadId,
    action: 'lead.poured_into_contact',
    userId: input.actorId,
    changes: {
      contactId: result.contactId,
      phoneHandling: result.phoneHandling,
      trashed: true,
    },
  });
  return result;
}

function assertPourContactEligible(contact: SvyazatContactRow, lead: SvyazatLeadRow): void {
  if (contact.trashedAt) {
    throw svyazatBlocked(LEAD_SVYAZAT_ERROR.CONTACT_TRASH, 'Cannot pour into a trashed Contact.');
  }
  if (lead.contactId && lead.contactId !== contact.id) {
    throw svyazatBlocked(
      LEAD_SVYAZAT_ERROR.CONTACT_MISMATCH,
      'This Lead is already linked to a different Contact.',
    );
  }
}

async function applyPourIdentity(
  tx: TransactionClient,
  lead: SvyazatLeadRow,
  contact: SvyazatContactRow,
): Promise<void> {
  const email = !contact.email?.trim() && lead.email?.trim() ? lead.email.trim() : undefined;
  const notes = lead.notes?.trim()
    ? appendNoteLine(contact.notes, `From Lead ${lead.code}: ${lead.notes.trim()}`)
    : undefined;
  if (!email && !notes) return;
  await tx.contact.update({
    where: { id: contact.id },
    data: {
      ...(email ? { email } : {}),
      ...(notes ? { notes } : {}),
    },
  });
}
