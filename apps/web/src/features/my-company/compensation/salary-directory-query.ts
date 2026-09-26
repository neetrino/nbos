export const SALARY_DIRECTORY_PAGE_SIZE = 500;

export type SalaryDirectoryFilter = 'all' | 'missing' | 'terminated' | 'everyone';

export interface SalaryDirectoryListParams {
  page: number;
  pageSize: number;
  status?: 'TERMINATED';
  excludeStatus?: 'TERMINATED';
}

/** Default salary board is every employee except terminated. */
export function salaryDirectoryListParams(
  filter: SalaryDirectoryFilter,
): SalaryDirectoryListParams {
  const page = { page: 1, pageSize: SALARY_DIRECTORY_PAGE_SIZE };
  if (filter === 'terminated') return { ...page, status: 'TERMINATED' };
  if (filter === 'everyone') return page;
  return { ...page, excludeStatus: 'TERMINATED' };
}

export function salaryDirectoryShowsMissingOnly(filter: SalaryDirectoryFilter): boolean {
  return filter === 'missing';
}

/** Missing-salary is filtered on the client; the request scope stays “current”. */
export function salaryDirectoryRequestScope(
  filter: SalaryDirectoryFilter,
): Exclude<SalaryDirectoryFilter, 'missing'> {
  if (filter === 'terminated' || filter === 'everyone') return filter;
  return 'all';
}
