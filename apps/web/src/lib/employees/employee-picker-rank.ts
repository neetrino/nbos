import type { RelationPickerOption } from '@/components/shared/relation-picker/relation-picker.types';

const SCORE_FIRST_PREFIX = 4000;
const SCORE_LAST_PREFIX = 3000;
const SCORE_WORD_PREFIX = 2000;
const SCORE_NAME_CONTAINS = 1000;
const SCORE_EMAIL_CONTAINS = 100;
const PREFIX_FIT_BASE = 50;

export type EmployeePickerPerson = {
  firstName: string;
  lastName: string;
  email: string;
  usageScore: number;
  option: RelationPickerOption;
};

export type EmployeeUsageCounts = {
  tasksAssigned: number;
  dealsSelling: number;
  productsManaging: number;
};

/** Assignments we already have on the employee list payload — no extra API. */
export function employeeUsageScore(count?: EmployeeUsageCounts): number {
  if (!count) return 0;
  return count.tasksAssigned + count.dealsSelling + count.productsManaging;
}

/** Empty query → most used first. Typed query → best name match, then usage. */
export function filterAndRankEmployeePickerPeople(
  people: readonly EmployeePickerPerson[],
  query: string,
): RelationPickerOption[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [...people].sort(compareByUsageThenName).map((row) => row.option);
  }

  return people
    .map((row) => ({ row, score: scoreEmployeeMatch(needle, row) }))
    .filter((entry): entry is { row: EmployeePickerPerson; score: number } => entry.score !== null)
    .sort((left, right) => {
      const scoreDelta = right.score - left.score;
      if (scoreDelta !== 0) return scoreDelta;
      return compareByUsageThenName(left.row, right.row);
    })
    .map((entry) => entry.row.option);
}

function compareByUsageThenName(left: EmployeePickerPerson, right: EmployeePickerPerson): number {
  const usageDelta = right.usageScore - left.usageScore;
  if (usageDelta !== 0) return usageDelta;
  return left.option.label.localeCompare(right.option.label);
}

function scoreEmployeeMatch(query: string, person: EmployeePickerPerson): number | null {
  const first = person.firstName.trim().toLowerCase();
  const last = person.lastName.trim().toLowerCase();
  const full = `${first} ${last}`.trim();
  const email = person.email.trim().toLowerCase();

  if (first.startsWith(query)) return SCORE_FIRST_PREFIX + prefixFit(query, first);
  if (full.startsWith(query)) return SCORE_FIRST_PREFIX + prefixFit(query, full);
  if (last.startsWith(query)) return SCORE_LAST_PREFIX + prefixFit(query, last);
  if (nameWords(full).some((word) => word.startsWith(query))) return SCORE_WORD_PREFIX;

  const nameIndex = full.indexOf(query);
  if (nameIndex >= 0) return SCORE_NAME_CONTAINS - nameIndex;
  if (email.includes(query)) return SCORE_EMAIL_CONTAINS;
  return null;
}

function prefixFit(query: string, target: string): number {
  return Math.max(0, PREFIX_FIT_BASE - (target.length - query.length));
}

function nameWords(full: string): string[] {
  return full.split(/[\s-]+/).filter(Boolean);
}
