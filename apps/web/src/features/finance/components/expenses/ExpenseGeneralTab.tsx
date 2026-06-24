'use client';

import { useEffect, useMemo, useState } from 'react';
import { DollarSign, Layers, LayoutGrid } from 'lucide-react';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DetailSheetSection,
  EntityNotesSection,
  InlineField,
  StatusBadge,
} from '@/components/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ExpensePayrollLinkBanner } from '@/features/finance/components/expenses/ExpensePayrollLinkBanner';
import { ExpensePlanLinkBanner } from '@/features/finance/components/expenses/ExpensePlanLinkBanner';
import { FinanceProofAttachments } from '@/features/finance/components/FinanceProofAttachments';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_STAGES,
  formatAmount,
} from '@/features/finance/constants/finance';
import { expenseLedgerPaymentStatusPresentation } from '@/features/finance/constants/expense-ledger-payment-status';
import {
  EXPENSE_GATE_FIELD_STATUS,
  expenseStageGateFieldClass,
} from '@/features/finance/constants/expense-stage-gate-highlight';
import {
  EXPENSE_BACKLOG_REASONS,
  EXPENSE_FREQUENCIES,
  EXPENSE_SHEET_FIELD_CELL_CLASS,
  EXPENSE_SHEET_FIELD_ROW_2_CLASS,
  EXPENSE_SHEET_FIELD_ROW_3_CLASS,
  EXPENSE_TYPES,
  PROJECTS_PAGE_SIZE,
  TAX_STATUSES,
} from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import type { ExpenseGeneralDraft } from '@/features/finance/utils/expense-general-form-state';
import type { Expense } from '@/lib/api/finance';
import { projectsApi, type Project } from '@/lib/api/projects';
import {
  resolveExpensePayrollMonthLabel,
  resolveExpensePayrollRunId,
  resolveExpenseSalaryLineId,
} from '@/features/finance/utils/parse-payroll-expense-notes';

interface ExpenseGeneralTabProps {
  expense: Expense;
  draft: ExpenseGeneralDraft;
  patchDraft: (partial: Partial<ExpenseGeneralDraft>) => void;
  gateRequiredFields: ReadonlySet<string>;
  formDisabled?: boolean;
}

