'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Banknote, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import {
  DetailSheetFormFooter,
  DetailSheetTabBar,
  EntityDetailSheetContent,
  ErrorState,
  LoadingState,
  StatusBadge,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import { AddExpensePaymentDialog } from '@/features/finance/components/expenses/AddExpensePaymentDialog';
import { DeleteExpenseDialog } from '@/features/finance/components/expenses/DeleteExpenseDialog';
import { ExpenseDetailPaymentSection } from '@/features/finance/components/expenses/ExpenseDetailPaymentSection';
import { ExpenseDetailStageGateBlockers } from '@/features/finance/components/expenses/ExpenseDetailStageGateBlockers';
import { ExpenseGeneralTab } from '@/features/finance/components/expenses/ExpenseGeneralTab';
import {
  EXPENSE_DETAIL_SHEET_TABS,
  type ExpenseDetailSheetTab,
} from '@/features/finance/components/expenses/expense-detail-sheet-tabs';
import {
  expenseListWithOpenExpenseHref,
  type ExpenseListHrefOptions,
  type ExpenseListNavigationSort,
} from '@/features/finance/constants/project-expenses-drilldown';
import {
  buildExpenseGateRequiredFields,
  type ExpenseDetailStageGateHighlight,
} from '@/features/finance/constants/expense-stage-gate-highlight';
import {
  clearExpenseStageGatePending,
  readExpenseStageGatePending,
} from '@/features/finance/constants/expense-stage-gate-pending';
import { formatAmount, getExpenseStage } from '@/features/finance/constants/finance';
import { useExpenseDetail } from '@/features/finance/hooks/use-expense-detail';
import {
  buildExpenseGeneralPatch,
  canSubmitExpenseGeneralDraft,
  createExpenseGeneralDraft,
  isExpenseGeneralDirty,
  type ExpenseGeneralDraft,
} from '@/features/finance/utils/expense-general-form-state';
import { getApiErrorMessage } from '@/lib/api-errors';
import { expensesApi, type Expense } from '@/lib/api/finance';

export interface ExpenseDetailSheetProps {
  expenseId: string | null;
  /** List-row snapshot for instant sheet header while detail hydrates. */
  initialExpense?: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listProjectId?: string | null;
  listSort?: ExpenseListNavigationSort;
  listHrefOptions?: ExpenseListHrefOptions;
  /** Open Payments tab first (Pay Now payroll cards). */
  payrollPaymentFocus?: boolean;
  onExpenseUpdated?: (expense: Expense) => void;
  onExpenseDeleted?: (expenseId: string) => void;
  /** Stack above a parent entity sheet (related-item open from tab). */
  forceNestedBackdrop?: boolean;
}

