import { z } from 'zod';
import {
  LEAD_STATUSES,
  LEAD_SOURCES,
  DEAL_STATUSES,
  DEAL_TYPES,
  MARKETING_ACCOUNT_STATUSES,
  MARKETING_ACTIVITY_STATUSES,
  MARKETING_ACTIVITY_TYPES,
  MARKETING_CHANNELS,
  PAYMENT_TYPES,
} from '../constants';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const searchSchema = z.object({
  query: z.string().min(1).max(200),
});

export const createLeadSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  contactName: z.string().min(1).max(200),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(200).optional(),
  source: z.enum(LEAD_SOURCES),
  sourceDetail: z.string().max(100).optional(),
  sourcePartnerId: z.string().uuid().optional(),
  sourceContactId: z.string().uuid().optional(),
  marketingAccountId: z.string().uuid().optional(),
  marketingActivityId: z.string().uuid().optional(),
  offerSentAt: z.string().datetime().optional(),
  offerLink: z.string().url().max(500).optional(),
  offerFileUrl: z.string().url().max(500).optional(),
  offerScreenshotUrl: z.string().url().max(500).optional(),
  responseDueAt: z.string().datetime().optional(),
  contractSignedAt: z.string().datetime().optional(),
  contractFileUrl: z.string().url().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateLeadSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  contactName: z.string().min(1).max(200).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(200).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  sourceDetail: z.string().max(100).nullable().optional(),
  sourcePartnerId: z.string().uuid().nullable().optional(),
  sourceContactId: z.string().uuid().nullable().optional(),
  marketingAccountId: z.string().uuid().nullable().optional(),
  marketingActivityId: z.string().uuid().nullable().optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  assignedTo: z.string().uuid().optional(),
  notes: z.string().max(2000).optional(),
});

export const createDealSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  leadId: z.string().uuid().optional(),
  contactId: z.string().uuid(),
  type: z.enum(DEAL_TYPES),
  amount: z.number().positive().optional(),
  paymentType: z.enum(PAYMENT_TYPES).optional(),
  sellerId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  sourceDetail: z.string().max(100).optional(),
  sourcePartnerId: z.string().uuid().optional(),
  sourceContactId: z.string().uuid().optional(),
  marketingAccountId: z.string().uuid().optional(),
  marketingActivityId: z.string().uuid().optional(),
  maintenanceStartAt: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
});

export const updateDealSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: z.enum(DEAL_STATUSES).optional(),
  amount: z.number().positive().optional(),
  paymentType: z.enum(PAYMENT_TYPES).optional(),
  source: z.enum(LEAD_SOURCES).nullable().optional(),
  sourceDetail: z.string().max(100).nullable().optional(),
  sourcePartnerId: z.string().uuid().nullable().optional(),
  sourceContactId: z.string().uuid().nullable().optional(),
  marketingAccountId: z.string().uuid().nullable().optional(),
  marketingActivityId: z.string().uuid().nullable().optional(),
  offerSentAt: z.string().datetime().nullable().optional(),
  offerLink: z.string().url().max(500).nullable().optional(),
  offerFileUrl: z.string().url().max(500).nullable().optional(),
  offerScreenshotUrl: z.string().url().max(500).nullable().optional(),
  responseDueAt: z.string().datetime().nullable().optional(),
  contractSignedAt: z.string().datetime().nullable().optional(),
  contractFileUrl: z.string().url().max(500).nullable().optional(),
  maintenanceStartAt: z.string().datetime().nullable().optional(),
  notes: z.string().max(2000).optional(),
});

export const createMarketingAccountSchema = z.object({
  channel: z.enum(MARKETING_CHANNELS),
  name: z.string().min(1).max(200),
  identifier: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  status: z.enum(MARKETING_ACCOUNT_STATUSES).optional(),
  financeExpensePlanId: z.string().uuid().optional(),
  defaultCost: z.number().nonnegative().optional(),
  ownerId: z.string().uuid().optional(),
  notes: z.string().max(2000).optional(),
});

export const updateMarketingAccountSchema = createMarketingAccountSchema.partial();

export const createMarketingActivitySchema = z.object({
  title: z.string().min(1).max(200),
  channel: z.enum(MARKETING_CHANNELS),
  type: z.enum(MARKETING_ACTIVITY_TYPES),
  status: z.enum(MARKETING_ACTIVITY_STATUSES).optional(),
  accountId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  description: z.string().max(2000).optional(),
  budget: z.number().nonnegative().optional(),
  currency: z.string().min(3).max(3).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  expectedPayAt: z.string().datetime().optional(),
  expenseCardId: z.string().uuid().optional(),
  expensePlanId: z.string().uuid().optional(),
  notes: z.string().max(2000).optional(),
});

export const updateMarketingActivitySchema = createMarketingActivitySchema.partial();

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type CreateMarketingAccountInput = z.infer<typeof createMarketingAccountSchema>;
export type UpdateMarketingAccountInput = z.infer<typeof updateMarketingAccountSchema>;
export type CreateMarketingActivityInput = z.infer<typeof createMarketingActivitySchema>;
export type UpdateMarketingActivityInput = z.infer<typeof updateMarketingActivitySchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
