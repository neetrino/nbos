'use client';

import { ListChecks, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import { PRODUCT_CATEGORIES } from '@/features/projects/constants/projects';
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
        'flex items-center gap-2.5 rounded-xl px-1.5 py-1.5',
        !row.isActive && 'opacity-55',
      )}
    >
      <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
        <ListChecks size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-medium">{row.checklistTemplate.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          {TARGET_LABEL[row.target]} · {STAGE_LABEL[row.deliveryStage]} · Priority {row.priority}
          {row.target === 'PRODUCT'
            ? ` · ${labelFromOptions([...PRODUCT_CATEGORIES], row.filterProductCategory, 'any category')}`
            : ''}
        </p>
      </div>
      <StatusBadge
        label={row.isActive ? 'Active' : 'Paused'}
        variant={row.isActive ? 'green' : 'gray'}
      />
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
