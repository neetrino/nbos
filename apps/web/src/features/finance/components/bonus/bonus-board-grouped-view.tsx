'use client';

import { useMemo } from 'react';
import { Gift } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import {
  BonusCard,
  sumBonusEntryAmounts,
} from '@/features/finance/components/bonus/bonus-board-widgets';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  groupBonusEntriesByEmployee,
  groupBonusEntriesByPayrollMonth,
  groupBonusEntriesByProject,
  type BonusBoardEntryGroup,
} from '@/features/finance/utils/bonus-board-grouping';
import type { BonusEntryListRow } from '@/lib/api/bonus';

export function BonusBoardEmployeeView({
  rows,
  onOpenReleases,
}: {
  rows: BonusEntryListRow[];
  onOpenReleases: (entry: BonusEntryListRow) => void;
}) {
  const groups = useMemo(() => groupBonusEntriesByEmployee(rows), [rows]);
  return (
    <GroupedBonusView
      groups={groups}
      emptyLabel="No entries for employees in this scope."
      onOpenReleases={onOpenReleases}
      cardsPerRow={2}
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
  const groups = useMemo(() => groupBonusEntriesByProject(rows), [rows]);
  return (
    <GroupedBonusView
      groups={groups}
      emptyLabel="No entries for projects in this scope."
      onOpenReleases={onOpenReleases}
      cardsPerRow={2}
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
  const groups = useMemo(() => groupBonusEntriesByPayrollMonth(rows), [rows]);
  return (
    <GroupedBonusView
      groups={groups}
      emptyLabel="No entries for payroll months in this scope."
      onOpenReleases={onOpenReleases}
      cardsPerRow={2}
    />
  );
}

function GroupedBonusView({
  groups,
  emptyLabel,
  onOpenReleases,
  cardsPerRow = 1,
}: {
  groups: BonusBoardEntryGroup[];
  emptyLabel: string;
  onOpenReleases: (entry: BonusEntryListRow) => void;
  cardsPerRow?: 1 | 2;
}) {
  if (groups.length === 0) {
    return (
      <EmptyState icon={Gift} title="No matching entries" description={emptyLabel} action={null} />
    );
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
          <ul
            className={
              cardsPerRow === 2
                ? 'mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2'
                : 'mt-3 flex flex-col gap-2'
            }
          >
            {group.entries.map((entry) => (
              <li key={entry.id} className="min-w-0">
                <BonusCard row={entry} onOpenReleases={onOpenReleases} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
