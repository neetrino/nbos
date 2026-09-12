'use client';

import { useMemo, useState } from 'react';
import { DollarSign, Layers, LayoutGrid } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DETAIL_SHEET_TAB_BODY_STRETCH_CLASS,
  DetailSheetOptionalDescription,
  DetailSheetSection,
  InlineField,
  StatusBadge,
} from '@/components/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { FinanceProductCredentialFields } from '@/features/finance/components/FinanceProductCredentialFields';
import { Label } from '@/components/ui/label';
import { ExpensePayrollLinkBanner } from '@/features/finance/components/expenses/ExpensePayrollLinkBanner';
import { ExpensePlanLinkBanner } from '@/features/finance/components/expenses/ExpensePlanLinkBanner';
import { FinanceProofAttachments } from '@/features/finance/components/FinanceProofAttachments';
import { EXPENSE_CATEGORIES, formatAmount } from '@/features/finance/constants/finance';
import { expenseLedgerPaymentStatusPresentation } from '@/features/finance/constants/expense-ledger-payment-status';
import {
  EXPENSE_BACKLOG_REASONS,
  EXPENSE_FREQUENCIES,
  EXPENSE_SHEET_FIELD_CELL_CLASS,
  EXPENSE_SHEET_FIELD_ROW_2_CLASS,
  EXPENSE_SHEET_FIELD_ROW_3_CLASS,
  EXPENSE_TYPES,
  TAX_STATUSES,
} from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import type { ExpenseGeneralDraft } from '@/features/finance/utils/expense-general-form-state';
import type { Expense } from '@/lib/api/finance';
import { projectDisplayName } from '@/lib/format/project-product-display';
import {
  resolveExpensePayrollMonthLabel,
  resolveExpensePayrollRunId,
  resolveExpenseSalaryLineId,
} from '@/features/finance/utils/parse-payroll-expense-notes';
import {
  buildExpenseSelectOptions,
  translateExpenseBacklogReason,
  translateExpenseCategory,
  translateExpenseFrequency,
  translateExpensePaymentStatus,
  translateExpenseTaxStatus,
  translateExpenseType,
} from './expense-i18n-labels';

interface ExpenseGeneralTabProps {
  expense: Expense;
  draft: ExpenseGeneralDraft;
  patchDraft: (partial: Partial<ExpenseGeneralDraft>) => void;
  formDisabled?: boolean;
}

