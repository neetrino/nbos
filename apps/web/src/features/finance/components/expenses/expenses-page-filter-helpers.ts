import { EXPENSE_BACKLOG_FIXED_STATUS } from '@/features/finance/constants/project-expenses-drilldown';

export type ExpensesPageVariant = 'default' | 'backlog';

export function initialExpenseFilterRecord(variant: ExpensesPageVariant): Record<string, string> {
  return variant === 'backlog' ? { status: EXPENSE_BACKLOG_FIXED_STATUS } : {};
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
  return {};
}

export function expenseFiltersWithoutProjectDrilldown(
  prev: Record<string, string>,
  variant: ExpensesPageVariant,
): Record<string, string> {
  const next = { ...prev };
  delete next.project;
  if (variant === 'backlog') {
    next.status = EXPENSE_BACKLOG_FIXED_STATUS;
  }
  return next;
}
