import { api } from '../api';
import type { PlannedBonusAccrualApplyResult } from '@/lib/api/marketing-bonus-accrual';

export interface SupportBonusAccrualPreviewRow {
  employeeId: string;
  firstName: string;
  lastName: string;
  slaMetCount: number;
  suggestedAmount: string;
}

export interface SupportBonusAccrualPreview {
  payrollMonth: string;
  ratesConfigured: boolean;
  amountPerSlaResolved: string;
  rows: SupportBonusAccrualPreviewRow[];
  totals: {
    slaMetCount: number;
    suggestedAmount: string;
  };
  note: string;
}

export const supportBonusAccrualApi = {
  async preview(payrollMonth: string): Promise<SupportBonusAccrualPreview> {
    const resp = await api.get<SupportBonusAccrualPreview>('/api/bonus/support-accrual/preview', {
      params: { payrollMonth },
    });
    return resp.data;
  },

  async apply(payrollMonth: string): Promise<PlannedBonusAccrualApplyResult> {
    const resp = await api.post<PlannedBonusAccrualApplyResult>(
      '/api/bonus/support-accrual/apply',
      {
        payrollMonth,
      },
    );
    return resp.data;
  },
};
