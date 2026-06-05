import type { RelationPickerOption } from '@/components/shared/relation-picker/relation-picker.types';
import { employeesApi, type Employee } from '@/lib/api/employees';
import {
  EMPLOYEE_PICKER_EMPTY_CACHE_TTL_MS,
  EMPLOYEE_PICKER_PAGE_SIZE,
} from './employee-directory-constants';
import { invalidateTeamDirectoryCache } from './team-directory-cache';

type EmptyPageCache = {
  options: RelationPickerOption[];
  fetchedAt: number;
};

let emptyPageCache: EmptyPageCache | null = null;
let emptyPagePromise: Promise<RelationPickerOption[]> | null = null;

function employeeToOption(row: Employee): RelationPickerOption {
  return {
    value: row.id,
    label: `${row.firstName} ${row.lastName}`.trim(),
    subtitle: row.position ?? row.email,
  };
}

function applyExclude(
  options: RelationPickerOption[],
  excludeIds?: ReadonlySet<string>,
): RelationPickerOption[] {
  if (!excludeIds?.size) return options;
  return options.filter((row) => !excludeIds.has(row.value));
}

function emptyCacheFresh(): boolean {
  return (
    emptyPageCache !== null &&
    Date.now() - emptyPageCache.fetchedAt < EMPLOYEE_PICKER_EMPTY_CACHE_TTL_MS
  );
}

async function fetchPickerPage(search: string | undefined): Promise<RelationPickerOption[]> {
  const res = await employeesApi.getAll({
    page: 1,
    pageSize: EMPLOYEE_PICKER_PAGE_SIZE,
    status: 'ACTIVE',
    search: search?.trim() || undefined,
  });
  return res.items.map(employeeToOption);
}

async function loadEmptyPickerPage(): Promise<RelationPickerOption[]> {
  if (emptyCacheFresh() && emptyPageCache) {
    return emptyPageCache.options;
  }
  if (emptyPagePromise) {
    return emptyPagePromise;
  }
  emptyPagePromise = fetchPickerPage(undefined)
    .then((options) => {
      emptyPageCache = { options, fetchedAt: Date.now() };
      return options;
    })
    .finally(() => {
      emptyPagePromise = null;
    });
  return emptyPagePromise;
}

/** Clears cached empty list so the next open refetches page 1. */
export function invalidateEmployeePickerEmptyCache(): void {
  emptyPageCache = null;
}

/** Clears picker + team directory caches after employee mutations. */
export function invalidateEmployeeDirectoryCaches(): void {
  invalidateEmployeePickerEmptyCache();
  invalidateTeamDirectoryCache();
}

/** @deprecated Use {@link invalidateEmployeePickerEmptyCache}. */
export function refreshEmployeeDirectory(): Promise<void> {
  invalidateEmployeePickerEmptyCache();
  return loadEmptyPickerPage().then(() => undefined);
}

/** Warm first picker page (20 active employees) after sign-in. */
export function prefetchEmployeePickerEmptyPage(): void {
  void loadEmptyPickerPage();
}

/**
 * Picker search: empty query → cached first page (20); typed query → API search (20).
 */
export async function searchEmployeesForPicker(
  query: string,
  excludeIds?: ReadonlySet<string>,
): Promise<RelationPickerOption[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    const options = await loadEmptyPickerPage();
    return applyExclude(options, excludeIds);
  }
  const options = await fetchPickerPage(trimmed);
  return applyExclude(options, excludeIds);
}
