import type { CompensationPayoutPhase } from './compensation-payout-phase';
import type { BonusPolicyBreakdownStatus } from './bonus-policy-breakdown-status';

export interface SalaryLineMonthPaymentRow {
  id: string;
  amount: string;
  paymentDate: string;
  notes: string | null;
}

export type EmployeeSalesKpiSourceDto = 'KPI_RESULT' | 'NO_KPI_POLICY' | 'NOT_SYNCED';

export interface EmployeeSalesKpiDetailDto {
  planAmount: string | null;
  actualAmount: string | null;
  attainmentPct: string | null;
  payoutFactor: string | null;
  source: EmployeeSalesKpiSourceDto;
  effectivePayoutScaleLabel: string | null;
}

/** Compact KPI read model on Salary Board month cards (Sales with KPI policy only). */
export interface SalaryBoardSalesKpiSummaryDto {
  earnedPeriod: string;
  source: EmployeeSalesKpiSourceDto;
  planAmount: string | null;
  actualAmount: string | null;
  attainmentPct: string | null;
  /** Whole-number percent derived from payout factor (e.g. 50 for 0.5). */
  payoutFactorPct: string | null;
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
  /** Sales: calendar month when bonus was earned (`YYYY-MM`). */
  earnedPeriod: string | null;
  /** Sales: 100% policy amount before KPI gate. */
  fullAmount: string | null;
  /** Sales: amount × month KPI % (frozen when month rolls). */
  payableAmount: string | null;
  /** Sales: whole-number payout % (e.g. 50 for factor 0.5). */
  kpiPayoutFactorPct: string | null;
  releaseAmount: string;
  includedAmount: string | null;
  /** Persisted SALES KPI reduction at payroll attach. */
  kpiBurnedAmount: string | null;
  kpiBurnedReason: string | null;
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
  };
  /** Cap carry-over from earlier payroll months not yet applied to this line. */
  pendingPayrollCarryOver: string | null;
  /** True when compensation profile has an active KPI policy for this payout month. */
  hasKpiPolicy: boolean;
  /** Earned sales month for KPI lookup (prior month when `hasKpiPolicy`). */
  earnedPeriod: string | null;
  employeeSalesKpi: EmployeeSalesKpiDetailDto;
  salaryLine: {
    id: string;
    status: string;
    baseSalary: string;
    bonusesTotal: string;
    /** Prior-month cap carry already applied to this line this run. */
    payrollCarryAppliedAmount: string | null;
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
