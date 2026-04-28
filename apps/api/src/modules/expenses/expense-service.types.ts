export interface CreateExpenseDto {
  name: string;
  type: string;
  category: string;
  amount: number;
  frequency?: string;
  dueDate?: string;
  status?: string;
  projectId?: string;
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
  frequency?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ExpenseStatsParams {
  dateFrom?: string;
  dateTo?: string;
  /** When set, stats match `findAll` list filter for the same project. */
  projectId?: string;
  /** When set, aggregates are scoped to this status (list/stats parity). */
  status?: string;
}
