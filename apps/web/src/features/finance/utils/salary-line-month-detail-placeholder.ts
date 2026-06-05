import type { EmployeeWalletSalaryRow, EmployeeWalletSnapshot } from '@/lib/api/me';
import type {
  EmployeeSalesKpiDetail,
  PayrollRunStatus,
  SalaryBoardCell,
  SalaryBoardSalesKpiSummary,
  SalaryLineMonthDetail,
  SalaryLineRow,
} from '@/lib/api/payroll-runs';
import type { SalaryBoardEntry } from '@/features/finance/components/payroll/salary-board-entries';

const EMPTY_BONUS_SUMMARY: SalaryLineMonthDetail['bonusBreakdownSummary'] = {
  incomingCount: 0,
  burnedTotal: '0',
  carryOverTotal: '0',
  clawbackCount: 0,
};

const EMPTY_SALES_KPI: EmployeeSalesKpiDetail = {
  planAmount: null,
  actualAmount: null,
  attainmentPct: null,
  payoutFactor: null,
  source: 'NOT_SYNCED',
  effectivePayoutScaleLabel: null,
};

function mapSalesKpiSummary(summary?: SalaryBoardSalesKpiSummary): EmployeeSalesKpiDetail {
  if (!summary) return EMPTY_SALES_KPI;
  return {
    planAmount: summary.planAmount,
    actualAmount: summary.actualAmount,
    attainmentPct: summary.attainmentPct,
    payoutFactor: summary.payoutFactorPct,
    source: summary.source,
    effectivePayoutScaleLabel: null,
  };
}

function hasKpiPolicyFromSummary(summary?: SalaryBoardSalesKpiSummary): boolean {
  return summary != null && summary.source !== 'NO_KPI_POLICY';
}

function buildEmployeeRef(
  employee: SalaryBoardEntry['employee'],
  email = '',
): SalaryLineMonthDetail['employee'] {
  return {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email,
    position: employee.position,
  };
}

function buildSalaryLineSlice(
  salaryLineId: string,
  lineStatus: SalaryLineMonthDetail['salaryLine']['status'],
  amounts: {
    baseSalary: string;
    bonusesTotal: string;
    totalPayable: string;
    paidAmount: string;
    remainingAmount: string;
  },
): SalaryLineMonthDetail['salaryLine'] {
  return {
    id: salaryLineId,
    status: lineStatus,
    baseSalary: amounts.baseSalary,
    bonusesTotal: amounts.bonusesTotal,
    payrollCarryAppliedAmount: null,
    totalPayable: amounts.totalPayable,
    paidAmount: amounts.paidAmount,
    remainingAmount: amounts.remainingAmount,
    compensationProfileId: null,
  };
}

/** Instant sheet header from salary board list/calendar cell. */
export function buildSalaryLineMonthDetailFromBoardEntry(
  entry: SalaryBoardEntry,
): SalaryLineMonthDetail {
  const { cell, employee } = entry;
  return {
    payoutPhase: cell.payoutPhase,
    pendingPayrollCarryOver: null,
    employee: buildEmployeeRef(employee),
    payrollMonth: cell.payrollMonth,
    payrollRun: {
      id: cell.payrollRunId,
      status: cell.runStatus,
    },
    hasKpiPolicy: hasKpiPolicyFromSummary(cell.salesKpiSummary),
    earnedPeriod: cell.salesKpiSummary?.earnedPeriod ?? null,
    employeeSalesKpi: mapSalesKpiSummary(cell.salesKpiSummary),
    salaryLine: buildSalaryLineSlice(cell.salaryLineId, cell.lineStatus, {
      baseSalary: '0',
      bonusesTotal: '0',
      totalPayable: cell.totalPayable,
      paidAmount: cell.paidAmount,
      remainingAmount: cell.remainingAmount,
    }),
    expense: null,
    bonusBreakdownSummary: EMPTY_BONUS_SUMMARY,
    bonusBreakdown: [],
  };
}

/** Instant sheet header from payroll run salary lines table. */
export function buildSalaryLineMonthDetailFromPayrollLine(
  line: SalaryLineRow,
  payrollMonth: string,
  runStatus: PayrollRunStatus,
): SalaryLineMonthDetail {
  return {
    payoutPhase: 'active_payout',
    pendingPayrollCarryOver: null,
    employee: {
      id: line.employee.id,
      firstName: line.employee.firstName,
      lastName: line.employee.lastName,
      email: line.employee.email,
      position: null,
    },
    payrollMonth,
    payrollRun: {
      id: line.payrollRunId,
      status: runStatus,
    },
    hasKpiPolicy: false,
    earnedPeriod: null,
    employeeSalesKpi: EMPTY_SALES_KPI,
    salaryLine: buildSalaryLineSlice(line.id, line.status, {
      baseSalary: line.baseSalary,
      bonusesTotal: line.bonusesTotal,
      totalPayable: line.totalPayable,
      paidAmount: line.paidAmount,
      remainingAmount: line.remainingAmount,
    }),
    expense: line.expense
      ? {
          id: line.expense.id,
          name: line.expense.name,
          amount: line.expense.amount,
          status: line.expense.status,
          paymentStatus: 'UNPAID',
          paidAmount: '0',
          remainingAmount: line.expense.amount,
          payments: [],
        }
      : null,
    bonusBreakdownSummary: EMPTY_BONUS_SUMMARY,
    bonusBreakdown: [],
  };
}

/** Instant sheet header from employee wallet salary history row. */
export function buildSalaryLineMonthDetailFromWalletRow(
  row: EmployeeWalletSalaryRow,
  employee: EmployeeWalletSnapshot['employee'],
): SalaryLineMonthDetail {
  return {
    payoutPhase: row.payoutPhase,
    pendingPayrollCarryOver: null,
    employee: {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: '',
      position: employee.position,
    },
    payrollMonth: row.payrollMonth,
    payrollRun: {
      id: row.payrollRunId,
      status: row.runStatus as PayrollRunStatus,
    },
    hasKpiPolicy: false,
    earnedPeriod: null,
    employeeSalesKpi: EMPTY_SALES_KPI,
    salaryLine: buildSalaryLineSlice(row.id, row.lineStatus as SalaryBoardCell['lineStatus'], {
      baseSalary: row.baseSalary,
      bonusesTotal: row.bonusesTotal,
      totalPayable: row.totalPayable,
      paidAmount: row.paidAmount,
      remainingAmount: row.remainingAmount,
    }),
    expense: null,
    bonusBreakdownSummary: EMPTY_BONUS_SUMMARY,
    bonusBreakdown: [],
  };
}

export function findSalaryBoardEntryByLineId(
  entries: ReadonlyArray<SalaryBoardEntry>,
  salaryLineId: string,
): SalaryBoardEntry | null {
  return entries.find((entry) => entry.salaryLineId === salaryLineId) ?? null;
}
