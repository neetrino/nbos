export interface ListData<T> {
  items: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export interface FinanceDateRangeParams {
  dateFrom?: string;
  dateTo?: string;
}
