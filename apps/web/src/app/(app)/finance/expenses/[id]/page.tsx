'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Banknote, ExternalLink, FolderKanban, Pencil, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import { formatAmount, getExpenseStage } from '@/features/finance/constants/finance';
import {
  EXPENSE_LIST_SORT_BY_QUERY,
  EXPENSE_LIST_SORT_ORDER_QUERY,
  parseExpenseListSortByParam,
  parseExpenseListSortOrderParam,
} from '@/features/finance/constants/expenses-list-query';
import {
  EXPENSE_FROM_BACKLOG_QUERY,
  EXPENSE_FROM_BACKLOG_VALUE,
  EXPENSE_PLAN_DRILLDOWN_QUERY,
  PROJECT_EXPENSES_DRILLDOWN_QUERY,
  financeExpensesListHref,
} from '@/features/finance/constants/project-expenses-drilldown';
import { expenseDetailPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { formatExpenseBacklogReasonLabel } from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import { AddExpensePaymentDialog } from '@/features/finance/components/expenses/AddExpensePaymentDialog';
import { DeleteExpenseDialog } from '@/features/finance/components/expenses/DeleteExpenseDialog';
import { EditExpenseDialog } from '@/features/finance/components/expenses/EditExpenseDialog';
import { FinanceProofAttachments } from '@/features/finance/components/FinanceProofAttachments';
import { ExpenseDetailPaymentSection } from '@/features/finance/components/expenses/ExpenseDetailPaymentSection';
import { ExpenseDetailStageGateBlockers } from '@/features/finance/components/expenses/ExpenseDetailStageGateBlockers';
import {
  buildExpenseGateRequiredFields,
  EXPENSE_GATE_FIELD_STATUS,
  expenseStageGateSectionClass,
  type ExpenseDetailStageGateHighlight,
} from '@/features/finance/constants/expense-stage-gate-highlight';
import {
  clearExpenseStageGatePending,
  readExpenseStageGatePending,
} from '@/features/finance/constants/expense-stage-gate-pending';
import { ExpensePayrollLinkBanner } from '@/features/finance/components/expenses/ExpensePayrollLinkBanner';
import { ExpensePlanLinkBanner } from '@/features/finance/components/expenses/ExpensePlanLinkBanner';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api-errors';
import { expensesApi, type Expense } from '@/lib/api/finance';
import {
  resolveExpensePayrollMonthLabel,
  resolveExpensePayrollRunId,
} from '@/features/finance/utils/parse-payroll-expense-notes';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function ExpenseDetailPageInner() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const listProjectId = searchParams.get(PROJECT_EXPENSES_DRILLDOWN_QUERY);
  const listExpensePlanId = searchParams.get(EXPENSE_PLAN_DRILLDOWN_QUERY);
  const listSort = {
    sortBy: parseExpenseListSortByParam(searchParams.get(EXPENSE_LIST_SORT_BY_QUERY)),
    sortOrder: parseExpenseListSortOrderParam(searchParams.get(EXPENSE_LIST_SORT_ORDER_QUERY)),
  };
  const fromBacklog = searchParams.get(EXPENSE_FROM_BACKLOG_QUERY) === EXPENSE_FROM_BACKLOG_VALUE;
  const expensesListHref = financeExpensesListHref(listProjectId, listSort, {
    fromBacklog,
    expensePlanId: listExpensePlanId?.trim() || undefined,
  });
  const expenseBackNavAriaLabel = fromBacklog ? 'Back to deferred backlog' : 'Back to expenses';

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [stageGateHighlight, setStageGateHighlight] =
    useState<ExpenseDetailStageGateHighlight | null>(null);

  useEffect(() => {
    if (!id) return;
    const pending = readExpenseStageGatePending(id);
    if (pending) {
      setStageGateHighlight(pending);
      clearExpenseStageGatePending(id);
    }
  }, [id]);

  const gateRequiredFields = useMemo(
    () => buildExpenseGateRequiredFields(stageGateHighlight),
    [stageGateHighlight],
  );

  const fetchExpense = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await expensesApi.getById(id);
      setExpense(data);
      setError(null);
    } catch (caught) {
      setExpense(null);
      setError(
        getApiErrorMessage(caught, 'Expense could not be loaded. It may have been removed.'),
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchExpense();
  }, [fetchExpense]);

  const financeDocTitle = useMemo(
    () =>
      expenseDetailPageTitle({
        loading,
        loadFailed: Boolean(error || !expense),
        expenseName: expense?.name,
        fromBacklog,
        hasProjectDrilldown: Boolean(listProjectId?.trim()),
      }),
    [loading, error, expense, fromBacklog, listProjectId],
  );

  useFinanceDocumentTitle(financeDocTitle);

  const payrollBanner = useMemo((): {
    payrollRunId: string;
    payrollMonth: string | null;
  } | null => {
    if (!expense) return null;
    const payrollRunId = resolveExpensePayrollRunId(expense);
    if (!payrollRunId) return null;
    return {
      payrollRunId,
      payrollMonth: resolveExpensePayrollMonthLabel(expense),
    };
  }, [expense]);

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-5">
        <LoadingState count={4} />
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="flex h-full flex-col gap-5">
        <div className="flex items-center gap-2">
          <Link
            href={expensesListHref}
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
            aria-label={expenseBackNavAriaLabel}
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-foreground text-2xl font-semibold">Expense</h1>
        </div>
        <ErrorState description={error ?? 'Not found'} onRetry={fetchExpense} />
      </div>
    );
  }

  const stage = getExpenseStage(expense.status);

  const handleDeleteExpense = async () => {
    setDeleteError(null);
    setDeleteSubmitting(true);
    try {
      await expensesApi.delete(expense.id);
      router.replace(expensesListHref);
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
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href={expensesListHref}
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'mt-0.5 shrink-0')}
            aria-label={expenseBackNavAriaLabel}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-foreground text-2xl font-semibold">{expense.name}</h1>
            <p className="text-muted-foreground mt-1 font-mono text-xs">{expense.id}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setPaymentOpen(true)}>
            <Banknote size={16} />
            Add payment
          </Button>
          <Button type="button" onClick={() => setEditOpen(true)}>
            <Pencil size={16} />
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            className="text-destructive hover:bg-destructive/10 border-destructive/40"
            onClick={() => {
              setDeleteError(null);
              setDeleteOpen(true);
            }}
          >
            <Trash2 size={16} />
            Delete
          </Button>
        </div>
      </div>

      <EditExpenseDialog
        expense={expense}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={(updated) => setExpense(updated)}
      />

      <AddExpensePaymentDialog
        expenseId={expense.id}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        onRecorded={(updated) => setExpense(updated)}
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

      {expense.linkedExpensePlan?.id && expense.linkedExpensePlan.name ? (
        <ExpensePlanLinkBanner
          planId={expense.linkedExpensePlan.id}
          planName={expense.linkedExpensePlan.name}
        />
      ) : null}

      {payrollBanner ? (
        <ExpensePayrollLinkBanner
          payrollRunId={payrollBanner.payrollRunId}
          payrollMonth={payrollBanner.payrollMonth}
        />
      ) : null}

      <ExpenseDetailStageGateBlockers highlight={stageGateHighlight} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Original amount</p>
          <p className="mt-2 text-lg font-semibold tabular-nums">
            {formatAmount(parseFloat(expense.amount))}
          </p>
        </div>
        <div
          className={expenseStageGateSectionClass(
            gateRequiredFields,
            EXPENSE_GATE_FIELD_STATUS,
            'border-border bg-card rounded-xl border p-4',
          )}
        >
          <p className="text-muted-foreground text-xs">Status</p>
          <div className="mt-2">
            {stage ? <StatusBadge label={stage.label} variant={stage.variant} /> : expense.status}
          </div>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Type</p>
          <div className="mt-2">
            <StatusBadge
              label={expense.type}
              variant={expense.type === 'PLANNED' ? 'blue' : 'orange'}
            />
          </div>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Category</p>
          <p className="mt-2 font-medium">{expense.category}</p>
        </div>
      </div>

      <ExpenseDetailPaymentSection
        expense={expense}
        onExpenseUpdated={(updated) => {
          setExpense(updated);
          setStageGateHighlight(null);
        }}
        gateRequiredFields={gateRequiredFields}
      />

      <div className="border-border bg-card rounded-xl border p-4">
        <FinanceProofAttachments
          entityType="EXPENSE"
          entityId={expense.id}
          purpose="EXPENSE_PROOF"
          title="Expense proofs"
        />
      </div>

      {expense.status === 'BACKLOG' || expense.backlogReason ? (
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Backlog reason</p>
          <p className="text-foreground mt-2 font-medium">
            {formatExpenseBacklogReasonLabel(expense.backlogReason)}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Frequency</p>
          <p className="mt-2 font-medium">{expense.frequency}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Due date</p>
          <p className="mt-2 font-medium">{formatDate(expense.dueDate)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Tax status</p>
          <p className="mt-2 font-medium">{expense.taxStatus}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Pass-through</p>
          <p className="mt-2 font-medium">{expense.isPassThrough ? 'Yes' : 'No'}</p>
        </div>
      </div>

      <div className="border-border bg-card rounded-xl border p-4">
        <p className="text-muted-foreground text-xs">Project</p>
        {expense.projectId && expense.project ? (
          <Link
            href={`/projects/${expense.projectId}`}
            className="text-primary mt-2 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
          >
            <FolderKanban size={14} />
            {expense.project.name}
            <ExternalLink size={12} className="opacity-70" aria-hidden />
          </Link>
        ) : (
          <p className="text-muted-foreground mt-2 text-sm">Not linked</p>
        )}
      </div>

      {expense.notes ? (
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Notes</p>
          <p className="text-foreground mt-2 text-sm whitespace-pre-wrap">{expense.notes}</p>
        </div>
      ) : null}

      <p className="text-muted-foreground text-xs">Created {formatDate(expense.createdAt)}</p>
    </div>
  );
}

export default function ExpenseDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full flex-col gap-5">
          <LoadingState count={4} />
        </div>
      }
    >
      <ExpenseDetailPageInner />
    </Suspense>
  );
}
