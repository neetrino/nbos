import { api } from '../api';
import type { ListData } from './finance-common';

export interface FinancePostingPeriod {
  id: string;
  monthKey: string;
  status: 'OPEN' | 'CLOSED';
  startsAt: string;
  endsAt: string;
  closedAt: string | null;
  _count: { journalEntries: number };
}

export interface OperationalJournalEntry {
  id: string;
  amount: string;
  functionalAmount: string;
  currency: string;
  bookedAt: string;
  recognitionBasis: string;
  sourceType: string;
  sourceId: string;
  description: string | null;
  postingPeriod: { monthKey: string; status: string };
}

export interface ManualAdjustmentPayload {
  amount: number;
  bookedAt: string;
  description: string;
  recognitionBasis?: 'CASH' | 'ACCRUAL';
  projectId?: string | null;
}

export interface JournalEntriesParams {
  page?: number;
  pageSize?: number;
  monthKey?: string;
  sourceType?: string;
}

export const financeJournalApi = {
  async listPeriods(): Promise<FinancePostingPeriod[]> {
    const resp = await api.get<FinancePostingPeriod[]>('/api/finance/journal/periods');
    return resp.data;
  },

  async closePeriod(monthKey: string): Promise<FinancePostingPeriod> {
    const resp = await api.post<FinancePostingPeriod>(
      `/api/finance/journal/periods/${monthKey}/close`,
    );
    return resp.data;
  },

  async listEntries(params?: JournalEntriesParams): Promise<ListData<OperationalJournalEntry>> {
    const resp = await api.get<ListData<OperationalJournalEntry>>('/api/finance/journal/entries', {
      params,
    });
    return resp.data;
  },

  async createAdjustment(payload: ManualAdjustmentPayload): Promise<OperationalJournalEntry> {
    const resp = await api.post<OperationalJournalEntry>(
      '/api/finance/journal/adjustments',
      payload,
    );
    return resp.data;
  },
};
