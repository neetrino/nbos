export interface PayrollRunKpiResultDto {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  kpiPolicyId: string | null;
  compensationProfileId: string | null;
  planAmount: string | null;
  actualAmount: string | null;
  attainmentPct: string | null;
  payoutFactor: string;
  source: string;
  sourceFacts: unknown;
}

export interface PayrollRunKpiResultsDto {
  payrollRunId: string;
  payrollMonth: string;
  items: PayrollRunKpiResultDto[];
}
