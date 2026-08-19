import type { TransactionClient } from '@nbos/database';

export interface ContactMergeRelationCounts {
  companies: number;
  billingCompanies: number;
  projects: number;
  leads: number;
  deals: number;
  extraPhones: number;
  additionalLinks: number;
}

interface JunctionDelegate {
  findMany: (args: {
    where: { contactId: string };
    select: Record<string, boolean>;
  }) => Promise<Array<Record<string, string>>>;
  createMany: (args: {
    data: Array<Record<string, string>>;
    skipDuplicates?: boolean;
  }) => Promise<{ count: number }>;
  deleteMany: (args: { where: { contactId: string } }) => Promise<{ count: number }>;
}

export async function moveContactMergeRelations(
  tx: TransactionClient,
  survivorId: string,
  absorbedId: string,
  extraPhoneE164: string[],
): Promise<ContactMergeRelationCounts> {
  const owned = await reassignDirectContactFks(tx, absorbedId, survivorId);
  const additionalLinks = await moveAllAdditionalLinks(tx, absorbedId, survivorId);
  await applyExtraPhoneUnion(tx, survivorId, absorbedId, extraPhoneE164);
  return { ...owned, extraPhones: extraPhoneE164.length, additionalLinks };
}

async function reassignDirectContactFks(
  tx: TransactionClient,
  fromId: string,
  toId: string,
): Promise<Omit<ContactMergeRelationCounts, 'extraPhones' | 'additionalLinks'>> {
  const [companies, billingCompanies, projects, leads, sourceLeads, deals, sourceDeals] =
    await Promise.all([
      tx.company.updateMany({ where: { contactId: fromId }, data: { contactId: toId } }),
      tx.company.updateMany({
        where: { billingContactId: fromId },
        data: { billingContactId: toId },
      }),
      tx.project.updateMany({ where: { contactId: fromId }, data: { contactId: toId } }),
      tx.lead.updateMany({ where: { contactId: fromId }, data: { contactId: toId } }),
      tx.lead.updateMany({ where: { sourceContactId: fromId }, data: { sourceContactId: toId } }),
      tx.deal.updateMany({ where: { contactId: fromId }, data: { contactId: toId } }),
      tx.deal.updateMany({ where: { sourceContactId: fromId }, data: { sourceContactId: toId } }),
    ]);
  await reassignSecondaryContactFks(tx, fromId, toId);
  return {
    companies: companies.count,
    billingCompanies: billingCompanies.count,
    projects: projects.count,
    leads: leads.count + sourceLeads.count,
    deals: deals.count + sourceDeals.count,
  };
}

async function reassignSecondaryContactFks(
  tx: TransactionClient,
  fromId: string,
  toId: string,
): Promise<void> {
  await Promise.all([
    tx.supportTicket.updateMany({ where: { contactId: fromId }, data: { contactId: toId } }),
    tx.partner.updateMany({ where: { contactId: fromId }, data: { contactId: toId } }),
    tx.partnerServiceTerm.updateMany({
      where: { clientContactId: fromId },
      data: { clientContactId: toId },
    }),
    tx.productWhatsAppClientInvitation.updateMany({
      where: { contactId: fromId },
      data: { contactId: toId },
    }),
    tx.calendarMeeting.updateMany({ where: { contactId: fromId }, data: { contactId: toId } }),
  ]);
}

async function moveAllAdditionalLinks(
  tx: TransactionClient,
  absorbedId: string,
  survivorId: string,
): Promise<number> {
  const moved = await Promise.all([
    moveContactJunction(tx.leadAdditionalContact, 'leadId', absorbedId, survivorId),
    moveContactJunction(tx.dealAdditionalContact, 'dealId', absorbedId, survivorId),
    moveContactJunction(tx.projectAdditionalContact, 'projectId', absorbedId, survivorId),
    moveContactJunction(tx.companyAdditionalContact, 'companyId', absorbedId, survivorId),
  ]);
  return moved.reduce((sum, count) => sum + count, 0);
}

async function moveContactJunction(
  model: JunctionDelegate,
  ownerKey: string,
  absorbedId: string,
  survivorId: string,
): Promise<number> {
  const [absorbedLinks, survivorLinks] = await Promise.all([
    model.findMany({ where: { contactId: absorbedId }, select: { [ownerKey]: true } }),
    model.findMany({ where: { contactId: survivorId }, select: { [ownerKey]: true } }),
  ]);
  const existing = new Set(survivorLinks.map((link) => link[ownerKey]));
  const toCreate = absorbedLinks
    .map((link) => link[ownerKey])
    .filter((ownerId) => ownerId && !existing.has(ownerId))
    .map((ownerId) => ({ [ownerKey]: ownerId, contactId: survivorId }));
  if (toCreate.length > 0) {
    await model.createMany({ data: toCreate, skipDuplicates: true });
  }
  await model.deleteMany({ where: { contactId: absorbedId } });
  return toCreate.length;
}

async function applyExtraPhoneUnion(
  tx: TransactionClient,
  survivorId: string,
  absorbedId: string,
  extraPhoneE164: string[],
): Promise<void> {
  await tx.contactPhone.deleteMany({
    where: { contactId: { in: [survivorId, absorbedId] } },
  });
  if (extraPhoneE164.length === 0) return;
  await tx.contactPhone.createMany({
    data: extraPhoneE164.map((e164) => ({ contactId: survivorId, e164 })),
  });
}
