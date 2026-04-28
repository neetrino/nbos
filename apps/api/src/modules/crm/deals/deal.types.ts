export interface CreateDealDto {
  name?: string;
  leadId?: string;
  contactId: string;
  type: string;
  amount?: number;
  paymentType?: string;
  taxStatus?: string;
  companyId?: string | null;
  sellerId: string;
  projectId?: string;
  source?: string;
  sourceDetail?: string | null;
  sourcePartnerId?: string | null;
  sourceContactId?: string | null;
  marketingAccountId?: string | null;
  marketingActivityId?: string | null;
  notes?: string;
  productCategory?: string | null;
  productType?: string | null;
  pmId?: string | null;
  deadline?: string | null;
  existingProductId?: string | null;
  offerSentAt?: string | null;
  offerLink?: string | null;
  offerFileUrl?: string | null;
  offerScreenshotUrl?: string | null;
  responseDueAt?: string | null;
  contractSignedAt?: string | null;
  contractFileUrl?: string | null;
  maintenanceStartAt?: string | null;
}

export interface UpdateDealDto extends Partial<Omit<CreateDealDto, 'projectId'>> {
  status?: string;
  contactId?: string;
  projectId?: string | null;
}

export interface DealQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  type?: string;
  sellerId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DealHandoffReferences {
  project: { id: string; code: string; name: string } | null;
  product: { id: string; name: string; productType: string; status?: string } | null;
  subscriptions: Array<{
    id: string;
    code: string;
    type: string;
    status: string;
    amount: unknown;
  }>;
  maintenanceDeal: {
    id: string;
    code: string;
    name: string | null;
    status: string;
    amount: unknown;
    maintenanceStartAt: Date | null;
  } | null;
}

export interface DealForHandoff {
  id: string;
  type: string;
  projectId: string | null;
  existingProduct?: { id: string; name: string; productType: string; status?: string } | null;
}
