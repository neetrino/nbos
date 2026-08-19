import type { Prisma, TransactionClient } from '@nbos/database';
import {
  normalizeLeadEmail,
  openLeadAutoAttachWhere,
  openLeadBannerWhere,
  phoneLookupVariantsFromRaw,
  isOpenDealStatus,
} from './lead-identity.ops';

type LeadLookupDb = Pick<TransactionClient, 'lead' | 'contact' | 'deal'>;

const LEAD_DUPLICATE_SELECT = {
  id: true,
  code: true,
  name: true,
  contactName: true,
  phone: true,
  email: true,
  status: true,
  assignedTo: true,
  createdAt: true,
  source: true,
  sourceDetail: true,
  deal: { select: { id: true, code: true, status: true, trashedAt: true } },
} as const;

type LeadDuplicateRow = Prisma.LeadGetPayload<{ select: typeof LEAD_DUPLICATE_SELECT }>;

export interface LeadDuplicateCandidate {
  id: string;
  code: string;
  name: string | null;
  contactName: string;
  phone: string | null;
  email: string | null;
  status: string;
  assignedTo: string | null;
  createdAt: Date;
  source: string | null;
  sourceDetail: string | null;
  isSpam: boolean;
  isOpenForAttach: boolean;
  hasOpenDeal: boolean;
  deal: { id: string; code: string; status: string } | null;
}

export interface LeadDuplicateContact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
}

export interface LeadDuplicateOpenDeal {
  id: string;
  code: string;
  name: string | null;
  status: string;
  contactId: string | null;
  leadId: string | null;
}

export interface LeadDuplicateLookupResult {
  leads: LeadDuplicateCandidate[];
  contacts: LeadDuplicateContact[];
  openDeals: LeadDuplicateOpenDeal[];
}

export interface LeadDuplicateLookupQuery {
  phone?: string | null;
  email?: string | null;
  instagramUsername?: string | null;
  excludeId?: string | null;
  search?: string | null;
}

const CANDIDATE_LIMIT = 20;

function mapLeadCandidate(row: LeadDuplicateRow): LeadDuplicateCandidate {
  const dealActive = row.deal && row.deal.trashedAt == null ? row.deal : null;
  const hasOpenDeal = Boolean(dealActive && isOpenDealStatus(dealActive.status));
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    contactName: row.contactName,
    phone: row.phone,
    email: row.email,
    status: row.status,
    assignedTo: row.assignedTo,
    createdAt: row.createdAt,
    source: row.source,
    sourceDetail: row.sourceDetail,
    isSpam: row.status === 'SPAM',
    isOpenForAttach: row.status !== 'SQL' && row.status !== 'SPAM',
    hasOpenDeal,
    deal: dealActive
      ? { id: dealActive.id, code: dealActive.code, status: dealActive.status }
      : null,
  };
}

function identityOrFilters(query: LeadDuplicateLookupQuery): Prisma.LeadWhereInput[] {
  const filters: Prisma.LeadWhereInput[] = [];
  const phones = phoneLookupVariantsFromRaw(query.phone);
  if (phones.length > 0) {
    filters.push({ phone: { in: phones } });
  }
  const email = normalizeLeadEmail(query.email);
  if (email) {
    filters.push({ email: { equals: email, mode: 'insensitive' } });
  }
  const username = query.instagramUsername?.trim();
  if (username) {
    filters.push({
      metaConversation: {
        senderIdentity: { username: { equals: username, mode: 'insensitive' } },
      },
    });
  }
  return filters;
}

function searchOrFilters(search: string): Prisma.LeadWhereInput[] {
  return [
    { name: { contains: search, mode: 'insensitive' } },
    { contactName: { contains: search, mode: 'insensitive' } },
    { email: { contains: search, mode: 'insensitive' } },
    { phone: { contains: search, mode: 'insensitive' } },
    { code: { contains: search, mode: 'insensitive' } },
  ];
}

