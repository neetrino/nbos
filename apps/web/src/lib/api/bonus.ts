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
  ledgerPoolStatus: string | null;
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

/** Matches `SalesBonusPaymentModelEnum` (sales bonus policy rows). */
export type SalesBonusPaymentModel = 'CLASSIC' | 'SUBSCRIPTION_FIRST_MONTH';

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

  async getPage(params?: BonusListQueryParams): Promise<ListData<BonusEntryListRow>> {
    const resp = await api.get<ListData<BonusEntryListRow>>('/api/bonus', {
      params: {
        pageSize: BONUS_LIST_PAGE_SIZE,
        ...params,
      },
    });
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

  async listReleasesForEntry(entryId: string): Promise<BonusReleaseRow[]> {
    const resp = await api.get<BonusReleaseRow[]>(`/api/bonus/entries/${entryId}/releases`);
    return resp.data;
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
}): Promise<BonusEntryListRow[]> {
  const projectId = options?.projectId?.trim();
  const listParams: BonusListQueryParams = projectId ? { projectId } : {};
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
