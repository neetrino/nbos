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
  startDate?: string | null;
  renewalDate?: string | null;
  notes?: string | null;
}

export type UpdateClientServiceRecordBody = Partial<ClientServiceRecordBody>;
