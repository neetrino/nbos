import type { CompensationPayoutPhase } from './compensation-payout-phase';
import type { BonusPolicyBreakdownStatus } from './bonus-policy-breakdown-status';

export interface SalaryLineMonthPaymentRow {
  id: string;
  amount: string;
  paymentDate: string;
  notes: string | null;
}

export interface BonusBreakdownSummaryDto {
  incomingCount: number;
  burnedTotal: string;
  carryOverTotal: string;
  clawbackCount: number;
}

export interface SalaryLineMonthBonusRow {
  bonusEntryId: string;
  bonusReleaseId: string;
  entryStatus: string;
  type: string;
  releaseType: string;
  releaseStatus: string;
  policyBreakdownStatuses: BonusPolicyBreakdownStatus[];
  projectId: string;
  projectCode: string;
  projectName: string;
  orderCode: string;
  productLabel: string;
  plannedAmount: string;
  releaseAmount: string;
  includedAmount: string | null;
  /** Persisted SALES KPI reduction at payroll attach. */
  kpiBurnedAmount: string | null;
  payrollCarryOverAmount: string | null;
  paidAmount: string;
  remainingAmount: string;
  reason: string | null;
}

export interface SalaryLineMonthDetailDto {
  payoutPhase: CompensationPayoutPhase;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    position: string | null;
  };
  payrollMonth: string;
  payrollRun: {
    id: string;
    status: string;
    kpiSalesPlanAmount: string | null;
    kpiSalesActualAmount: string | null;
  };
  /** Cap carry-over from earlier payroll months not yet applied to this line. */
  pendingPayrollCarryOver: string | null;
  salaryLine: {
    id: string;
    status: string;
    baseSalary: string;
    bonusesTotal: string;
    adjustmentsTotal: string;
    deductionsTotal: string;
    totalPayable: string;
    paidAmount: string;
    remainingAmount: string;
    compensationProfileId: string | null;
  };
  expense: {
    id: string;
    name: string;
    amount: string;
    status: string;
    paymentStatus: string;
    paidAmount: string;
    remainingAmount: string;
    payments: SalaryLineMonthPaymentRow[];
  } | null;
  bonusBreakdownSummary: BonusBreakdownSummaryDto;
  bonusBreakdown: SalaryLineMonthBonusRow[];
}
