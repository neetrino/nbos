import type { TransactionClient } from '@nbos/database';
import { openLeadAutoAttachWhere, phoneLookupVariantsFromRaw } from './lead-identity.ops';

type InboundLookupDb = Pick<TransactionClient, 'lead' | 'contact' | 'deal'>;

export interface ContactPhoneInboundTarget {
  existingLeadId: string | null;
  contactId: string | null;
}

export async function findContactByPhone(
  db: InboundLookupDb,
  phone: string | null | undefined,
): Promise<{ id: string } | null> {
  const variants = phoneLookupVariantsFromRaw(phone);
  if (variants.length === 0) return null;
  return db.contact.findFirst({
    where: { trashedAt: null, phone: { in: variants } },
    select: { id: true },
  });
}

export async function findOpenLeadForContact(
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

export async function findOpenDealForContact(
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
  if (!contact) return { existingLeadId: null, contactId: null };

  const openLead = await findOpenLeadForContact(db, contact.id);
  if (openLead) return { existingLeadId: openLead.id, contactId: contact.id };

  const openDeal = await findOpenDealForContact(db, contact.id);
  if (openDeal?.leadId) return { existingLeadId: openDeal.leadId, contactId: contact.id };

  return { existingLeadId: null, contactId: contact.id };
}
