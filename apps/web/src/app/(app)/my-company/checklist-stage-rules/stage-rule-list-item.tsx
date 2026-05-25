'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import {
  EXTENSION_SIZES,
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
} from '@/features/projects/constants/projects';
import type {
  DeliveryChecklistTarget,
  DeliveryStageCanon,
  DeliveryStageChecklistRuleRow,
} from '@/lib/api/checklist-templates';
import { PermissionGate } from '@/lib/permissions';
import { cn } from '@/lib/utils';

function labelFromOptions(
  options: readonly { value: string; label: string }[],
  value: string | null | undefined,
  fallback: string,
): string {
  if (value == null || value === '') return fallback;
  return options.find((o) => o.value === value)?.label ?? value;
}

const TARGET_LABEL: Record<DeliveryChecklistTarget, string> = {
  PRODUCT: 'Product',
  EXTENSION: 'Extension',
};

const STAGE_LABEL: Record<DeliveryStageCanon, string> = {
  STARTING: 'Starting',
  DEVELOPMENT: 'Development',
  QA: 'QA',
  TRANSFER: 'Transfer',
};

type Props = {
  row: DeliveryStageChecklistRuleRow;
  onToggleActive: (row: DeliveryStageChecklistRuleRow) => void;
  onDelete: (id: string) => void;
};

export function StageRuleListItem({ row, onToggleActive, onDelete }: Props) {
  return (
    <li
      className={cn(
        'border-border/80 flex flex-col gap-4 border-b px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6',
        !row.isActive && 'bg-muted/20',
      )}
    >
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={TARGET_LABEL[row.target]} variant="indigo" />
          <StatusBadge label={STAGE_LABEL[row.deliveryStage]} variant="violet" />
          <StatusBadge
            label={row.isActive ? 'Active' : 'Paused'}
            variant={row.isActive ? 'green' : 'gray'}
          />
        </div>
        <p className="text-foreground text-base font-medium tracking-tight">
          {row.checklistTemplate.name}
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Priority {row.priority}
          {row.target === 'PRODUCT' ? (
            <>
              {' '}
              · Category{' '}
              {labelFromOptions([...PRODUCT_CATEGORIES], row.filterProductCategory, 'any')} · Type{' '}
              {labelFromOptions([...PRODUCT_TYPES], row.filterProductType, 'any')}
            </>
          ) : (
            <>
              {' '}
              · Extension size{' '}
              {labelFromOptions([...EXTENSION_SIZES], row.filterExtensionSize, 'any')}
            </>
          )}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <PermissionGate module="CHECKLIST_TEMPLATES" action="EDIT">
          <Button variant="outline" size="sm" onClick={() => void onToggleActive(row)}>
            {row.isActive ? 'Pause' : 'Activate'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10"
            aria-label="Delete rule"
            onClick={() => void onDelete(row.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </PermissionGate>
      </div>
    </li>
  );
}