export function ExpenseGeneralTab({
  expense,
  draft,
  patchDraft,
  gateRequiredFields,
  formDisabled = false,
}: ExpenseGeneralTabProps) {
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

  const categoryOptions = useMemo((): Array<{ value: string; label: string }> => {
    const items: Array<{ value: string; label: string }> = EXPENSE_CATEGORIES.map((c) => ({
      value: c.value,
      label: c.label,
    }));
    if (!items.some((c) => c.value === expense.category)) {
      items.push({ value: expense.category, label: expense.category });
    }
    return items;
  }, [expense.category]);

  const statusOptions = useMemo((): Array<{ value: string; label: string }> => {
    const items: Array<{ value: string; label: string }> = EXPENSE_STAGES.map((s) => ({
      value: s.value,
      label: s.label,
    }));
    if (!items.some((s) => s.value === expense.status)) {
      items.push({ value: expense.status, label: expense.status });
    }
    return items;
  }, [expense.status]);

  const frequencyOptions = useMemo((): Array<{ value: string; label: string }> => {
    const items: Array<{ value: string; label: string }> = EXPENSE_FREQUENCIES.map((f) => ({
      value: f.value,
      label: f.label,
    }));
    if (!items.some((f) => f.value === expense.frequency)) {
      items.push({ value: expense.frequency, label: expense.frequency });
    }
    return items;
  }, [expense.frequency]);

  const projectOptions = [
    { value: 'none', label: 'None' },
    ...projects.map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` })),
  ];

  const payrollRunId = resolveExpensePayrollRunId(expense);
  const payrollMonth = resolveExpensePayrollMonthLabel(expense);
  const salaryLineId = resolveExpenseSalaryLineId(expense);
  const ledgerPresentation =
    expense.paymentStatus !== undefined
      ? expenseLedgerPaymentStatusPresentation(expense.paymentStatus)
      : null;
  const hasLedger = expense.paidAmount !== undefined && expense.remainingAmount !== undefined;

  const ledgerSummary =
    hasLedger && ledgerPresentation ? (
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs tabular-nums">
        <span>
          {formatAmount(parseFloat(expense.paidAmount!))} /{' '}
          {formatAmount(parseFloat(expense.remainingAmount!))}
        </span>
        <StatusBadge label={ledgerPresentation.label} variant={ledgerPresentation.variant} />
      </div>
    ) : null;

  return (
    <div className="mx-auto flex w-full max-w-none flex-col gap-3">
      {expense.linkedExpensePlan?.id && expense.linkedExpensePlan.name ? (
        <ExpensePlanLinkBanner
          planId={expense.linkedExpensePlan.id}
          planName={expense.linkedExpensePlan.name}
        />
      ) : null}

      {payrollRunId ? (
        <ExpensePayrollLinkBanner
          payrollRunId={payrollRunId}
          payrollMonth={payrollMonth}
          salaryLineId={salaryLineId}
        />
      ) : null}

      <DetailSheetSection title="General" icon={<LayoutGrid size={12} />}>
        <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
          {ledgerSummary}
          <InlineField
            variant="controlled"
            label="Name"
            type="text"
            value={draft.name}
            placeholder="Expense name…"
            disabled={formDisabled}
            onValueChange={(v) => patchDraft({ name: v })}
          />
          <div className={EXPENSE_SHEET_FIELD_ROW_3_CLASS}>
            <InlineField
              variant="controlled"
              label="Amount"
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
              label="Due date"
              type="date"
              value={draft.dueDate}
              disabled={formDisabled}
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(v) => patchDraft({ dueDate: v })}
            />
            <InlineField
              variant="controlled"
              label="Type"
              type="select"
              value={draft.type}
              options={EXPENSE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              disabled={formDisabled}
              selectMenuTone="highlight"
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(v) => v && patchDraft({ type: v })}
            />
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
              label="Status"
              type="select"
              value={draft.status}
              options={statusOptions}
              disabled={formDisabled}
              selectMenuTone="highlight"
              className={cn(
                EXPENSE_SHEET_FIELD_CELL_CLASS,
                expenseStageGateFieldClass(gateRequiredFields, EXPENSE_GATE_FIELD_STATUS),
              )}
              onValueChange={(v) => v && patchDraft({ status: v })}
            />
          </div>
          {draft.status === 'BACKLOG' ? (
            <InlineField
              variant="controlled"
              label="Backlog reason"
              type="select"
              value={draft.backlogReason}
              options={[
                { value: 'none', label: 'None' },
                ...EXPENSE_BACKLOG_REASONS.map((r) => ({ value: r.value, label: r.label })),
              ]}
              disabled={formDisabled}
              onValueChange={(v) => v && patchDraft({ backlogReason: v })}
            />
          ) : null}
          <div className={EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
            <InlineField
              variant="controlled"
              label="Tax status"
              type="select"
              value={draft.taxStatus}
              options={TAX_STATUSES.map((t) => ({ value: t.value, label: t.label }))}
              disabled={formDisabled}
              selectMenuTone="highlight"
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(v) => v && patchDraft({ taxStatus: v })}
            />
            <InlineField
              variant="controlled"
              label="Project"
              type="select"
              value={draft.projectId}
              options={projectOptions}
              disabled={formDisabled}
              selectMenuTone="highlight"
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(v) => v && patchDraft({ projectId: v })}
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id={`expense-pass-${expense.id}`}
              checked={draft.isPassThrough}
              disabled={formDisabled}
              onCheckedChange={(v) => patchDraft({ isPassThrough: v === true })}
            />
            <Label htmlFor={`expense-pass-${expense.id}`} className="text-sm font-normal">
              Pass-through
            </Label>
          </div>
        </div>
      </DetailSheetSection>

      <DetailSheetSection title="Proofs" icon={<Layers size={12} />}>
        <FinanceProofAttachments
          entityType="EXPENSE"
          entityId={expense.id}
          purpose="EXPENSE_PROOF"
          title=""
        />
      </DetailSheetSection>

      <EntityNotesSection
        entityType="expense"
        entityId={expense.id}
        value={draft.notes}
        onChange={(notes) => patchDraft({ notes: notes ?? '' })}
        placeholder="Optional notes…"
        disabled={formDisabled}
      />
    </div>
  );
}
