import { type Prisma } from '@nbos/database';
import {
  AttributionOption,
  MarketingAccountQuery,
  MarketingActivityQuery,
} from './marketing.types';

const ORGANIC_SOCIAL_CHANNELS = new Set(['SMM', 'META_ADS']);

export function buildAccountWhere(query: MarketingAccountQuery): Prisma.MarketingAccountWhereInput {
  const where: Prisma.MarketingAccountWhereInput = {};
  if (query.channel) where.channel = normalizeChannel(query.channel);
  if (query.status) where.status = query.status as Prisma.MarketingAccountWhereInput['status'];
  if (query.search) where.OR = [{ name: { contains: query.search, mode: 'insensitive' } }];
  return where;
}

export function buildActivityWhere(
  query: MarketingActivityQuery,
): Prisma.MarketingActivityWhereInput {
  const where: Prisma.MarketingActivityWhereInput = {};
  if (query.channel) where.channel = normalizeChannel(query.channel);
  if (query.status) where.status = query.status as Prisma.MarketingActivityWhereInput['status'];
  if (query.accountId) where.accountId = query.accountId;
  if (query.search) where.OR = [{ title: { contains: query.search, mode: 'insensitive' } }];
  return where;
}

export function toAccountCreateInput(
  data: PrismaMarketingAccountCreateData,
): Prisma.MarketingAccountCreateInput {
  return {
    channel: normalizeChannel(data.channel),
    name: data.name.trim(),
    identifier: data.identifier,
    phone: data.phone,
    status: (data.status as Prisma.MarketingAccountCreateInput['status']) ?? 'ACTIVE',
    financeExpensePlanId: data.financeExpensePlanId,
    defaultCost: data.defaultCost,
    notes: data.notes,
    ...(data.ownerId && { owner: { connect: { id: data.ownerId } } }),
  };
}

export function toAccountUpdateInput(
  data: PrismaMarketingAccountUpdateData,
): Prisma.MarketingAccountUpdateInput {
  return {
    ...(data.channel && { channel: normalizeChannel(data.channel) }),
    ...(data.name !== undefined && { name: data.name.trim() }),
    ...(data.identifier !== undefined && { identifier: data.identifier }),
    ...(data.phone !== undefined && { phone: data.phone }),
    ...(data.status && { status: data.status as Prisma.MarketingAccountUpdateInput['status'] }),
    ...(data.financeExpensePlanId !== undefined && {
      financeExpensePlanId: data.financeExpensePlanId,
    }),
    ...(data.defaultCost !== undefined && { defaultCost: data.defaultCost }),
    ...(data.ownerId !== undefined && {
      owner: data.ownerId ? { connect: { id: data.ownerId } } : { disconnect: true },
    }),
    ...(data.notes !== undefined && { notes: data.notes }),
  };
}

export function toActivityCreateInput(
  data: PrismaMarketingActivityCreateData,
): Prisma.MarketingActivityCreateInput {
  return {
    title: data.title.trim(),
    channel: normalizeChannel(data.channel),
    type: data.type as Prisma.MarketingActivityCreateInput['type'],
    status: (data.status as Prisma.MarketingActivityCreateInput['status']) ?? 'IDEA',
    description: data.description,
    budget: data.budget,
    currency: data.currency ?? 'AMD',
    startDate: parseDate(data.startDate),
    endDate: parseDate(data.endDate),
    expectedPayAt: parseDate(data.expectedPayAt),
    expenseCardId: data.expenseCardId,
    expensePlanId: data.expensePlanId,
    notes: data.notes,
    ...(data.accountId && { account: { connect: { id: data.accountId } } }),
    ...(data.ownerId && { owner: { connect: { id: data.ownerId } } }),
  };
}

