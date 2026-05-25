import { api } from '../api';
import type { ListData } from './finance-common';

/** Matches Prisma `BonusTypeEnum`. */
export type BonusType = 'SALES' | 'DELIVERY' | 'PM' | 'DESIGN' | 'MARKETING';

/** Matches Prisma `BonusStatusEnum`. */
export type BonusStatus =
  | 'INCOMING'
  | 'EARNED'
  | 'PENDING_ELIGIBILITY'
  | 'VESTED'
  | 'ACTIVE'
  | 'PAID'
  | 'CLAWBACK';

export interface BonusEmployeeRef {
  id: string;
  firstName: string;
  lastName: string;
}

export interface BonusOrderRef {
  id: string;
  code: string;
  totalAmount: string;
}

export interface BonusProjectRef {
  id: string;
  code: string;
  name: string;
}

export type SalesBonusSlot = 'SELLER' | 'ASSISTANT';

export interface BonusEntryListRow {
  id: string;
  employeeId: string;
  orderId: string;
  projectId: string;
  type: BonusType;
  amount: string;
  percent: string;
  status: BonusStatus;
  kpiGatePassed: boolean | null;
  payoutMonth: string | null;
  createdAt: string;
  updatedAt: string;
  employee: BonusEmployeeRef;
  order: BonusOrderRef;
  project: BonusProjectRef;
  /** Present for sales bonus rows; null for subscription month 2+ accrual waves. */
  salesBonusSlot?: SalesBonusSlot | null;
  /** Invoice that triggered this accrual (sales bonus idempotency / audit). */
  salesAccrualInvoiceId?: string | null;
  /** Accrual snapshot from API (payment model, basis, …). */
  calculationSnapshot?: unknown;
}

export interface BonusStatsByStatusRow {
  status: BonusStatus;
  _count: number;
  _sum: { amount: string | null };
}

export interface BonusStats {
  byStatus: BonusStatsByStatusRow[];
  totalAmount: string | null;
}

/** Matches `GET /api/bonus/products/pools` — product / extension / order roll-up (NBOS Product Bonus Pool view). */
export type BonusProductPoolKind = 'PRODUCT' | 'EXTENSION' | 'ORDER';

export interface BonusProductPoolRow {
  poolKey: string;
  poolKind: BonusProductPoolKind;
  anchorOrderId: string;
  poolName: string;
  orderCode: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  entryCount: number;
  sumTotalAmount: string;
  sumPipelineAmount: string;
  sumPaidAmount: string;
  sumClawbackAmount: string;
  ledgerPlannedAmount: string | null;
  ledgerReleasedAmount: string | null;
  ledgerRemainingAmount: string | null;
  ledgerAvailableFunding: string | null;
  ledgerOverFundingAmount: string | null;
  ledgerReceivedAmount: string | null;
  ledgerPoolStatus: string | null;
  orderIds: string[];
  orderCodes: string[];
  employeeCount: number;
  fundingFillPercent: number | null;
  fundingHealth: 'EMPTY' | 'PARTIAL' | 'READY' | 'OVER' | 'CLOSED' | 'UNKNOWN';
}

/** `GET /api/bonus/products/pools/lines?poolKey=` — per-employee pool breakdown. */
export interface BonusPoolEmployeeLine {
  employeeId: string;
  employeeName: string;
  role: string | null;
  bonusTypes: string[];
  entryCount: number;
  plannedAmount: string;
  pipelineAmount: string;
  releasedAmount: string;
  includedInPayrollAmount: string;
  paidAmount: string;
  remainingAmount: string;
  burnedAmount: string | null;
  carryOverAmount: string | null;
  suggestedReleaseAmount: string | null;
  kpiGatePassed: boolean | null;
  primaryStatus: string | null;
}

export interface BonusPoolEmployeeLinesResponse {
  poolKey: string;
  orderIds: string[];
  orderCodes: string[];
  lines: BonusPoolEmployeeLine[];
}

export type BonusPoolTimelineEventKind = 'PAYMENT_IN' | 'RELEASE_OUT';

export type BonusPoolRiskFlag =
  | 'OVER_FUNDING'
  | 'UNDERFUNDED'
  | 'KPI_NOT_PASSED'
  | 'EARLY_RELEASE'
  | 'EXTRA_BONUS'
  | 'OVER_FUNDING_RELEASE';

