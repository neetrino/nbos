import type { TransactionClient } from '@nbos/database';
import { contactPhoneLookupWhere } from '../../clients/contacts/contact-phone.ops';
import { openLeadAutoAttachWhere } from './lead-identity.ops';

type InboundLookupDb = Pick<TransactionClient, 'lead' | 'contact' | 'deal'>;

export interface ContactPhoneInboundTarget {
  existingLeadId: string | null;
  contactId: string | null;
  /** Open Deal on this Contact: never create a second Lead, even if Deal.leadId is empty. */
  hasOpenDeal: boolean;
  dealId: string | null;
}

const EMPTY_INBOUND_TARGET: ContactPhoneInboundTarget = {
  existingLeadId: null,
  contactId: null,
  hasOpenDeal: false,
  dealId: null,
};

async function findContactByPhone(
  db: InboundLookupDb,
  phone: string | null | undefined,
): Promise<{ id: string } | null> {
  const match = contactPhoneLookupWhere(phone);
  if (!match) return null;
  return db.contact.findFirst({
    where: { trashedAt: null, ...match },
    select: { id: true },
  });
}

async function findOpenLeadForContact(
  db: InboundLookupDb,
  contactId: string,
): Promise<{ id: string } | null> {
  return db.lead.findFirst({
    where: openLeadAutoAttachWhere({
      OR: [{ contactId }, { additionalContacts: { some: { contactId } } }],
    }),
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
}

async function findOpenDealForContact(
  db: InboundLookupDb,
  contactId: string,
): Promise<{ id: string; leadId: string | null } | null> {
  return db.deal.findFirst({
    where: {
      trashedAt: null,
      contactId,
      status: { notIn: ['WON', 'FAILED'] },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, leadId: true },
  });
}

/**
 * After exact-phone open-Lead miss: resolve Contact by phone, then an open
 * non-SQL Lead of that person or the open Deal's original Lead.
 */
export async function resolveContactPhoneInbound(
  db: InboundLookupDb,
  phone: string,
): Promise<ContactPhoneInboundTarget> {
  const contact = await findContactByPhone(db, phone);
  if (!contact) return EMPTY_INBOUND_TARGET;

  const [openLead, openDeal] = await Promise.all([
    findOpenLeadForContact(db, contact.id),
    findOpenDealForContact(db, contact.id),
  ]);

  return {
    existingLeadId: openLead?.id ?? openDeal?.leadId ?? null,
    contactId: contact.id,
    hasOpenDeal: openDeal != null,
    dealId: openDeal?.id ?? null,
  };
}
