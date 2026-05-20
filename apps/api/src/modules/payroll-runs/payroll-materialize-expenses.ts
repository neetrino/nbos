import { Decimal, type ExpenseCategoryEnum, type TransactionClient } from '@nbos/database';

/** Machine-readable trace for support / reconciliation (not shown as user-facing copy). */
export function formatPayrollExpenseNotes(payrollRunId: string, salaryLineId: string): string {
  return `NBOS payrollRunId=${payrollRunId}; salaryLineId=${salaryLineId}`;
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

/**
 * Creates one `Expense` per payable salary line and links `salary_lines.expense_id`.
 * Call only while transitioning a run to `APPROVED`, inside the same DB transaction.
 */
export async function materializePayrollExpensesForApprovedRun(
  tx: TransactionClient,
  params: { payrollRunId: string; payrollMonth: string },
): Promise<MaterializePayrollExpensesResult> {
  const createdExpenseIds: string[] = [];
  const lines = await tx.salaryLine.findMany({
    where: { payrollRunId: params.payrollRunId, expenseId: null },
    include: { employee: { select: { firstName: true, lastName: true } } },
  });

  for (const line of lines) {
    if (line.totalPayable.lte(0)) {
      continue;
    }

    const name = `Payroll ${params.payrollMonth} · ${employeeDisplayName(line.employee)}`;
    const category = pickPayrollExpenseCategory(line);
    const expense = await tx.expense.create({
      data: {
        name,
        type: 'PLANNED',
        category,
        amount: line.totalPayable,
        frequency: 'ONE_TIME',
        dueDate: endOfPayrollMonthUtc(params.payrollMonth),
        status: 'DUE_NOW',
        notes: formatPayrollExpenseNotes(params.payrollRunId, line.id),
      },
    });

    createdExpenseIds.push(expense.id);

    await tx.salaryLine.update({
      where: { id: line.id },
      data: { expenseId: expense.id, status: 'APPROVED' },
    });
  }

  return { createdExpenseIds };
}
