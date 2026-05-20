export interface CreateExpenseDto {
  name: string;
  type: string;
  category: string;
  amount: number;
  frequency?: string;
  dueDate?: string;
  status?: string;
  projectId?: string;
  /** When set, links the expense to an existing `ExpensePlan` (validated server-side). */
  expensePlanId?: string;
  /** When set, links the expense to a `ClientServiceRecord` source. */
  clientServiceRecordId?: string;
  isPassThrough?: boolean;
  taxStatus?: string;
  backlogReason?: string | null;
  notes?: string;
}

export interface UpdateExpenseDto {
  name?: string;
  type?: string;
  category?: string;
  amount?: number;
  frequency?: string;
  dueDate?: string;
  status?: string;
  projectId?: string;
  clientServiceRecordId?: string | null;
  isPassThrough?: boolean;
  taxStatus?: string;
  backlogReason?: string | null;
  notes?: string;
}

export interface ExpenseQueryParams {
  page?: number;
  pageSize?: number;
  type?: string;
  category?: string;
  status?: string;
  backlogReason?: string;
  projectId?: string;
  /** When set, only expenses linked to this `ExpensePlan` (`expenses.expense_plan_id`). */
  expensePlanId?: string;
  frequency?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  /** When true and `status` is unset: exclude PAID + BACKLOG (NBOS Expense Board scope). */
  activeBoard?: boolean;
  /** When true and `status` is unset: only PAID + CANCELLED (NBOS Closed expenses scope). */
  closedBoard?: boolean;
}

export interface ExpenseStatsParams {
  dateFrom?: string;
  dateTo?: string;
  /** When set, stats match `findAll` list filter for the same project. */
  projectId?: string;
  /** When set, stats match `findAll` list filter for the same expense plan. */
  expensePlanId?: string;
  /** When set, aggregates are scoped to this status (list/stats parity). */
  status?: string;
  /** When true and `status` is unset: same scope as `findAll` with `activeBoard`. */
  activeBoard?: boolean;
  /** When true and `status` is unset: same scope as `findAll` with `closedBoard`. */
  closedBoard?: boolean;
}
