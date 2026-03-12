import { z } from 'zod';
import {
  LEAD_STATUSES,
  LEAD_SOURCES,
  DEAL_STATUSES,
  DEAL_TYPES,
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
  notes: z.string().max(2000).optional(),
});

export const updateLeadSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  contactName: z.string().min(1).max(200).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(200).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
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
  notes: z.string().max(2000).optional(),
});

export const updateDealSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: z.enum(DEAL_STATUSES).optional(),
  amount: z.number().positive().optional(),
  paymentType: z.enum(PAYMENT_TYPES).optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
