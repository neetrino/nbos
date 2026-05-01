import {
  EXPENSE_BACKLOG_FIXED_STATUS,
  EXPENSE_CLOSED_FIXED_STATUS,
} from '../../constants/project-expenses-drilldown';

export type ExpensesPageVariant = 'default' | 'backlog' | 'closed';

export function initialExpenseFilterRecord(variant: ExpensesPageVariant): Record<string, string> {
  if (variant === 'backlog') {
    return { status: EXPENSE_BACKLOG_FIXED_STATUS };
  }
  if (variant === 'closed') {
    return { status: EXPENSE_CLOSED_FIXED_STATUS };
  }
  return {};
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
    return projectIdFromUrl
      ? { status: EXPENSE_CLOSED_FIXED_STATUS, project: projectIdFromUrl }
      : { status: EXPENSE_CLOSED_FIXED_STATUS };
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
  } else if (variant === 'closed') {
    next.status = EXPENSE_CLOSED_FIXED_STATUS;
  }
  return next;
}
