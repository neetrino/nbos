export type CreateBonusReleaseBody = {
  amount: number;
  releaseType: string;
  reason?: string;
  payrollRunId?: string;
  approvedById?: string;
  status?: string;
};

export type PatchBonusReleaseBody = {
  amount: number;
  reason: string;
  approvedById?: string;
};

export type PatchBonusPlannedAmountBody = {
  amount: string;
  reason: string;
  title?: string;
};

export type PatchBonusPayableAdjustmentBody = {
  adjustment: string;
  reason: string;
};

export type CreateBonusEntryBody = {
  employeeId: string;
  orderId: string;
  projectId: string;
  type: string;
  amount: number;
  percent: number;
  title?: string;
  reason?: string;
  status?: string;
  kpiGatePassed?: boolean;
  earnedPeriod?: string;
  payoutMonth?: string;
};
