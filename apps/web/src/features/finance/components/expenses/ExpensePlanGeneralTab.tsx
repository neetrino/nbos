'use client';

import {
  CalendarDays,
  DollarSign,
  FileOutput,
  FolderKanban,
  Layers,
  StickyNote,
  Tag,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DetailSheetFieldSegmented,
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
import { planExpensesDrilldownHref } from '@/features/finance/constants/project-expenses-drilldown';
import {
  EXPENSE_COMPACT_FIELD_WIDTH_CLASS,
  EXPENSE_DUE_DATE_FIELD_WIDTH_CLASS,
  EXPENSE_FREQUENCY_SEGMENTED_OPTIONS,
  EXPENSE_PLAN_CATEGORY_SEGMENTED_OPTIONS,
} from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import { expensePlanFrequencyLabel } from '@/features/finance/utils/expense-plan-display';
import type { ExpensePlanGeneralDraft } from '@/features/finance/utils/expense-plan-general-form-state';
import type { ExpensePlan } from '@/lib/api/expense-plans';

interface ExpensePlanGeneralTabProps {
  plan: ExpensePlan;
  draft: ExpensePlanGeneralDraft;
  patchDraft: (partial: Partial<ExpensePlanGeneralDraft>) => void;
  formDisabled?: boolean;
  onGenerateClick: () => void;
  onDeleteClick: () => void;
}

export function ExpensePlanGeneralTab({
  plan,
  draft,
  patchDraft,
  formDisabled = false,
  onGenerateClick,
  onDeleteClick,
}: ExpensePlanGeneralTabProps) {
  const searchProjects = useProjectRelationSearch();
  const projectPicker = useRelationPickerActions('project');
  const projectLabel = plan.project ? `${plan.project.code} — ${plan.project.name}` : null;
  const projectValue = draft.projectId === 'none' ? null : draft.projectId;

  return (
    <div className="mx-auto flex w-full max-w-none flex-col gap-4">
      <DetailSheetSection title="Plan" icon={<Layers size={12} />}>
        <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
          <div className="flex flex-wrap items-start gap-3">
            <InlineField
              variant="controlled"
              label="Name"
              type="text"
              value={draft.name}
              placeholder="Plan name…"
              disabled={formDisabled}
              className="min-w-0 flex-1"
              onValueChange={(v) => patchDraft({ name: v })}
            />
            <InlineField
              variant="controlled"
              label="Expected amount"
              type="money"
              value={draft.amount}
              placeholder="0"
              icon={<DollarSign size={12} />}
              disabled={formDisabled}
              className={EXPENSE_COMPACT_FIELD_WIDTH_CLASS}
              onValueChange={(v) => patchDraft({ amount: v })}
            />
          </div>
          <DetailSheetFieldSegmented
            label="Category"
            icon={<Tag size={12} />}
            value={draft.category}
            options={EXPENSE_PLAN_CATEGORY_SEGMENTED_OPTIONS}
            disabled={formDisabled}
            onValueChange={(category) => patchDraft({ category })}
          />
          <div className="flex flex-wrap items-start gap-3">
            <DetailSheetFieldSegmented
              label="Frequency"
              icon={<CalendarDays size={12} />}
              value={draft.frequency}
              options={EXPENSE_FREQUENCY_SEGMENTED_OPTIONS}
              disabled={formDisabled}
              className="min-w-0 flex-1"
              onValueChange={(frequency) => patchDraft({ frequency })}
            />
            <InlineField
              variant="controlled"
              label="Next due"
              type="date"
              value={draft.nextDueDate}
              disabled={formDisabled}
              className={EXPENSE_DUE_DATE_FIELD_WIDTH_CLASS}
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
        </div>
      </DetailSheetSection>

      <DetailSheetSection title="Linked" icon={<FolderKanban size={12} />}>
        <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
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
          {plan._count.expenses > 0 ? (
            <Link
              href={planExpensesDrilldownHref(plan.id)}
              className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              {plan._count.expenses} linked card{plan._count.expenses === 1 ? '' : 's'} on pay now
            </Link>
          ) : (
            <p className="text-muted-foreground text-sm">No linked expense cards yet.</p>
          )}
          <p className="text-muted-foreground text-xs">
            Frequency on board: {expensePlanFrequencyLabel(plan.frequency)}
          </p>
        </div>
      </DetailSheetSection>

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

      <DetailSheetSection title="Actions">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={onGenerateClick} disabled={formDisabled}>
            <FileOutput size={14} aria-hidden />
            Generate expense card
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-destructive hover:bg-destructive/10 border-destructive/40"
            disabled={formDisabled}
            onClick={onDeleteClick}
          >
            <Trash2 size={14} aria-hidden />
            Delete plan
          </Button>
        </div>
      </DetailSheetSection>
    </div>
  );
}
