import { Decimal, type ExpenseCategoryEnum, type TransactionClient } from '@nbos/database';
import { assertEmployeeTakeHomeCurrency } from '../compensation-profiles/compensation-profile-currency';
import { isZeroSalaryBonusSettlementLine } from './payroll-bonus-settlement-salary-line';

/** Machine-readable trace for support / reconciliation (not shown as user-facing copy). */
export function formatPayrollExpenseNotes(
  payrollRunId: string,
  salaryLineId: string,
  compensationProfileId?: string | null,
): string {
  const parts = [`NBOS payrollRunId=${payrollRunId}`, `salaryLineId=${salaryLineId}`];
  if (compensationProfileId) {
    parts.push(`compensationProfileId=${compensationProfileId}`);
  }
  return parts.join('; ');
}

export function endOfPayrollMonthUtc(payrollMonth: string): Date {
  const [yStr, mStr] = payrollMonth.split('-');
  const y = Number.parseInt(yStr ?? '', 10);
  const m = Number.parseInt(mStr ?? '', 10);
  if (!Number.isFinite(y) || !Number.isFinite(m)) {
    throw new Error(`Invalid payrollMonth: ${payrollMonth}`);
  }
  return new Date(Date.UTC(y, m, 0));
}

export function pickPayrollExpenseCategory(line: {
  baseSalary: Decimal;
  bonusesTotal: Decimal;
}): ExpenseCategoryEnum {
  if (line.bonusesTotal.gt(0) && line.baseSalary.eq(0)) {
    return 'BONUS';
  }
  return 'SALARY';
}

function employeeDisplayName(emp: { firstName: string; lastName: string }): string {
  return `${emp.firstName} ${emp.lastName}`.trim();
}

export interface MaterializePayrollExpensesResult {
  /** New expense primary keys created in this run (empty if nothing payable). */
  createdExpenseIds: string[];
}

type PayableSalaryLine = {
  id: string;
  totalPayable: Decimal;
  baseSalary: Decimal;
  bonusesTotal: Decimal;
  compensationProfileId: string | null;
  employee: { firstName: string; lastName: string };
  compensationProfile: { id: string; currency: string } | null;
};

function assertPayableLinesAreAmd(lines: readonly PayableSalaryLine[]): void {
  for (const line of lines) {
    if (isZeroSalaryBonusSettlementLine(line)) {
      continue;
    }
    assertEmployeeTakeHomeCurrency(line.compensationProfile?.currency, `Salary line ${line.id}`);
  }
}

async function createLinkedPayrollExpense(
  tx: TransactionClient,
  params: { payrollRunId: string; payrollMonth: string },
  line: PayableSalaryLine,
): Promise<string> {
  const expense = await tx.expense.create({
    data: {
      name: `Payroll ${params.payrollMonth} · ${employeeDisplayName(line.employee)}`,
      type: 'PLANNED',
      category: pickPayrollExpenseCategory(line),
      amount: line.totalPayable,
      frequency: 'ONE_TIME',
      dueDate: endOfPayrollMonthUtc(params.payrollMonth),
      status: 'DUE_NOW',
      notes: formatPayrollExpenseNotes(params.payrollRunId, line.id, line.compensationProfileId),
    },
  });
  await tx.salaryLine.update({
    where: { id: line.id },
    data: { expenseId: expense.id, status: 'APPROVED' },
  });
  return expense.id;
}

/**
 * Creates one `Expense` per payable salary line and links `salary_lines.expense_id`.
 * Call only while transitioning a run to `APPROVED`, inside the same DB transaction.
 * Expense has no currency column: non-AMD profiles are rejected before create.
 */
export async function materializePayrollExpensesForApprovedRun(
  tx: TransactionClient,
  params: { payrollRunId: string; payrollMonth: string },
): Promise<MaterializePayrollExpensesResult> {
  const lines = await tx.salaryLine.findMany({
    where: { payrollRunId: params.payrollRunId, expenseId: null },
    include: {
      employee: { select: { firstName: true, lastName: true } },
      compensationProfile: { select: { id: true, currency: true } },
    },
  });
  const payable = lines.filter((line) => line.totalPayable.gt(0));
  assertPayableLinesAreAmd(payable);

  const createdExpenseIds: string[] = [];
  for (const line of payable) {
    createdExpenseIds.push(await createLinkedPayrollExpense(tx, params, line));
  }
  return { createdExpenseIds };
}
