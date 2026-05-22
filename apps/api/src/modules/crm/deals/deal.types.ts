export interface CreateDealDto {
  name?: string;
  leadId?: string;
  /** Optional at create; required before DISCUSS_NEEDS (stage gate). From lead when leadId is set. */
  contactId?: string;
  type?: string;
  amount?: number;
  paymentType?: string;
  taxStatus?: string;
  companyId?: string | null;
  /** Defaults to the authenticated employee when omitted. */
  sellerId?: string;
  sellerAssistantId?: string | null;
  projectId?: string;
  source?: string | null;
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
  contractSignedAt?: string | null;
  contractFileUrl?: string | null;
  maintenanceStartAt?: string | null;
}

export interface UpdateDealDto extends Partial<Omit<CreateDealDto, 'projectId'>> {
  status?: string;
  contactId?: string;
  projectId?: string | null;
  /** Replaces linked additional contacts (excludes primary `contactId`). */
  additionalContactIds?: string[];
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
  type: string | null;
  projectId: string | null;
  existingProduct?: { id: string; name: string; productType: string; status?: string } | null;
}
