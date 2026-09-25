'use client';

import { Route } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import { PRODUCT_CATEGORIES } from '@/features/projects/constants/projects';
import type { DeliveryStageChecklistRuleRow } from '@/lib/api/checklist-templates';
import { cn } from '@/lib/utils';
import { DELIVERY_STAGES, TARGETS } from './delivery-stage-rule-options';

function optionLabel(options: readonly { value: string; label: string }[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

function ruleHint(row: DeliveryStageChecklistRuleRow): string {
  const target = optionLabel(TARGETS, row.target);
  const stage = optionLabel(DELIVERY_STAGES, row.deliveryStage);
  if (row.target !== 'PRODUCT' || row.filterProductCategory == null) {
    return `${target} · ${stage}`;
  }
  const category = optionLabel([...PRODUCT_CATEGORIES], row.filterProductCategory);
  return `${target} · ${stage} · ${category}`;
}

export function StageRuleCard({
  row,
  onOpen,
}: {
  row: DeliveryStageChecklistRuleRow;
  onOpen: (row: DeliveryStageChecklistRuleRow) => void;
}) {
  return (
    <li className="flex min-w-0">
      <button
        type="button"
        onClick={() => onOpen(row)}
        className={cn(
          'border-border bg-card hover:border-primary/40 flex h-full w-full min-w-0 flex-col gap-3 rounded-2xl border p-4 text-left transition-colors',
          !row.isActive && 'opacity-70',
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
            <Route className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                {row.checklistTemplate.name}
              </p>
              <StatusBadge
                label={row.isActive ? 'Active' : 'Paused'}
                variant={row.isActive ? 'green' : 'gray'}
                className="shrink-0"
              />
            </div>
            <p className="text-muted-foreground mt-0.5 truncate text-xs">{ruleHint(row)}</p>
          </div>
        </div>
        <p className="text-muted-foreground line-clamp-2 min-h-8 text-xs leading-relaxed">
          Starts this checklist when a delivery item enters the stage.
        </p>
        <p className="text-muted-foreground mt-auto text-xs">Priority {row.priority}</p>
      </button>
    </li>
  );
}
