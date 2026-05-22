'use client';

import { useMemo } from 'react';
import {
  BonusCard,
  sumBonusEntryAmounts,
} from '@/features/finance/components/bonus/bonus-board-widgets';
import { formatAmount } from '@/features/finance/constants/finance';
import type { BonusEntryListRow } from '@/lib/api/bonus';

export function BonusBoardEmployeeView({
  rows,
  onOpenReleases,
}: {
  rows: BonusEntryListRow[];
  onOpenReleases: (entry: BonusEntryListRow) => void;
}) {
  const groups = useMemo(() => groupByEmployee(rows), [rows]);
  return (
    <GroupedBonusView
      groups={groups}
      emptyLabel="No entries for employees in this scope."
      onOpenReleases={onOpenReleases}
    />
  );
}

export function BonusBoardProductView({
  rows,
  onOpenReleases,
}: {
  rows: BonusEntryListRow[];
  onOpenReleases: (entry: BonusEntryListRow) => void;
}) {
  const groups = useMemo(() => groupByProject(rows), [rows]);
  return (
    <GroupedBonusView
      groups={groups}
      emptyLabel="No entries for projects in this scope."
      onOpenReleases={onOpenReleases}
    />
  );
}

export function BonusBoardPayrollMonthView({
  rows,
  onOpenReleases,
}: {
  rows: BonusEntryListRow[];
  onOpenReleases: (entry: BonusEntryListRow) => void;
}) {
  const groups = useMemo(() => groupByPayrollMonth(rows), [rows]);
  return (
    <GroupedBonusView
      groups={groups}
      emptyLabel="No entries for payroll months in this scope."
      onOpenReleases={onOpenReleases}
    />
  );
}

function GroupedBonusView({
  groups,
  emptyLabel,
  onOpenReleases,
}: {
  groups: Array<{ key: string; label: string; entries: BonusEntryListRow[] }>;
  emptyLabel: string;
  onOpenReleases: (entry: BonusEntryListRow) => void;
}) {
  if (groups.length === 0) {
    return <p className="text-muted-foreground py-8 text-center text-sm">{emptyLabel}</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {groups.map((group) => (
        <section key={group.key} className="border-border bg-card rounded-xl border p-4">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-foreground text-sm font-semibold">{group.label}</h3>
            <span className="text-muted-foreground text-xs tabular-nums">
              {group.entries.length} · {formatAmount(sumBonusEntryAmounts(group.entries))}
            </span>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {group.entries.map((entry) => (
              <li key={entry.id}>
                <BonusCard row={entry} onOpenReleases={onOpenReleases} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function groupByEmployee(rows: BonusEntryListRow[]) {
  const map = new Map<string, { key: string; label: string; entries: BonusEntryListRow[] }>();
  for (const row of rows) {
    const key = row.employee.id;
    const label = `${row.employee.firstName} ${row.employee.lastName}`.trim();
    const bucket = map.get(key) ?? { key, label, entries: [] };
    bucket.entries.push(row);
    map.set(key, bucket);
  }
  return sortGroups(map);
}

function groupByProject(rows: BonusEntryListRow[]) {
  const map = new Map<string, { key: string; label: string; entries: BonusEntryListRow[] }>();
  for (const row of rows) {
    const key = row.projectId;
    const label = row.project?.code
      ? `${row.project.code} · ${row.project.name ?? ''}`.trim()
      : key;
    const bucket = map.get(key) ?? { key, label, entries: [] };
    bucket.entries.push(row);
    map.set(key, bucket);
  }
  return sortGroups(map);
}

function groupByPayrollMonth(rows: BonusEntryListRow[]) {
  const map = new Map<string, { key: string; label: string; entries: BonusEntryListRow[] }>();
  for (const row of rows) {
    const key = row.payoutMonth ?? '__none__';
    const label = row.payoutMonth ?? 'No payroll month';
    const bucket = map.get(key) ?? { key, label, entries: [] };
    bucket.entries.push(row);
    map.set(key, bucket);
  }
  const groups = sortGroups(map);
  const unscheduled = groups.find((g) => g.key === '__none__');
  const rest = groups.filter((g) => g.key !== '__none__');
  return unscheduled ? [...rest, unscheduled] : rest;
}

function sortGroups(
  map: Map<string, { key: string; label: string; entries: BonusEntryListRow[] }>,
) {
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}
