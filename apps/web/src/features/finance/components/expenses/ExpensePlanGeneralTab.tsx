'use client';

import { useMemo } from 'react';
import { DollarSign, FileOutput, FolderKanban, Layers, StickyNote } from 'lucide-react';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DetailSheetSection,
  EntityNotesSection,
  InlineField,
  RelationPickerField,
} from '@/components/shared';
import { useProjectRelationSearch } from '@/components/shared/relation-picker/relation-search-loaders';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  EXPENSE_FREQUENCIES,
  EXPENSE_SHEET_FIELD_CELL_CLASS,
  EXPENSE_SHEET_FIELD_ROW_3_CLASS,
} from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import { EXPENSE_CATEGORIES } from '@/features/finance/constants/finance';
import type { ExpensePlanGeneralDraft } from '@/features/finance/utils/expense-plan-general-form-state';
import type { ExpensePlan } from '@/lib/api/expense-plans';

const PLAN_CATEGORY_OPTIONS = EXPENSE_CATEGORIES.filter((c) => c.value !== 'OFFICE');

interface ExpensePlanGeneralTabProps {
  plan: ExpensePlan;
  draft: ExpensePlanGeneralDraft;
  patchDraft: (partial: Partial<ExpensePlanGeneralDraft>) => void;
  formDisabled?: boolean;
  onGenerateClick: () => void;
}

export function ExpensePlanGeneralTab({
  plan,
  draft,
  patchDraft,
  formDisabled = false,
  onGenerateClick,
}: ExpensePlanGeneralTabProps) {
  const searchProjects = useProjectRelationSearch();
  const projectPicker = useRelationPickerActions('project');
  const projectLabel = plan.project ? `${plan.project.code} — ${plan.project.name}` : null;
  const projectValue = draft.projectId === 'none' ? null : draft.projectId;

  const categoryOptions = useMemo((): Array<{ value: string; label: string }> => {
    const items: Array<{ value: string; label: string }> = PLAN_CATEGORY_OPTIONS.map((c) => ({
      value: c.value,
      label: c.label,
    }));
    if (!items.some((c) => c.value === plan.category)) {
      items.push({ value: plan.category, label: plan.category });
    }
    return items;
  }, [plan.category]);

  const frequencyOptions = useMemo((): Array<{ value: string; label: string }> => {
    const items: Array<{ value: string; label: string }> = EXPENSE_FREQUENCIES.map((f) => ({
      value: f.value,
      label: f.label,
    }));
    if (!items.some((f) => f.value === plan.frequency)) {
      items.push({ value: plan.frequency, label: plan.frequency });
    }
    return items;
  }, [plan.frequency]);

  return (
    <div className="mx-auto flex w-full max-w-none flex-col gap-4">
      <DetailSheetSection title="Plan" icon={<Layers size={12} />}>
        <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
          <div className="flex items-end gap-3">
            <InlineField
              variant="controlled"
              label="Expected amount"
              type="money"
              value={draft.amount}
              placeholder="0"
              icon={<DollarSign size={12} />}
              disabled={formDisabled}
              className="min-w-0 flex-1"
              onValueChange={(v) => patchDraft({ amount: v })}
            />
            <Button
              type="button"
              size="lg"
              className="shrink-0 rounded-xl"
              onClick={onGenerateClick}
              disabled={formDisabled}
            >
              <FileOutput size={14} aria-hidden />
              Generate expense card
            </Button>
          </div>
          <div className={EXPENSE_SHEET_FIELD_ROW_3_CLASS}>
            <InlineField
              variant="controlled"
              label="Category"
              type="select"
              value={draft.category}
              options={categoryOptions}
              disabled={formDisabled}
              selectMenuTone="highlight"
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(v) => v && patchDraft({ category: v })}
            />
            <InlineField
              variant="controlled"
              label="Frequency"
              type="select"
              value={draft.frequency}
              options={frequencyOptions}
              disabled={formDisabled}
              selectMenuTone="highlight"
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(v) => v && patchDraft({ frequency: v })}
            />
            <InlineField
              variant="controlled"
              label="Next due"
              type="date"
              value={draft.nextDueDate}
              disabled={formDisabled}
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(v) => patchDraft({ nextDueDate: v })}
            />
          </div>
          <InlineField
            variant="controlled"
            label="Provider"
            type="text"
            value={draft.provider}
            placeholder="Vendor or service…"
            disabled={formDisabled}
            onValueChange={(v) => patchDraft({ provider: v })}
          />
          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id={`plan-auto-${plan.id}`}
              checked={draft.autoGenerate}
              disabled={formDisabled}
              onCheckedChange={(v) => patchDraft({ autoGenerate: v === true })}
            />
            <Label htmlFor={`plan-auto-${plan.id}`} className="text-sm font-normal">
              Auto-generate expense cards
            </Label>
          </div>
          <div className="pt-3 pb-3">
            <div className="border-border/50 border-t pt-3">
              <RelationPickerField
                label="Project"
                entityKind="project"
                value={projectValue}
                selectionLabel={projectLabel}
                placeholder="Optional — search project…"
                icon={<FolderKanban size={12} />}
                disabled={formDisabled}
                onSearch={searchProjects}
                onSelect={(id) => patchDraft({ projectId: id })}
                onClear={() => patchDraft({ projectId: 'none' })}
                {...projectPicker}
              />
            </div>
          </div>
        </div>
      </DetailSheetSection>

      <div className="pt-3">
        <div className="border-border/50 border-t pt-3">
          <EntityNotesSection
            title="Notes"
            icon={<StickyNote size={12} />}
            entityType="expense"
            entityId={plan.id}
            value={draft.notes}
            onChange={(notes) => patchDraft({ notes: notes ?? '' })}
            placeholder="Optional notes…"
            disabled={formDisabled}
          />
        </div>
      </div>
    </div>
  );
}