export function toActivityUpdateInput(
  data: PrismaMarketingActivityUpdateData,
): Prisma.MarketingActivityUpdateInput {
  return {
    ...(data.title !== undefined && { title: data.title.trim() }),
    ...(data.channel && { channel: normalizeChannel(data.channel) }),
    ...(data.type && { type: data.type as Prisma.MarketingActivityUpdateInput['type'] }),
    ...(data.status && { status: data.status as Prisma.MarketingActivityUpdateInput['status'] }),
    ...(data.accountId !== undefined && {
      account: data.accountId ? { connect: { id: data.accountId } } : { disconnect: true },
    }),
    ...(data.ownerId !== undefined && {
      owner: data.ownerId ? { connect: { id: data.ownerId } } : { disconnect: true },
    }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.budget !== undefined && { budget: data.budget }),
    ...(data.currency !== undefined && { currency: data.currency }),
    ...(data.startDate !== undefined && { startDate: parseDate(data.startDate) }),
    ...(data.endDate !== undefined && { endDate: parseDate(data.endDate) }),
    ...(data.expectedPayAt !== undefined && { expectedPayAt: parseDate(data.expectedPayAt) }),
    ...(data.expenseCardId !== undefined && { expenseCardId: data.expenseCardId }),
    ...(data.expensePlanId !== undefined && { expensePlanId: data.expensePlanId }),
    ...(data.notes !== undefined && { notes: data.notes }),
  };
}

export function normalizeChannel(channel: string): Prisma.MarketingAccountCreateInput['channel'] {
  return channel.toUpperCase() as Prisma.MarketingAccountCreateInput['channel'];
}

export function toAccountOptions(
  accounts: Array<{ id: string; name: string; channel: string; phone: string | null }>,
): AttributionOption[] {
  return accounts.map((account) => ({
    id: account.id,
    label: account.name,
    type: 'ACCOUNT',
    channel: account.channel,
    subtitle: account.phone ?? undefined,
  }));
}

export function toActivityOptions(
  activities: Array<{ id: string; title: string; channel: string; status: string }>,
): AttributionOption[] {
  return activities.map((activity) => ({
    id: activity.id,
    label: activity.title,
    type: 'ACTIVITY',
    channel: activity.channel,
    subtitle: activity.status,
  }));
}

export function organic(channel: string): AttributionOption[] {
  if (!ORGANIC_SOCIAL_CHANNELS.has(channel)) return [];
  return [{ id: `organic:${channel}`, label: 'Organic / Not from ad', type: 'ORGANIC', channel }];
}

export function leadAttributionIssueWhere(): Prisma.LeadWhereInput[] {
  return [
    { source: 'MARKETING' as const, sourceDetail: null },
    {
      source: 'MARKETING' as const,
      sourceDetail: { in: ['LIST_AM', 'GOOGLE_ADS', 'META_ADS'] },
      marketingAccountId: null,
      marketingActivityId: null,
    },
    { source: 'PARTNER' as const, sourcePartnerId: null },
    { source: 'CLIENT' as const, sourceContactId: null },
  ];
}

export function dealAttributionIssueWhere(): Prisma.DealWhereInput[] {
  return [
    { source: null },
    { source: 'MARKETING' as const, sourceDetail: null },
    {
      source: 'MARKETING' as const,
      sourceDetail: { in: ['LIST_AM', 'GOOGLE_ADS', 'META_ADS'] },
      marketingAccountId: null,
      marketingActivityId: null,
    },
    { source: 'PARTNER' as const, sourcePartnerId: null },
    { source: 'CLIENT' as const, sourceContactId: null },
  ];
}

function parseDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  return value ? new Date(value) : null;
}

interface PrismaMarketingAccountCreateData {
  channel: string;
  name: string;
  identifier?: string | null;
  phone?: string | null;
  status?: string;
  financeExpensePlanId?: string | null;
  defaultCost?: number | null;
  ownerId?: string | null;
  notes?: string | null;
}

type PrismaMarketingAccountUpdateData = Partial<PrismaMarketingAccountCreateData>;

interface PrismaMarketingActivityCreateData {
  title: string;
  channel: string;
  type: string;
  status?: string;
  accountId?: string | null;
  ownerId?: string | null;
  description?: string | null;
  budget?: number | null;
  currency?: string;
  startDate?: string | null;
  endDate?: string | null;
  expectedPayAt?: string | null;
  expenseCardId?: string | null;
  expensePlanId?: string | null;
  notes?: string | null;
}

type PrismaMarketingActivityUpdateData = Partial<PrismaMarketingActivityCreateData>;
