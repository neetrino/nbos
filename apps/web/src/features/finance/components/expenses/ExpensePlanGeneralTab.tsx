'use client';

import { useEffect, useState } from 'react';
import {
  CalendarDays,
  DollarSign,
  FileOutput,
  FolderKanban,
  Layers,
  StickyNote,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DetailSheetSection,
  InlineField,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { EXPENSE_CATEGORIES } from '@/features/finance/constants/finance';
import { planExpensesDrilldownHref } from '@/features/finance/constants/project-expenses-drilldown';
import {
  EXPENSE_FREQUENCIES,
  PROJECTS_PAGE_SIZE,
} from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import { expensePlanFrequencyLabel } from '@/features/finance/utils/expense-plan-display';
import type { ExpensePlanGeneralDraft } from '@/features/finance/utils/expense-plan-general-form-state';
import type { ExpensePlan } from '@/lib/api/expense-plans';
import { projectsApi, type Project } from '@/lib/api/projects';

const PLAN_CATEGORY_OPTIONS = EXPENSE_CATEGORIES.filter((c) => c.value !== 'OFFICE');

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
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    let cancelled = false;
    projectsApi
      .getAll({ page: 1, pageSize: PROJECTS_PAGE_SIZE })
      .then((res) => {
        if (!cancelled) setProjects(res.items);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const projectOptions = [
    { value: 'none', label: 'None' },
    ...projects.map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` })),
  ];

  return (
    <div className="mx-auto flex w-full max-w-none flex-col gap-4">
      <DetailSheetSection title="Plan" icon={<Layers size={12} />}>
        <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
          <InlineField
            variant="controlled"
            label="Name"
            type="text"
            value={draft.name}
            placeholder="Plan name…"
            disabled={formDisabled}
            onValueChange={(v) => patchDraft({ name: v })}
          />
          <InlineField
            variant="controlled"
            label="Expected amount"
            type="number"
            value={draft.amount}
            placeholder="0"
            icon={<DollarSign size={12} />}
            disabled={formDisabled}
            onValueChange={(v) => patchDraft({ amount: v })}
          />
          <InlineField
            variant="controlled"
            label="Category"
            type="select"
            value={draft.category}
            options={PLAN_CATEGORY_OPTIONS.map((c) => ({ value: c.value, label: c.label }))}
            disabled={formDisabled}
            onValueChange={(v) => v && patchDraft({ category: v })}
          />
          <InlineField
            variant="controlled"
            label="Frequency"
            type="select"
            value={draft.frequency}
            options={EXPENSE_FREQUENCIES.map((f) => ({ value: f.value, label: f.label }))}
            icon={<CalendarDays size={12} />}
            disabled={formDisabled}
            onValueChange={(v) => v && patchDraft({ frequency: v })}
          />
          <InlineField
            variant="controlled"
            label="Next due"
            type="date"
            value={draft.nextDueDate}
            disabled={formDisabled}
            onValueChange={(v) => patchDraft({ nextDueDate: v })}
          />
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
          <InlineField
            variant="controlled"
            label="Project"
            type="select"
            value={draft.projectId}
            options={projectOptions}
            disabled={formDisabled}
            onValueChange={(v) => v && patchDraft({ projectId: v })}
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

      <DetailSheetSection title="Notes" icon={<StickyNote size={12} />}>
        <InlineField
          variant="controlled"
          label="Notes"
          type="textarea"
          value={draft.notes}
          placeholder="Optional notes…"
          disabled={formDisabled}
          onValueChange={(v) => patchDraft({ notes: v })}
        />
      </DetailSheetSection>

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
