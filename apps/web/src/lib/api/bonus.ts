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
};

/**
 * Loads all bonus rows for kanban-style boards by walking list pages until exhausted.
 */
export async function fetchAllBonusListRows(): Promise<BonusEntryListRow[]> {
  const combined: BonusEntryListRow[] = [];
  for (let page = 1; page <= BONUS_FETCH_MAX_PAGES; page += 1) {
    const { items, meta } = await bonusesApi.getPage({ page, pageSize: BONUS_LIST_PAGE_SIZE });
    combined.push(...items);
    if (page >= meta.totalPages || items.length === 0) {
      break;
    }
  }
  return combined;
}
