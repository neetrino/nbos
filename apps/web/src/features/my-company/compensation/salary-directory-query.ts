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

const TERMINATED_STATUS = 'TERMINATED';

/** Chip totals stay on the full loaded set; the selected chip only changes the grid. */
export function salaryDirectoryChipCounts(
  people: ReadonlyArray<{ status: string; hasSalary: boolean }>,
): Record<SalaryDirectoryFilter, number> {
  let all = 0;
  let missing = 0;
  let terminated = 0;
  for (const person of people) {
    if (person.status === TERMINATED_STATUS) {
      terminated += 1;
      continue;
    }
    all += 1;
    if (!person.hasSalary) missing += 1;
  }
  return { all, missing, terminated, everyone: people.length };
}

export function salaryEmployeeVisible(
  filter: SalaryDirectoryFilter,
  status: string,
  personHasSalary: boolean,
): boolean {
  if (filter === 'terminated') return status === TERMINATED_STATUS;
  if (filter === 'everyone') return true;
  if (status === TERMINATED_STATUS) return false;
  if (filter === 'missing') return !personHasSalary;
  return true;
}

/** Missing-salary is filtered on the client; the request scope stays “current”. */
export function salaryDirectoryRequestScope(
  filter: SalaryDirectoryFilter,
): Exclude<SalaryDirectoryFilter, 'missing'> {
  if (filter === 'terminated' || filter === 'everyone') return filter;
  return 'all';
}
