import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { selectReadableClientConversationIds } from './messenger-core-client-list.ops';

type PrismaLike = InstanceType<typeof PrismaClient>;

/** Caps the scoped list. A single readable conversation is still returned whole. */
export const PORTFOLIO_CLIENT_SCOPE_CONVERSATION_CAP = 40;

export function portfolioScopeInput(query: {
  contactId?: string;
  companyId?: string;
}): PortfolioClientScopeInput {
  const contactId = query.contactId?.trim() || undefined;
  const companyId = query.companyId?.trim() || undefined;
  if (contactId && !companyId) return { scope: 'contact', entityId: contactId };
  if (companyId && !contactId) return { scope: 'company', entityId: companyId };
  throw new BadRequestException('Provide one portfolio contact or company');
}

export type PortfolioClientScopeInput =
  | { scope: 'contact'; entityId: string }
  | { scope: 'company'; entityId: string };

export type PortfolioClientScopeResult = {
  scope: 'contact' | 'company';
  entityId: string;
  label: string;
  conversationIds: string[];
  uniqueConversationId: string | null;
};

const CLIENT_CONVERSATION = { zone: 'CLIENT' as const, status: 'ACTIVE' as const };

/**
 * Client conversations linked to a Contact or Company portfolio.
 * Product bindings and links choose candidates. Client READ decides visibility.
 */
export async function resolvePortfolioClientScope(
  prisma: PrismaLike,
  employeeId: string,
  clientReadScope: string,
  input: PortfolioClientScopeInput,
): Promise<PortfolioClientScopeResult> {
  const loaded = await loadPortfolioScope(prisma, input);
  const candidates = await loadCandidateConversationIds(prisma, loaded.productIds, loaded.leadIds);
  const readable = await selectReadableClientConversationIds(
    prisma,
    employeeId,
    clientReadScope,
    candidates,
  );
  return toScopeResult(input, loaded.label, readable);
}

async function loadPortfolioScope(
  prisma: PrismaLike,
  input: PortfolioClientScopeInput,
): Promise<{ label: string; productIds: string[]; leadIds: string[] }> {
  if (input.scope === 'contact') return loadContactScope(prisma, input.entityId);
  return loadCompanyScope(prisma, input.entityId);
}

async function loadContactScope(prisma: PrismaLike, contactId: string) {
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, trashedAt: null },
    select: {
      firstName: true,
      lastName: true,
      leads: { select: { id: true } },
    },
  });
  if (!contact) throw new NotFoundException('Portfolio contact was not found');
  const products = await prisma.product.findMany({
    where: {
      project: { trashedAt: null },
      OR: [{ contactId }, { additionalContacts: { some: { contactId } } }],
    },
    select: { id: true },
  });
  return {
    label: contactLabel(contact.firstName, contact.lastName),
    productIds: products.map((row) => row.id),
    leadIds: contact.leads.map((lead) => lead.id),
  };
}

async function loadCompanyScope(prisma: PrismaLike, companyId: string) {
  const company = await prisma.company.findFirst({
    where: { id: companyId, trashedAt: null },
    select: { name: true },
  });
  if (!company) throw new NotFoundException('Portfolio company was not found');
  const products = await prisma.product.findMany({
    where: {
      project: { trashedAt: null },
      OR: [{ companyId }, { project: { companyId } }],
    },
    select: { id: true },
  });
  return {
    label: company.name.trim() || 'Company',
    productIds: products.map((row) => row.id),
    leadIds: [],
  };
}

async function loadCandidateConversationIds(
  prisma: PrismaLike,
  productIds: string[],
  leadIds: string[],
): Promise<string[]> {
  const [bindings, productLinks, leadLinks] = await Promise.all([
    loadBindingConversationIds(prisma, productIds),
    loadLinkConversationIds(prisma, 'PRODUCT', productIds),
    loadLinkConversationIds(prisma, 'LEAD', leadIds),
  ]);
  return distinctIds([...bindings, ...productLinks, ...leadLinks]);
}

async function loadBindingConversationIds(
  prisma: PrismaLike,
  productIds: string[],
): Promise<string[]> {
  if (productIds.length === 0) return [];
  const rows = await prisma.productCommunicationBinding.findMany({
    where: { productId: { in: productIds }, status: 'ACTIVE', conversation: CLIENT_CONVERSATION },
    select: { conversationId: true },
  });
  return rows.map((row) => row.conversationId);
}

async function loadLinkConversationIds(
  prisma: PrismaLike,
  entityType: 'PRODUCT' | 'LEAD',
  entityIds: string[],
): Promise<string[]> {
  if (entityIds.length === 0) return [];
  const rows = await prisma.messengerConversationLink.findMany({
    where: { entityType, entityId: { in: entityIds }, conversation: CLIENT_CONVERSATION },
    select: { conversationId: true },
  });
  return rows.map((row) => row.conversationId);
}

function toScopeResult(
  input: PortfolioClientScopeInput,
  label: string,
  readable: string[],
): PortfolioClientScopeResult {
  return {
    scope: input.scope,
    entityId: input.entityId,
    label,
    conversationIds: readable.slice(0, PORTFOLIO_CLIENT_SCOPE_CONVERSATION_CAP),
    uniqueConversationId: readable.length === 1 ? readable[0] : null,
  };
}

function contactLabel(firstName: string, lastName: string): string {
  const name = `${firstName} ${lastName}`.trim();
  return name || 'Contact';
}

function distinctIds(ids: string[]): string[] {
  return [...new Set(ids)];
}
