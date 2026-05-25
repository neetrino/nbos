import { api } from '../api';

export interface MarketingBonusAccrualPreviewRow {
  employeeId: string;
  firstName: string;
  lastName: string;
  mqlCount: number;
  sqlCount: number;
  suggestedAmount: string;
}

export interface MarketingBonusAccrualPreview {
  payrollMonth: string;
  ratesConfigured: boolean;
  amountPerSql: string;
  amountPerMql: string;
  rows: MarketingBonusAccrualPreviewRow[];
  totals: {
    mqlCount: number;
    sqlCount: number;
    suggestedAmount: string;
  };
  note: string;
}

export interface PlannedBonusAccrualApplyResult {
  payrollMonth: string;
  anchor: { projectId: string; orderId: string; projectCode: string; orderCode: string };
  created: number;
  skipped: number;
  skippedEmployeeIds: string[];
}

export const marketingBonusAccrualApi = {
  async preview(payrollMonth: string): Promise<MarketingBonusAccrualPreview> {
    const resp = await api.get<MarketingBonusAccrualPreview>(
      '/api/bonus/marketing-accrual/preview',
      { params: { payrollMonth } },
    );
    return resp.data;
  },

  async apply(payrollMonth: string): Promise<PlannedBonusAccrualApplyResult> {
    const resp = await api.post<PlannedBonusAccrualApplyResult>(
      '/api/bonus/marketing-accrual/apply',
      { payrollMonth },
    );
    return resp.data;
  },
};