export function ExpenseDetailSheet({
  expenseId,
  initialExpense = null,
  open,
  onOpenChange,
  listProjectId = null,
  listSort,
  listHrefOptions,
  payrollPaymentFocus = false,
  onExpenseUpdated,
  onExpenseDeleted,
  forceNestedBackdrop = false,
}: ExpenseDetailSheetProps) {
  const activeExpenseId = open && expenseId ? expenseId : '';
  const { expense, setExpense, loading, error, fetchExpense } = useExpenseDetail(activeExpenseId, {
    open,
    initialExpense,
    isDirty: () => generalDirtyRef.current,
  });
  const [activeTab, setActiveTab] = useState<ExpenseDetailSheetTab>('general');
  const [generalDraft, setGeneralDraft] = useState<ExpenseGeneralDraft | null>(null);
  const [generalSnap, setGeneralSnap] = useState<ExpenseGeneralDraft | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [localStageGate, setLocalStageGate] = useState<ExpenseDetailStageGateHighlight | null>(
    null,
  );
  const generalDirtyRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setPaymentOpen(false);
      setDeleteOpen(false);
      setActiveTab('general');
      setLocalStageGate(null);
    }
  }, [open]);

  useEffect(() => {
    setActiveTab(payrollPaymentFocus ? 'payments' : 'general');
  }, [expenseId, open, payrollPaymentFocus]);

  useEffect(() => {
    if (!open || !expenseId) return;
    const pending = readExpenseStageGatePending(expenseId);
    if (pending) {
      setLocalStageGate(pending);
      clearExpenseStageGatePending(expenseId);
      setActiveTab('payments');
    }
  }, [open, expenseId]);

  useLayoutEffect(() => {
    if (!expense) {
      setGeneralDraft(null);
      setGeneralSnap(null);
      return;
    }
    if (generalDirtyRef.current) return;
    const next = createExpenseGeneralDraft(expense);
    setGeneralDraft(next);
    setGeneralSnap(next);
  }, [
    expense?.id,
    expense?.name,
    expense?.amount,
    expense?.type,
    expense?.category,
    expense?.frequency,
    expense?.status,
    expense?.dueDate,
    expense?.projectId,
    expense?.isPassThrough,
    expense?.taxStatus,
    expense?.backlogReason,
    expense?.notes,
  ]);

  const stageGateHighlight = localStageGate;
  const gateRequiredFields = useMemo(
    () => buildExpenseGateRequiredFields(stageGateHighlight),
    [stageGateHighlight],
  );

  const patchGeneralDraft = useCallback((partial: Partial<ExpenseGeneralDraft>) => {
    setGeneralDraft((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  const generalDirty =
    generalDraft != null && generalSnap != null && isExpenseGeneralDirty(generalDraft, generalSnap);
  generalDirtyRef.current = generalDirty;

  const handleExpenseChange = useCallback(
    (updated: Expense) => {
      onExpenseUpdated?.(updated);
      generalDirtyRef.current = false;
      const next = createExpenseGeneralDraft(updated);
      setGeneralDraft(next);
      setGeneralSnap(next);
      setExpense(updated);
      setLocalStageGate(null);
    },
    [onExpenseUpdated, setExpense],
  );

  const handleGeneralSave = useCallback(() => {
    if (!expense || !generalDraft || !generalSnap) return;
    if (!canSubmitExpenseGeneralDraft(generalDraft)) return;
    setGeneralError(null);
    const patch = buildExpenseGeneralPatch(generalSnap, generalDraft);
    if (Object.keys(patch).length === 0) return;

    const draftAtSave = generalDraft;
    const snapAtSave = generalSnap;
    setGeneralSnap({ ...draftAtSave });
    setSaving(true);

    void (async () => {
      try {
        const updated = await expensesApi.update(expense.id, patch);
        generalDirtyRef.current = false;
        handleExpenseChange(updated);
        toast.success('Expense updated');
      } catch (caught) {
        setGeneralSnap(snapAtSave);
        setGeneralDraft(draftAtSave);
        setGeneralError(getApiErrorMessage(caught, 'Could not save expense changes.'));
      } finally {
        setSaving(false);
      }
    })();
  }, [expense, generalDraft, generalSnap, handleExpenseChange]);

  const handleGeneralCancel = useCallback(() => {
    setGeneralError(null);
    if (generalSnap) setGeneralDraft({ ...generalSnap });
  }, [generalSnap]);

  const handleDeleteExpense = useCallback(async () => {
    if (!expense) return;
    setDeleteError(null);
    setDeleteSubmitting(true);
    try {
      await expensesApi.delete(expense.id);
      onExpenseDeleted?.(expense.id);
      onOpenChange(false);
    } catch (caught) {
      setDeleteError(
        getApiErrorMessage(
          caught,
          'Expense could not be deleted. Check your connection and try again.',
        ),
      );
    } finally {
      setDeleteSubmitting(false);
    }
  }, [expense, onExpenseDeleted, onOpenChange]);

  if (!expenseId) return null;

  const sourcePageHref = expenseListWithOpenExpenseHref(
    expenseId,
    listProjectId,
    listSort,
    listHrefOptions,
  );
  const stage = expense ? getExpenseStage(expense.status) : null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <EntityDetailSheetContent
          open={open}
          layout="full"
          width="compact"
          sourcePageHref={sourcePageHref}
          forceNestedBackdrop={forceNestedBackdrop}
        >
          <div className="bg-background border-border shrink-0 border-b px-5 pt-5 pb-3">
            {loading && !expense ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : expense ? (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-2">
                    <Receipt className="text-muted-foreground size-5 shrink-0" aria-hidden />
                    <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
                      {generalDraft?.name.trim() || expense.name}
                    </h2>
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-sm tabular-nums">
                    {formatAmount(parseFloat(expense.amount))}
                    {stage ? (
                      <>
                        <span className="mx-1.5">·</span>
                        {stage.label}
                      </>
                    ) : null}
                  </p>
                </div>
                {stage ? <StatusBadge label={stage.label} variant={stage.variant} /> : null}
              </div>
            ) : null}
          </div>

          <DetailSheetTabBar
            tabs={EXPENSE_DETAIL_SHEET_TABS}
            activeTab={activeTab}
            onTabChange={(value) => setActiveTab(value as ExpenseDetailSheetTab)}
          />

          <ScrollArea className="min-h-0 flex-1">
            <div className="px-5 py-5">
              <ExpenseDetailStageGateBlockers highlight={stageGateHighlight} />
              {loading && !expense ? (
                <LoadingState count={3} />
              ) : error && !expense ? (
                <ErrorState description={error} onRetry={() => void fetchExpense()} />
              ) : expense && generalDraft ? (
                <>
                  {activeTab === 'general' ? (
                    <ExpenseGeneralTab
                      expense={expense}
                      draft={generalDraft}
                      patchDraft={patchGeneralDraft}
                      gateRequiredFields={gateRequiredFields}
                      formDisabled={saving}
                      onDeleteClick={() => {
                        setDeleteError(null);
                        setDeleteOpen(true);
                      }}
                    />
                  ) : null}
                  {activeTab === 'payments' ? (
                    <div className="flex flex-col gap-4">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="self-start"
                        onClick={() => setPaymentOpen(true)}
                      >
                        <Banknote size={14} aria-hidden />
                        Add payment
                      </Button>
                      <ExpenseDetailPaymentSection
                        expense={expense}
                        onExpenseUpdated={handleExpenseChange}
                        gateRequiredFields={gateRequiredFields}
                      />
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </ScrollArea>

          <DetailSheetFormFooter
            visible={activeTab === 'general' && Boolean(expense && generalDraft)}
            dirty={generalDirty}
            saving={saving}
            errorMessage={generalError}
            onSave={handleGeneralSave}
            onCancel={handleGeneralCancel}
          />
        </EntityDetailSheetContent>
      </Sheet>

      {expense ? (
        <>
          <AddExpensePaymentDialog
            expenseId={expense.id}
            open={paymentOpen}
            onOpenChange={setPaymentOpen}
            onRecorded={handleExpenseChange}
          />
          <DeleteExpenseDialog
            expenseName={expense.name}
            open={deleteOpen}
            isSubmitting={deleteSubmitting}
            errorMessage={deleteError}
            onOpenChange={(next) => {
              setDeleteOpen(next);
              if (!next) setDeleteError(null);
            }}
            onConfirm={handleDeleteExpense}
          />
        </>
      ) : null}
    </>
  );
}
