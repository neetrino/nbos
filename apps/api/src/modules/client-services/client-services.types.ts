import type { FinanceScopedAccessContext } from '../finance/finance-scoped-access';
import type { ClientServiceNestedVisibility } from './client-service-nested-visibility';

export interface ClientServiceRecordQueryParams {
  page?: number;
  pageSize?: number;
  projectId?: string;
  productId?: string;
  type?: string;
  status?: string;
  billingModel?: string;
  search?: string;
  renewalFrom?: string;
  renewalTo?: string;
  stage?: string;
  year?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  access?: FinanceScopedAccessContext;
}

export interface ClientServiceWriteOptions {
  access?: FinanceScopedAccessContext;
  nested?: ClientServiceNestedVisibility;
}

export interface ClientServiceRecordBody {
  projectId: string;
  productId?: string | null;
  type: string;
  name: string;
  provider?: string | null;
  providerAccountId?: string | null;
  status?: string;
  billingModel?: string;
  pricingModel?: string;
  frequency?: string;
  ourCost?: number | null;
  clientCharge?: number | null;
  taxStatus?: string;
  notificationsEnabled?: boolean;
  reminderLanguage?: string;
  startDate?: string | null;
  renewalDate?: string | null;
  notes?: string | null;
  connectionMode?: string | null;
  dnsInstructions?: string | null;
  connectionVerifiedAt?: string | null;
}

export type UpdateClientServiceRecordBody = Partial<ClientServiceRecordBody>;
