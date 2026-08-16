'use client';

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'sonner';
import type { ExpenseDetailSheetTab } from '@/features/finance/components/expenses/expense-detail-sheet-tabs';
import type { ExpenseDetailStageGateHighlight } from '@/features/finance/constants/expense-stage-gate-highlight';
import { EXPENSE_GATE_FIELD_PAYMENTS } from '@/features/finance/constants/expense-stage-gate-highlight';
import {
  getLocalExpenseStatusGateErrors,
  mapExpenseStatusApiMessage,
} from '@/features/finance/constants/expense-status-gate-client';
import { ApiError, getApiErrorMessage, isStageGateApiError } from '@/lib/api-errors';
import { expensesApi, type Expense } from '@/lib/api/finance';

interface UseExpenseSheetStatusChangeParams {
  expense: Expense | null;
  onExpenseUpdated?: (expense: Expense) => void;
  setExpense: Dispatch<SetStateAction<Expense | null>>;
  setLocalStageGate: (highlight: ExpenseDetailStageGateHighlight | null) => void;
  setActiveTab: (tab: ExpenseDetailSheetTab) => void;
  syncDraftStatus: (status: string) => void;
}

/** Immediate status moves from the expense sheet pipeline bar (parity with invoice money bar). */
export function useExpenseSheetStatusChange({
  expense,
  onExpenseUpdated,
  setExpense,
  setLocalStageGate,
  setActiveTab,
  syncDraftStatus,
}: UseExpenseSheetStatusChangeParams) {
  const [statusBusy, setStatusBusy] = useState(false);

  const handleStatusChange = useCallback(
    async (status: string) => {
      if (!expense || expense.status === status || statusBusy) return;

      const localErrors = getLocalExpenseStatusGateErrors(expense, status);
      if (localErrors.length > 0) {
        setLocalStageGate({ errors: localErrors });
        if (localErrors.some((error) => error.field === EXPENSE_GATE_FIELD_PAYMENTS)) {
          setActiveTab('payments');
        }
        return;
      }

      setStatusBusy(true);
      try {
        const updated = await expensesApi.update(expense.id, { status });
        setExpense(updated);
        onExpenseUpdated?.(updated);
        syncDraftStatus(updated.status);
        setLocalStageGate(null);
        toast.success('Expense status updated');
      } catch (caught) {
        if (isStageGateApiError(caught)) {
          setLocalStageGate({ errors: caught.errors });
          if (caught.errors.some((error) => error.field === EXPENSE_GATE_FIELD_PAYMENTS)) {
            setActiveTab('payments');
          }
          return;
        }
        if (caught instanceof ApiError) {
          const mapped = mapExpenseStatusApiMessage(caught.message);
          if (mapped.length > 0) {
            setLocalStageGate({ errors: mapped });
            setActiveTab('payments');
            return;
          }
        }
        toast.error(getApiErrorMessage(caught, 'Expense status could not be updated. Try again.'));
      } finally {
        setStatusBusy(false);
      }
    },
    [
      expense,
      onExpenseUpdated,
      setActiveTab,
      setExpense,
      setLocalStageGate,
      statusBusy,
      syncDraftStatus,
    ],
  );

  return { statusBusy, handleStatusChange };
}
