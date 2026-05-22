'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { BonusPoolsPoolCard } from '@/features/finance/components/bonus/bonus-pools-pool-card';
import { BonusPoolsProjectSummaryBar } from '@/features/finance/components/bonus/bonus-pools-project-summary-bar';
import { groupBonusPoolsByProject } from '@/features/finance/utils/bonus-pools-grouping';
import { summarizeBonusPoolsProjectGroup } from '@/features/finance/utils/bonus-pools-project-summary';
import type { BonusProductPoolRow } from '@/lib/api/bonus';

export function BonusPoolsByProjectView({
  rows,
  onOpenPool,
}: {
  rows: BonusProductPoolRow[];
  onOpenPool: (row: BonusProductPoolRow) => void;
}) {
  const groups = useMemo(() => groupBonusPoolsByProject(rows), [rows]);

  if (groups.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">No pools match filters.</p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
      {groups.map((group) => {
        const summary = summarizeBonusPoolsProjectGroup(group);
        return (
          <section key={group.projectId} className="flex flex-col gap-3">
            <div className="flex items-center gap-3 px-1">
              <Link
                href={`/projects/${group.projectId}`}
                className="text-foreground shrink-0 text-sm font-semibold hover:underline"
              >
                {group.projectCode}
              </Link>
              <span className="text-muted-foreground truncate text-sm">{group.projectName}</span>
              <div className="border-border h-px min-w-0 flex-1 border-t" aria-hidden />
              <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                {summary.poolCount} pools
              </span>
            </div>
            <BonusPoolsProjectSummaryBar summary={summary} />
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {group.pools.map((row) => (
                <BonusPoolsPoolCard key={row.poolKey} row={row} onOpen={onOpenPool} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
