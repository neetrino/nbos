'use client';

import { useMemo } from 'react';
import { DollarSign, FolderKanban, Layers } from 'lucide-react';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DETAIL_SHEET_TAB_BODY_STRETCH_CLASS,
  DetailSheetOptionalDescription,
  DetailSheetSection,
  InlineField,
  RelationPickerField,
} from '@/components/shared';
import { useProjectRelationSearch } from '@/components/shared/relation-picker/relation-search-loaders';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { ExpensePlanAutoGenerateField } from '@/features/finance/components/expenses/ExpensePlanAutoGenerateField';
import { expensePlanIsCancelled } from '@/features/finance/utils/expense-plan-status-eligibility';
import {
  EXPENSE_FREQUENCIES,
  EXPENSE_SHEET_FIELD_CELL_CLASS,
  EXPENSE_SHEET_FIELD_ROW_2_CLASS,
} from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import { EXPENSE_CATEGORIES } from '@/features/finance/constants/finance';
import type { ExpensePlanGeneralDraft } from '@/features/finance/utils/expense-plan-general-form-state';
import type { ExpensePlan } from '@/lib/api/expense-plans';
import { projectDisplayName } from '@/lib/format/project-product-display';

const PLAN_CATEGORY_OPTIONS = EXPENSE_CATEGORIES;

interface ExpensePlanGeneralTabProps {
  plan: ExpensePlan;
  draft: ExpensePlanGeneralDraft;
  patchDraft: (partial: Partial<ExpensePlanGeneralDraft>) => void;
  formDisabled?: boolean;
}

export function ExpensePlanGeneralTab({
  plan,
  draft,
  patchDraft,
  formDisabled = false,
}: ExpensePlanGeneralTabProps) {
  const searchProjects = useProjectRelationSearch();
  const projectPicker = useRelationPickerActions('project');
  const projectLabel = projectDisplayName(plan.project);
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

  const cancelled = expensePlanIsCancelled(plan);

  return (
    <div className={`${DETAIL_SHEET_TAB_BODY_STRETCH_CLASS} mx-auto w-full max-w-none gap-4`}>
      {cancelled ? (
        <p className="text-muted-foreground text-sm">
          This plan is stopped. Resume it from the menu to create cards or change the schedule.
        </p>
      ) : null}
      <DetailSheetSection title="Plan" icon={<Layers size={12} />}>
        <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
          <div className={EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
            <InlineField
              variant="controlled"
              label="Expected amount"
              type="money"
              value={draft.amount}
              placeholder="0"
              icon={<DollarSign size={12} />}
              disabled={formDisabled}
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(v) => patchDraft({ amount: v })}
            />
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
          </div>
          <div className={EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
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
          <div className={EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
            <ExpensePlanAutoGenerateField
              checked={draft.autoGenerate}
              disabled={formDisabled}
              onCheckedChange={(autoGenerate) => patchDraft({ autoGenerate })}
            />
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

      <DetailSheetOptionalDescription
        entityType="expense"
        entityId={plan.id}
        value={draft.notes}
        onChange={(notes) => patchDraft({ notes: notes ?? '' })}
        disabled={formDisabled}
      />
    </div>
  );
}