export async function findOpenLeadByPhone(
  db: LeadLookupDb,
  phone: string | null | undefined,
): Promise<{ id: string } | null> {
  const variants = phoneLookupVariantsFromRaw(phone);
  if (variants.length === 0) return null;
  return db.lead.findFirst({
    where: openLeadAutoAttachWhere({ phone: { in: variants } }),
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
}

export async function findOpenLeadByInstagramUsername(
  db: LeadLookupDb,
  username: string | null | undefined,
): Promise<{ id: string } | null> {
  const trimmed = username?.trim();
  if (!trimmed) return null;
  return db.lead.findFirst({
    where: openLeadAutoAttachWhere({
      metaConversation: {
        senderIdentity: { username: { equals: trimmed, mode: 'insensitive' } },
      },
    }),
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
}

/**
 * Candidates for create banner, phone-add merge offer, and merge-wizard search.
 * SPAM appears in the banner but is not an auto-attach target.
 */
export async function findLeadDuplicateCandidates(
  db: LeadLookupDb,
  query: LeadDuplicateLookupQuery,
): Promise<LeadDuplicateLookupResult> {
  const identity = identityOrFilters(query);
  const search = query.search?.trim();
  if (identity.length === 0 && !search) {
    return { leads: [], contacts: [], openDeals: [] };
  }

  const or: Prisma.LeadWhereInput[] = [...identity];
  if (search) or.push(...searchOrFilters(search));

  const where = openLeadBannerWhere({
    ...(query.excludeId ? { id: { not: query.excludeId } } : {}),
    OR: or,
  });

  const [leadRows, contacts] = await Promise.all([
    db.lead.findMany({
      where,
      select: LEAD_DUPLICATE_SELECT,
      orderBy: { createdAt: 'desc' },
      take: CANDIDATE_LIMIT,
    }),
    findMatchingContacts(db, query),
  ]);

  const leads = leadRows.map(mapLeadCandidate);
  const contactIds = contacts.map((c) => c.id);
  const extraLeads = await findLeadsForContacts(db, contactIds, query.excludeId, leads);
  const mergedLeads = dedupeLeads([...leads, ...extraLeads]);
  const openDeals = await findOpenDealsForIdentities(db, mergedLeads, contactIds);
  return { leads: mergedLeads, contacts, openDeals };
}

async function findMatchingContacts(
  db: LeadLookupDb,
  query: LeadDuplicateLookupQuery,
): Promise<LeadDuplicateContact[]> {
  const phones = phoneLookupVariantsFromRaw(query.phone);
  const email = normalizeLeadEmail(query.email);
  const search = query.search?.trim();
  const or: Prisma.ContactWhereInput[] = [];
  if (phones.length > 0) or.push({ phone: { in: phones } });
  if (email) or.push({ email: { equals: email, mode: 'insensitive' } });
  if (search) or.push(...contactSearchOrFilters(search));
  if (or.length === 0) return [];
  return db.contact.findMany({
    where: { trashedAt: null, OR: or },
    select: { id: true, firstName: true, lastName: true, phone: true, email: true },
    take: CANDIDATE_LIMIT,
  });
}

function contactSearchOrFilters(search: string): Prisma.ContactWhereInput[] {
  const filters: Prisma.ContactWhereInput[] = [
    { firstName: { contains: search, mode: 'insensitive' } },
    { lastName: { contains: search, mode: 'insensitive' } },
  ];
  const parts = search.split(/\s+/).filter((part) => part.length > 0);
  if (parts.length >= 2) {
    filters.push({
      AND: [
        { firstName: { contains: parts[0], mode: 'insensitive' } },
        { lastName: { contains: parts[parts.length - 1], mode: 'insensitive' } },
      ],
    });
  }
  return filters;
}

async function findLeadsForContacts(
  db: LeadLookupDb,
  contactIds: string[],
  excludeId: string | null | undefined,
  already: LeadDuplicateCandidate[],
): Promise<LeadDuplicateCandidate[]> {
  if (contactIds.length === 0) return [];
  const known = new Set(already.map((l) => l.id));
  const rows = await db.lead.findMany({
    where: openLeadBannerWhere({
      ...(excludeId ? { id: { not: excludeId } } : {}),
      OR: [
        { contactId: { in: contactIds } },
        { additionalContacts: { some: { contactId: { in: contactIds } } } },
      ],
    }),
    select: LEAD_DUPLICATE_SELECT,
    take: CANDIDATE_LIMIT,
  });
  return rows.filter((row) => !known.has(row.id)).map(mapLeadCandidate);
}

async function findOpenDealsForIdentities(
  db: LeadLookupDb,
  leads: LeadDuplicateCandidate[],
  contactIds: string[],
): Promise<LeadDuplicateOpenDeal[]> {
  const leadIds = leads.map((l) => l.id);
  if (leadIds.length === 0 && contactIds.length === 0) return [];
  const or: Prisma.DealWhereInput[] = [];
  if (leadIds.length > 0) or.push({ leadId: { in: leadIds } });
  if (contactIds.length > 0) or.push({ contactId: { in: contactIds } });
  const rows = await db.deal.findMany({
    where: {
      trashedAt: null,
      status: { notIn: ['WON', 'FAILED'] },
      OR: or,
    },
    select: { id: true, code: true, name: true, status: true, contactId: true, leadId: true },
    take: CANDIDATE_LIMIT,
  });
  return rows;
}

function dedupeLeads(leads: LeadDuplicateCandidate[]): LeadDuplicateCandidate[] {
  const seen = new Set<string>();
  const out: LeadDuplicateCandidate[] = [];
  for (const lead of leads) {
    if (seen.has(lead.id)) continue;
    seen.add(lead.id);
    out.push(lead);
  }
  return out.slice(0, CANDIDATE_LIMIT);
}
