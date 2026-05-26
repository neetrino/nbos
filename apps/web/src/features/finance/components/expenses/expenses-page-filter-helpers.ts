import { EXPENSE_BACKLOG_FIXED_STATUS } from '../../constants/project-expenses-drilldown';
import { clearPayrollPayNowFilters } from '../../constants/expense-payroll-filter';

export type ExpensesPageVariant = 'default' | 'backlog' | 'closed';

export function initialExpenseFilterRecord(variant: ExpensesPageVariant): Record<string, string> {
  if (variant === 'backlog') {
    return { status: EXPENSE_BACKLOG_FIXED_STATUS };
  }
  if (variant === 'closed') {
    return {};
  }
  return clearPayrollPayNowFilters();
}

export function clearedExpenseFilterRecord(
  variant: ExpensesPageVariant,
  projectIdFromUrl: string | null,
): Record<string, string> {
  if (variant === 'backlog') {
    return projectIdFromUrl
      ? { status: EXPENSE_BACKLOG_FIXED_STATUS, project: projectIdFromUrl }
      : { status: EXPENSE_BACKLOG_FIXED_STATUS };
  }
  if (variant === 'closed') {
    return projectIdFromUrl ? { project: projectIdFromUrl } : {};
  }
  return clearPayrollPayNowFilters();
}

export function expenseFiltersWithoutProjectDrilldown(
  prev: Record<string, string>,
  variant: ExpensesPageVariant,
): Record<string, string> {
  const next = { ...prev };
  delete next.project;
  if (variant === 'backlog') {
    next.status = EXPENSE_BACKLOG_FIXED_STATUS;
  } else if (variant === 'closed') {
    delete next.status;
  }
  return next;
}
