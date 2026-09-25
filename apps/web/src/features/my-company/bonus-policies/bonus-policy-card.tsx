'use client';

import { Percent } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import {
  bonusPolicyTemplateLabel,
  bonusPolicyTemplateOption,
} from '@/features/my-company/bonus-policies/bonus-policy-template-options';
import type { BonusPolicyRow } from '@/lib/api/bonus-policies';
import { cn } from '@/lib/utils';

const STATUS_VARIANT = {
  ACTIVE: 'green',
  DRAFT: 'amber',
  ARCHIVED: 'gray',
} as const;

const STATUS_LABEL = {
  ACTIVE: 'Active',
  DRAFT: 'Draft',
  ARCHIVED: 'Archived',
} as const;

function assignmentLabel(count: number): string {
  if (count === 0) return 'Not assigned';
  if (count === 1) return '1 salary';
  return `${count} salaries`;
}

export function BonusPolicyCard({
  policy,
  onOpen,
}: {
  policy: BonusPolicyRow;
  onOpen: (policy: BonusPolicyRow) => void;
}) {
  const hint = bonusPolicyTemplateOption(policy.templateCode)?.hint;

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(policy)}
        className={cn(
          'border-border bg-card hover:border-primary/40 flex w-full flex-col gap-3 rounded-2xl border p-4 text-left transition-colors',
          policy.status === 'ARCHIVED' && 'opacity-70',
        )}
      >
        <div className="flex items-start gap-3">
          <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
            <Percent className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-sm font-semibold">{policy.name}</p>
              <StatusBadge
                label={STATUS_LABEL[policy.status]}
                variant={STATUS_VARIANT[policy.status]}
                className="shrink-0"
              />
            </div>
            <p className="text-muted-foreground mt-0.5 truncate text-xs">
              {bonusPolicyTemplateLabel(policy.templateCode)}
            </p>
          </div>
        </div>
        {hint ? (
          <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">{hint}</p>
        ) : null}
        <p className="text-muted-foreground text-xs">
          {assignmentLabel(policy.linkedProfileCount)}
        </p>
      </button>
    </li>
  );
}
