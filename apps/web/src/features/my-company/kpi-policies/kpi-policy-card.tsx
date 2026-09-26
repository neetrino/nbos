'use client';

import { Target } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import type { KpiPolicyRow, KpiPolicyStatus } from '@/lib/api/kpi-policies';
import { cn } from '@/lib/utils';

const STATUS_VARIANT = {
  ACTIVE: 'green',
  DRAFT: 'amber',
  ARCHIVED: 'gray',
} as const;

const STATUS_LABEL: Record<KpiPolicyStatus, string> = {
  ACTIVE: 'Active',
  DRAFT: 'Draft',
  ARCHIVED: 'Archived',
};

function assignmentLabel(count: number): string {
  if (count === 0) return 'Not assigned';
  if (count === 1) return '1 salary';
  return `${count} salaries`;
}

function bandSummary(policy: KpiPolicyRow): string {
  const bands = [...policy.gateRules.bands].sort(
    (left, right) => right.minAttainmentPct - left.minAttainmentPct,
  );
  if (bands.length === 0) return 'No attainment bands';
  return bands
    .map((band) => `${band.minAttainmentPct}% → ${Math.round(band.payoutFactor * 100)}%`)
    .join(' · ');
}

export function KpiPolicyCard({
  policy,
  onOpen,
}: {
  policy: KpiPolicyRow;
  onOpen: (policy: KpiPolicyRow) => void;
}) {
  return (
    <li className="flex min-w-0">
      <button
        type="button"
        onClick={() => onOpen(policy)}
        className={cn(
          'border-border bg-card hover:border-primary/40 flex h-full w-full min-w-0 flex-col gap-3 rounded-2xl border p-4 text-left transition-colors',
          policy.status === 'ARCHIVED' && 'opacity-70',
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
            <Target className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-sm font-semibold">{policy.name}</p>
              <StatusBadge
                label={STATUS_LABEL[policy.status]}
                variant={STATUS_VARIANT[policy.status]}
                className="shrink-0"
              />
            </div>
            <p className="text-muted-foreground mt-0.5 truncate text-xs">
              Cap ×{policy.bonusCapBaseSalaryMultiplier}
            </p>
          </div>
        </div>
        <p className="text-muted-foreground line-clamp-2 min-h-8 text-xs leading-relaxed">
          {bandSummary(policy)}
        </p>
        <p className="text-muted-foreground mt-auto text-xs">
          {assignmentLabel(policy.linkedProfileCount)}
        </p>
      </button>
    </li>
  );
}