export function ExpenseGeneralTab({
  expense,
  draft,
  patchDraft,
  formDisabled = false,
}: ExpenseGeneralTabProps) {
  const t = useTranslations('expenses');
  const productLabelSeed = expense.product?.name ?? null;
  const credentialLabelSeed = expense.credential?.name ?? null;
  const [productLabel, setProductLabel] = useState(productLabelSeed);
  const [credentialLabel, setCredentialLabel] = useState(credentialLabelSeed);
  const labelSeed = `${expense.id}:${expense.productId ?? ''}:${expense.credentialId ?? ''}`;
  const [labelSeedSeen, setLabelSeedSeen] = useState(labelSeed);
  if (labelSeed !== labelSeedSeen) {
    setLabelSeedSeen(labelSeed);
    setProductLabel(productLabelSeed);
    setCredentialLabel(credentialLabelSeed);
  }

  const categoryOptions = useMemo(
    () =>
      buildExpenseSelectOptions(EXPENSE_CATEGORIES, expense.category, (value) =>
        translateExpenseCategory(value, t),
      ),
    [expense.category, t],
  );
  const frequencyOptions = useMemo(
    () =>
      buildExpenseSelectOptions(EXPENSE_FREQUENCIES, expense.frequency, (value) =>
        translateExpenseFrequency(value, t),
      ),
    [expense.frequency, t],
  );

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
        <StatusBadge
          label={translateExpensePaymentStatus(expense.paymentStatus!, t)}
          variant={ledgerPresentation.variant}
        />
      </div>
    ) : null;

  return (
    <div className={`${DETAIL_SHEET_TAB_BODY_STRETCH_CLASS} mx-auto w-full max-w-none gap-3`}>
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

      <DetailSheetSection title={t('sheet.sections.general')} icon={<LayoutGrid size={12} />}>
        <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
          {ledgerSummary}
          <InlineField
            variant="controlled"
            label={t('fields.name')}
            type="text"
            value={draft.name}
            placeholder={t('fields.namePlaceholder')}
            disabled={formDisabled}
            onValueChange={(v) => patchDraft({ name: v })}
          />
          <div className={EXPENSE_SHEET_FIELD_ROW_3_CLASS}>
            <InlineField
              variant="controlled"
              label={t('fields.amount')}
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
              label={t('fields.dueDate')}
              type="date"
              value={draft.dueDate}
              disabled={formDisabled}
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(v) => patchDraft({ dueDate: v })}
            />
            <InlineField
              variant="controlled"
              label={t('fields.type')}
              type="select"
              value={draft.type}
              options={EXPENSE_TYPES.map((item) => ({
                value: item.value,
                label: translateExpenseType(item.value, t),
              }))}
              disabled={formDisabled}
              selectMenuTone="highlight"
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(v) => v && patchDraft({ type: v })}
            />
          </div>
          <div className={EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
            <InlineField
              variant="controlled"
              label={t('fields.category')}
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
              label={t('fields.frequency')}
              type="select"
              value={draft.frequency}
              options={frequencyOptions}
              disabled={formDisabled}
              selectMenuTone="highlight"
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(v) => v && patchDraft({ frequency: v })}
            />
          </div>
          {expense.status === 'BACKLOG' || draft.status === 'BACKLOG' ? (
            <InlineField
              variant="controlled"
              label={t('fields.backlogReason')}
              type="select"
              value={draft.backlogReason}
              options={[
                { value: 'none', label: translateExpenseBacklogReason('none', t) },
                ...EXPENSE_BACKLOG_REASONS.map((r) => ({
                  value: r.value,
                  label: translateExpenseBacklogReason(r.value, t),
                })),
              ]}
              disabled={formDisabled}
              onValueChange={(v) => v && patchDraft({ backlogReason: v })}
            />
          ) : null}
          <div className={EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
            <InlineField
              variant="controlled"
              label={t('fields.taxStatus')}
              type="select"
              value={draft.taxStatus}
              options={TAX_STATUSES.map((item) => ({
                value: item.value,
                label: translateExpenseTaxStatus(item.value, t),
              }))}
              disabled={formDisabled}
              selectMenuTone="highlight"
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(v) => v && patchDraft({ taxStatus: v })}
            />
          </div>
          <FinanceProductCredentialFields
            productId={draft.productId || null}
            productLabel={productLabel}
            credentialId={draft.credentialId || null}
            credentialLabel={credentialLabel}
            projectHint={draft.productId ? null : projectDisplayName(expense.project)}
            disabled={formDisabled}
            onProductSelect={(id, label) => {
              patchDraft({ productId: id });
              setProductLabel(label);
            }}
            onProductClear={() => {
              patchDraft({ productId: '' });
              setProductLabel(null);
            }}
            onCredentialSelect={(id, label) => {
              patchDraft({ credentialId: id });
              setCredentialLabel(label);
            }}
            onCredentialClear={() => {
              patchDraft({ credentialId: '' });
              setCredentialLabel(null);
            }}
          />
          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id={`expense-pass-${expense.id}`}
              checked={draft.isPassThrough}
              disabled={formDisabled}
              onCheckedChange={(v) => patchDraft({ isPassThrough: v === true })}
            />
            <Label htmlFor={`expense-pass-${expense.id}`} className="text-sm font-normal">
              {t('fields.passThrough')}
            </Label>
          </div>
        </div>
      </DetailSheetSection>

      <DetailSheetSection title={t('sheet.sections.proofs')} icon={<Layers size={12} />}>
        <FinanceProofAttachments
          entityType="EXPENSE"
          entityId={expense.id}
          purpose="EXPENSE_PROOF"
          title=""
        />
      </DetailSheetSection>

      <DetailSheetOptionalDescription
        entityType="expense"
        entityId={expense.id}
        value={draft.notes}
        label={t('fields.notes')}
        placeholder={t('fields.notesPlaceholder')}
        onChange={(notes) => patchDraft({ notes: notes ?? '' })}
        disabled={formDisabled}
      />
    </div>
  );
}
