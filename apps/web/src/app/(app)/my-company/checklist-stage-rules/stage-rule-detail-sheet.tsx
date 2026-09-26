'use client';

import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  DetailSheetSection,
  EntityDetailSheetContent,
  InlineField,
  StatusBadge,
} from '@/components/shared';
import { PRODUCT_CATEGORIES, PRODUCT_TYPES } from '@/features/projects/constants/projects';
import type { DeliveryStageChecklistRuleRow } from '@/lib/api/checklist-templates';
import { PermissionGate } from '@/lib/permissions';
import { DELIVERY_STAGES, TARGETS } from './delivery-stage-rule-options';
import {
  TEAM_SHEET_BODY_CLASS,
  TEAM_SHEET_HEADER_CLASS,
} from '@/features/hr/constants/team-sheet-layout';

function optionLabel(
  options: readonly { value: string; label: string }[],
  value: string | null | undefined,
  fallback: string,
): string {
  if (value == null || value === '') return fallback;
  return options.find((option) => option.value === value)?.label ?? value;
}

export function StageRuleDetailSheet({
  rule,
  open,
  onOpenChange,
  onToggleActive,
  onDelete,
}: {
  rule: DeliveryStageChecklistRuleRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleActive: (row: DeliveryStageChecklistRuleRow) => void;
  onDelete: (row: DeliveryStageChecklistRuleRow) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent
        open={open}
        layout="auxiliary"
        sourcePageHref="/my-company/checklist-stage-rules"
      >
        {rule ? (
          <StageRuleDetailBody rule={rule} onToggleActive={onToggleActive} onDelete={onDelete} />
        ) : null}
      </EntityDetailSheetContent>
    </Sheet>
  );
}

function StageRuleDetailBody({
  rule,
  onToggleActive,
  onDelete,
}: {
  rule: DeliveryStageChecklistRuleRow;
  onToggleActive: (row: DeliveryStageChecklistRuleRow) => void;
  onDelete: (row: DeliveryStageChecklistRuleRow) => void;
}) {
  const category = optionLabel([...PRODUCT_CATEGORIES], rule.filterProductCategory, 'Any category');
  const productType = optionLabel([...PRODUCT_TYPES], rule.filterProductType, 'Any type');

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={TEAM_SHEET_HEADER_CLASS}>
        <div className="flex items-start justify-between gap-2">
          <h2 className="truncate text-base font-semibold">{rule.checklistTemplate.name}</h2>
          <StatusBadge
            label={rule.isActive ? 'Active' : 'Paused'}
            variant={rule.isActive ? 'green' : 'gray'}
          />
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          This checklist starts when a matching delivery item enters the stage.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className={TEAM_SHEET_BODY_CLASS}>
          <DetailSheetSection title="When it starts" outlined>
            <div className="grid gap-3">
              <ReadOnlyField label="Checklist" value={rule.checklistTemplate.name} />
              <ReadOnlyField
                label="Applies to"
                value={optionLabel(TARGETS, rule.target, rule.target)}
              />
              <ReadOnlyField
                label="Delivery stage"
                value={optionLabel(DELIVERY_STAGES, rule.deliveryStage, rule.deliveryStage)}
              />
              <ReadOnlyField label="Priority" value={String(rule.priority)} />
              <p className="text-muted-foreground text-xs">Lower priority runs first.</p>
            </div>
          </DetailSheetSection>
          <DetailSheetSection title="Filters" outlined>
            {rule.target === 'PRODUCT' ? (
              <div className="grid gap-3">
                <ReadOnlyField label="Product category" value={category} />
                <ReadOnlyField label="Product type" value={productType} />
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                Applies to every extension in this stage.
              </p>
            )}
          </DetailSheetSection>
        </div>
      </div>
      <PermissionGate module="CHECKLIST_TEMPLATES" action="EDIT">
        <div className="border-border flex shrink-0 justify-end gap-2 border-t px-5 py-3">
          <Button type="button" variant="outline" size="sm" onClick={() => onToggleActive(rule)}>
            {rule.isActive ? 'Pause' : 'Activate'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(rule)}
          >
            Delete rule
          </Button>
        </div>
      </PermissionGate>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <InlineField
      variant="controlled"
      label={label}
      value={value}
      disabled
      onValueChange={() => undefined}
    />
  );
}