export interface BonusPoolTimelineEvent {
  id: string;
  kind: BonusPoolTimelineEventKind;
  occurredAt: string;
  amount: string;
  label: string;
  orderCode: string | null;
  employeeName: string | null;
  releaseType: string | null;
  releaseStatus: string | null;
  releaseReason: string | null;
  invoiceId: string | null;
  bonusEntryId: string | null;
}

export interface BonusPoolTimelineResponse {
  poolKey: string;
  orderIds: string[];
  events: BonusPoolTimelineEvent[];
  riskFlags: BonusPoolRiskFlag[];
}

/** Matches Prisma `BonusReleaseTypeEnum`. */
export type BonusReleaseType =
  | 'AUTO'
  | 'MANUAL'
  | 'EARLY'
  | 'EXTRA'
  | 'OVER_FUNDING'
  | 'CORRECTION';

/** Matches Prisma `BonusReleaseStatusEnum`. */
export type BonusReleaseStatus =
  | 'DRAFT'
  | 'APPROVED'
  | 'INCLUDED_IN_PAYROLL'
  | 'PAID'
  | 'CANCELLED';

export interface BonusReleaseRow {
  id: string;
  bonusEntryId: string;
  payrollRunId: string | null;
  employeeId: string;
  projectId: string;
  productId: string | null;
  extensionId: string | null;
  amount: string;
  releaseType: BonusReleaseType;
  reason: string | null;
  approvedById: string | null;
  status: BonusReleaseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BonusListQueryParams {
  page?: number;
  pageSize?: number;
  employeeId?: string;
  orderId?: string;
  projectId?: string;
  status?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** Server page size for bonus list fetches (board loads all pages up to `BONUS_FETCH_MAX_PAGES`). */
export const BONUS_LIST_PAGE_SIZE = 500;

const BONUS_FETCH_MAX_PAGES = 40;

const BONUS_RELEASE_LEDGER_PAGE_SIZE = 100;
const BONUS_RELEASE_LEDGER_MAX_PAGES = 50;

/** Matches `SalesBonusPaymentModelEnum` (sales bonus policy rows). */
export type SalesBonusPaymentModel =
  | 'CLASSIC'
  | 'SUBSCRIPTION_FIRST_MONTH'
  | 'SUBSCRIPTION_RECURRING';

/** Row from `GET /api/bonus/sales-policies`. Decimal fields arrive as strings in JSON. */
export interface SalesBonusPolicyRow {
  id: string;
  fromCategory: string;
  paymentModel: SalesBonusPaymentModel;
  sellerPercent: string;
  assistantPercent: string;
  effectiveFrom: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatchSalesBonusPolicyBody {
  sellerPercent?: number;
  assistantPercent?: number;
  isActive?: boolean;
}

export interface CreateBonusEntryPayload {
  employeeId: string;
  orderId: string;
  projectId: string;
  type: BonusType;
  amount: number;
  percent: number;
  status?: BonusStatus;
  payoutMonth?: string;
}

export const bonusesApi = {
  async getSalesPolicies(): Promise<SalesBonusPolicyRow[]> {
    const resp = await api.get<SalesBonusPolicyRow[]>('/api/bonus/sales-policies');
    return resp.data;
  },

  async patchSalesPolicy(
    id: string,
    body: PatchSalesBonusPolicyBody,
  ): Promise<SalesBonusPolicyRow> {
    const resp = await api.patch<SalesBonusPolicyRow>(`/api/bonus/sales-policies/${id}`, body);
    return resp.data;
  },

  async create(payload: CreateBonusEntryPayload): Promise<BonusEntryListRow> {
    const resp = await api.post<BonusEntryListRow>('/api/bonus', payload);
    return resp.data;
  },

  async getPage(params?: BonusListQueryParams): Promise<ListData<BonusEntryListRow>> {
    const resp = await api.get<ListData<BonusEntryListRow>>('/api/bonus', {
      params: {
        pageSize: BONUS_LIST_PAGE_SIZE,
        ...params,
      },
    });
    return resp.data;
  },

  async getById(id: string): Promise<BonusEntryListRow> {
    const resp = await api.get<BonusEntryListRow>(`/api/bonus/${id}`);
    return resp.data;
  },

  async getStats(): Promise<BonusStats> {
    const resp = await api.get<BonusStats>('/api/bonus/stats');
    return resp.data;
  },

  async getProductPools(): Promise<BonusProductPoolRow[]> {
    const resp = await api.get<BonusProductPoolRow[]>('/api/bonus/products/pools');
    return resp.data;
  },

  async getProductPoolEmployeeLines(poolKey: string): Promise<BonusPoolEmployeeLinesResponse> {
    const resp = await api.get<BonusPoolEmployeeLinesResponse>('/api/bonus/products/pools/lines', {
      params: { poolKey },
    });
    return resp.data;
  },

  async getProductPoolEmployeeLinesBatch(
    poolKeys: string,
  ): Promise<{ items: { poolKey: string; lines: BonusPoolEmployeeLine[] }[] }> {
    const resp = await api.get<{ items: { poolKey: string; lines: BonusPoolEmployeeLine[] }[] }>(
      '/api/bonus/products/pools/lines/batch',
      { params: { poolKeys } },
    );
    return resp.data;
  },

  async getProductPoolTimeline(poolKey: string): Promise<BonusPoolTimelineResponse> {
    const resp = await api.get<BonusPoolTimelineResponse>('/api/bonus/products/pools/timeline', {
      params: { poolKey },
    });
    return resp.data;
  },

  async triggerProductPoolAutoRelease(poolKey: string): Promise<{
    poolKey: string;
    orderIds: string[];
    ordersProcessed: number;
    releasesCreated: boolean;
  }> {
    const resp = await api.post<{
      poolKey: string;
      orderIds: string[];
      ordersProcessed: number;
      releasesCreated: boolean;
    }>('/api/bonus/products/pools/auto-release', {}, { params: { poolKey } });
    return resp.data;
  },

  async listReleasesForEntryPage(
    entryId: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<ListData<BonusReleaseRow>> {
    const resp = await api.get<ListData<BonusReleaseRow>>(
      `/api/bonus/entries/${entryId}/releases`,
      {
        params: {
          page: params?.page ?? 1,
          pageSize: params?.pageSize ?? 50,
        },
      },
    );
    return resp.data;
  },

  /** Loads every release row for finance ledger flows (walks pages). */
  async listReleasesForEntry(entryId: string): Promise<BonusReleaseRow[]> {
    const combined: BonusReleaseRow[] = [];
    for (let page = 1; page <= BONUS_RELEASE_LEDGER_MAX_PAGES; page += 1) {
      const { items, meta } = await bonusesApi.listReleasesForEntryPage(entryId, {
        page,
        pageSize: BONUS_RELEASE_LEDGER_PAGE_SIZE,
      });
      combined.push(...items);
      if (page >= meta.totalPages || items.length === 0) {
        break;
      }
    }
    return combined;
  },

  async patchRelease(
    entryId: string,
    releaseId: string,
    body: { amount: number; reason: string; approvedById?: string },
  ): Promise<BonusReleaseRow> {
    const resp = await api.patch<BonusReleaseRow>(
      `/api/bonus/entries/${entryId}/releases/${releaseId}`,
      body,
    );
    return resp.data;
  },
};

/**
 * Loads all bonus rows for kanban-style boards by walking list pages until exhausted.
 * Optional `projectId` is forwarded to each page request (server filter).
 */
export async function fetchAllBonusListRows(options?: {
  /** When set, each list page is requested with this server filter (aligned with `GET /api/bonus`). */
  projectId?: string;
  orderId?: string;
}): Promise<BonusEntryListRow[]> {
  const projectId = options?.projectId?.trim();
  const orderId = options?.orderId?.trim();
  const listParams: BonusListQueryParams = {
    ...(projectId ? { projectId } : {}),
    ...(orderId ? { orderId } : {}),
  };
  const combined: BonusEntryListRow[] = [];
  for (let page = 1; page <= BONUS_FETCH_MAX_PAGES; page += 1) {
    const { items, meta } = await bonusesApi.getPage({
      page,
      pageSize: BONUS_LIST_PAGE_SIZE,
      ...listParams,
    });
    combined.push(...items);
    if (page >= meta.totalPages || items.length === 0) {
      break;
    }
  }
  return combined;
}
