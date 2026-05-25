import { employeeDisplayName } from '@/features/finance/components/bonus/bonus-board-widgets';
import type { BonusEntryListRow } from '@/lib/api/bonus';

export type BonusBoardEntryGroup = {
  key: string;
  label: string;
  entries: BonusEntryListRow[];
};

const NO_PAYROLL_MONTH_KEY = '__none__';

export function groupBonusEntriesByEmployee(rows: BonusEntryListRow[]): BonusBoardEntryGroup[] {
  const map = new Map<string, BonusBoardEntryGroup>();
  for (const row of rows) {
    const key = row.employee.id;
    const label = employeeDisplayName(row.employee);
    const bucket = map.get(key) ?? { key, label, entries: [] };
    bucket.entries.push(row);
    map.set(key, bucket);
  }
  return sortBonusBoardGroups(map);
}

export function groupBonusEntriesByProject(rows: BonusEntryListRow[]): BonusBoardEntryGroup[] {
  const map = new Map<string, BonusBoardEntryGroup>();
  for (const row of rows) {
    const key = row.projectId;
    const label = row.project?.code
      ? `${row.project.code} · ${row.project.name ?? ''}`.trim()
      : key;
    const bucket = map.get(key) ?? { key, label, entries: [] };
    bucket.entries.push(row);
    map.set(key, bucket);
  }
  return sortBonusBoardGroups(map);
}

/** Payroll preview: months ascending; unscheduled month last. */
export function groupBonusEntriesByPayrollMonth(rows: BonusEntryListRow[]): BonusBoardEntryGroup[] {
  const map = new Map<string, BonusBoardEntryGroup>();
  for (const row of rows) {
    const key = row.payoutMonth ?? NO_PAYROLL_MONTH_KEY;
    const label = row.payoutMonth ?? 'No payroll month';
    const bucket = map.get(key) ?? { key, label, entries: [] };
    bucket.entries.push(row);
    map.set(key, bucket);
  }
  const groups = sortBonusBoardGroups(map);
  const unscheduled = groups.find((g) => g.key === NO_PAYROLL_MONTH_KEY);
  const rest = groups.filter((g) => g.key !== NO_PAYROLL_MONTH_KEY);
  return unscheduled ? [...rest, unscheduled] : rest;
}

function sortBonusBoardGroups(map: Map<string, BonusBoardEntryGroup>): BonusBoardEntryGroup[] {
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}
