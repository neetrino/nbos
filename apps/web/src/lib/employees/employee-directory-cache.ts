import type { RelationPickerOption } from '@/components/shared/relation-picker/relation-picker.types';
import { employeesApi, type Employee } from '@/lib/api/employees';
import {
  EMPLOYEE_PICKER_EMPTY_CACHE_TTL_MS,
  EMPLOYEE_PICKER_PAGE_SIZE,
} from './employee-directory-constants';
import {
  employeeUsageScore,
  filterAndRankEmployeePickerPeople,
  type EmployeePickerPerson,
} from './employee-picker-rank';
import { invalidateTeamDirectoryCache } from './team-directory-cache';

type DirectoryCache = {
  people: EmployeePickerPerson[];
  fetchedAt: number;
};

let directoryCache: DirectoryCache | null = null;
let directoryPromise: Promise<EmployeePickerPerson[]> | null = null;

function employeeToPerson(row: Employee): EmployeePickerPerson {
  return {
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    usageScore: employeeUsageScore(row._count),
    option: {
      value: row.id,
      label: `${row.firstName} ${row.lastName}`.trim(),
      subtitle: row.position ?? row.email,
      avatar: row.avatar?.trim() || undefined,
    },
  };
}

function applyExclude(
  options: RelationPickerOption[],
  excludeIds?: ReadonlySet<string>,
): RelationPickerOption[] {
  if (!excludeIds?.size) return options;
  return options.filter((row) => !excludeIds.has(row.value));
}

function directoryCacheFresh(): boolean {
  return (
    directoryCache !== null &&
    Date.now() - directoryCache.fetchedAt < EMPLOYEE_PICKER_EMPTY_CACHE_TTL_MS
  );
}

async function fetchActiveDirectory(): Promise<EmployeePickerPerson[]> {
  const res = await employeesApi.getAll({
    page: 1,
    pageSize: EMPLOYEE_PICKER_PAGE_SIZE,
    status: 'ACTIVE',
  });
  return res.items.map(employeeToPerson);
}

async function loadActiveDirectory(): Promise<EmployeePickerPerson[]> {
  if (directoryCacheFresh() && directoryCache) {
    return directoryCache.people;
  }
  if (directoryPromise) {
    return directoryPromise;
  }
  directoryPromise = fetchActiveDirectory()
    .then((people) => {
      directoryCache = { people, fetchedAt: Date.now() };
      return people;
    })
    .finally(() => {
      directoryPromise = null;
    });
  return directoryPromise;
}

/** Clears cached active list so the next open refetches. */
export function invalidateEmployeePickerEmptyCache(): void {
  directoryCache = null;
}

/** Clears picker + team directory caches after employee mutations. */
export function invalidateEmployeeDirectoryCaches(): void {
  invalidateEmployeePickerEmptyCache();
  invalidateTeamDirectoryCache();
}

/** Warm active employee directory after sign-in. Best-effort — never throws. */
export function prefetchEmployeePickerEmptyPage(): void {
  void loadActiveDirectory().catch(() => undefined);
}

/**
 * Picker search: one cached ACTIVE directory, then local filter + rank.
 */
export async function searchEmployeesForPicker(
  query: string,
  excludeIds?: ReadonlySet<string>,
): Promise<RelationPickerOption[]> {
  const people = await loadActiveDirectory();
  return applyExclude(filterAndRankEmployeePickerPeople(people, query), excludeIds);
}
