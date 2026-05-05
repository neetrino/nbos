import { api } from '../api';
import type { ListData } from './finance-common';

/** Resolved contact when `partner.contactId` points to a row in `contacts`. */
export interface PartnerContactSummary {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Partner {
  id: string;
  name: string;
  /** Partner tier (Prisma `Partner.type`): REGULAR | PREMIUM. */
  level: string;
  direction: string;
  defaultPercent: string;
  status: string;
  contactId: string | null;
  createdAt: string;
  updatedAt: string;
  contact?: PartnerContactSummary | null;
  _count?: { orders: number; subscriptions: number };
}

export interface PartnerStats {
  total: number;
  totalSubscriptions: number;
  avgPayoutPercent: number;
}

export type PartnerCommissionDealType = 'PRODUCT' | 'EXTENSION' | 'MAINTENANCE' | 'OUTSOURCE';

export interface PartnerCommissionPolicyRow {
  dealType: PartnerCommissionDealType;
  /** Null → use `fallbackPercent` (partner default). */
  percent: string | null;
}

export interface PartnerCommissionPolicy {
  partnerId: string;
  fallbackPercent: string;
  rows: PartnerCommissionPolicyRow[];
}

export interface PutPartnerCommissionPolicyBody {
  rows: Array<{ dealType: PartnerCommissionDealType; percent: number | null }>;
}

/** `GET /api/partners/:id/balance` — sums by `PartnerAccrual.status`. */
export interface PartnerAccrualBalance {
  byStatus: {
    ACCRUED: string;
    ELIGIBLE: string;
    IN_BATCH: string;
    PAID: string;
    CANCELLED: string;
  };
  unpaidTotal: string;
  paidTotal: string;
}

/** Row from `GET /api/partners/:id/accruals` (inbound referral accruals). */
export interface PartnerAccrualListItem {
  id: string;
  orderId: string;
  projectId: string;
  productId: string | null;
  subscriptionId: string | null;
  paymentId: string;
  invoiceId: string | null;
  dealType: string;
  paymentType: string;
  baseAmount: string;
  percent: string;
  amount: string;
  status: string;
  eligibleAt: string | null;
  createdAt: string;
}

/** `GET /api/partners/:id/payout-batches` row. */
export interface PartnerPayoutBatch {
  id: string;
  partnerId: string;
  totalAmount: string;
  status: 'DRAFT' | 'APPROVED' | 'EXPENSE_CREATED' | 'PAID' | 'CANCELLED';
  payoutDate: string | null;
  expenseId: string | null;
  approvedBy: string | null;
  notes: string | null;
  accrualCount: number;
  createdAt: string;
}

export interface CreatePartnerPayoutBatchPayload {
  accrualIds: string[];
  payoutDate?: string;
  notes?: string;
}

export interface ApprovePartnerPayoutBatchPayload {
  payoutDate?: string;
  approvedBy?: string;
  notes?: string;
}

export interface PartnerListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  level?: string;
  /** @deprecated Prefer `level`. */
  type?: string;
  direction?: string;
}

export interface CreatePartnerPayload {
  name: string;
  level?: string;
  /** @deprecated Prefer `level`. */
  type?: string;
  direction?: string;
  defaultPercent?: number;
  status?: string;
  contactId?: string;
}

export interface UpdatePartnerPayload {
  name?: string;
  level?: string;
  /** @deprecated Prefer `level`. */
  type?: string;
  direction?: string;
  defaultPercent?: number;
  status?: string;
  contactId?: string | null;
}

export const partnersApi = {
  async getAll(params?: PartnerListParams): Promise<ListData<Partner>> {
    const resp = await api.get<ListData<Partner>>('/api/partners', { params });
    return resp.data;
  },
  async getById(id: string): Promise<Partner> {
    const resp = await api.get<Partner>(`/api/partners/${id}`);
    return resp.data;
  },
  async create(data: CreatePartnerPayload): Promise<Partner> {
    const resp = await api.post<Partner>('/api/partners', data);
    return resp.data;
  },
  async update(id: string, data: UpdatePartnerPayload): Promise<Partner> {
    const resp = await api.put<Partner>(`/api/partners/${id}`, data);
    return resp.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/api/partners/${id}`);
  },
  async getStats(): Promise<PartnerStats> {
    const resp = await api.get<PartnerStats>('/api/partners/stats');
    return resp.data;
  },

  async getCommissionPolicy(partnerId: string): Promise<PartnerCommissionPolicy> {
    const resp = await api.get<PartnerCommissionPolicy>(
      `/api/partners/${partnerId}/commission-policy`,
    );
    return resp.data;
  },

  async putCommissionPolicy(
    partnerId: string,
    body: PutPartnerCommissionPolicyBody,
  ): Promise<PartnerCommissionPolicy> {
    const resp = await api.put<PartnerCommissionPolicy>(
      `/api/partners/${partnerId}/commission-policy`,
      body,
    );
    return resp.data;
  },

  async listAccruals(partnerId: string): Promise<PartnerAccrualListItem[]> {
    const resp = await api.get<PartnerAccrualListItem[]>(`/api/partners/${partnerId}/accruals`);
    return resp.data;
  },

  async getAccrualBalance(partnerId: string): Promise<PartnerAccrualBalance> {
    const resp = await api.get<PartnerAccrualBalance>(`/api/partners/${partnerId}/balance`);
    return resp.data;
  },

  async listPayoutBatches(partnerId: string): Promise<PartnerPayoutBatch[]> {
    const resp = await api.get<PartnerPayoutBatch[]>(`/api/partners/${partnerId}/payout-batches`);
    return resp.data;
  },

  async createPayoutBatch(
    partnerId: string,
    body: CreatePartnerPayoutBatchPayload,
  ): Promise<PartnerPayoutBatch> {
    const resp = await api.post<PartnerPayoutBatch>(
      `/api/partners/${partnerId}/payout-batches`,
      body,
    );
    return resp.data;
  },

  async approvePayoutBatch(
    partnerId: string,
    batchId: string,
    body: ApprovePartnerPayoutBatchPayload = {},
  ): Promise<PartnerPayoutBatch> {
    const resp = await api.post<PartnerPayoutBatch>(
      `/api/partners/${partnerId}/payout-batches/${batchId}/approve`,
      body,
    );
    return resp.data;
  },
};
