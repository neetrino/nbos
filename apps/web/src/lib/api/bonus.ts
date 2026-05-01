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
  | 'HOLDBACK'
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
  holdbackPercent: string | null;
  holdbackReleaseDate: string | null;
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

/** Matches `GET /api/bonus/projects/pools` rows (derived from bonus entries, not a separate pool ledger). */
export interface BonusProjectPoolRow {
  projectId: string;
  projectCode: string;
  projectName: string;
  entryCount: number;
  sumTotalAmount: string;
  sumPipelineAmount: string;
  sumPaidAmount: string;
  sumClawbackAmount: string;
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

export const bonusesApi = {
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

  async getProjectPools(): Promise<BonusProjectPoolRow[]> {
    const resp = await api.get<BonusProjectPoolRow[]>('/api/bonus/projects/pools');
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
