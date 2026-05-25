'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  expenseDetailHref,
  type ExpenseListNavigationSort,
} from '@/features/finance/constants/project-expenses-drilldown';
import type { ExpenseDetailStageGateHighlight } from '@/features/finance/constants/expense-stage-gate-highlight';
import {
  getLocalExpenseStatusGateErrors,
  mapExpenseStatusApiMessage,
} from '@/features/finance/constants/expense-status-gate-client';
import { writeExpenseStageGatePending } from '@/features/finance/constants/expense-stage-gate-pending';
import { ApiError, getApiErrorMessage, isStageGateApiError } from '@/lib/api-errors';
import { expensesApi, type Expense } from '@/lib/api/finance';
export interface UseExpenseKanbanStatusChangeOptions {
  listProjectId: string | null;
  listSort: ExpenseListNavigationSort;
  fromBacklog: boolean;
  closed: boolean;
  expensePlanId: string | null;
}

function openExpenseWithStageGate(
  expense: Expense,
  errors: ExpenseDetailStageGateHighlight['errors'],
  options: UseExpenseKanbanStatusChangeOptions,
  router: ReturnType<typeof useRouter>,
): void {
  writeExpenseStageGatePending(expense.id, { errors });
  router.push(
    expenseDetailHref(expense.id, options.listProjectId, options.listSort, {
      fromBacklog: options.fromBacklog,
      closed: options.closed,
      expensePlanId: options.expensePlanId,
    }),
  );
}

export function useExpenseKanbanStatusChange(options: UseExpenseKanbanStatusChangeOptions) {
  const router = useRouter();

  return useCallback(
    async (expenseId: string, toStatus: string, expenses: Expense[], onSuccess: () => void) => {
      const expense = expenses.find((row) => row.id === expenseId);
      if (!expense || expense.status === toStatus) return;

      const localErrors = getLocalExpenseStatusGateErrors(expense, toStatus);
      if (localErrors.length > 0) {
        openExpenseWithStageGate(expense, localErrors, options, router);
        return;
      }

      try {
        await expensesApi.update(expenseId, { status: toStatus });
        await onSuccess();
      } catch (caught) {
        if (isStageGateApiError(caught)) {
          openExpenseWithStageGate(expense, caught.errors, options, router);
          return;
        }
        if (caught instanceof ApiError) {
          const mapped = mapExpenseStatusApiMessage(caught.message);
          if (mapped.length > 0) {
            openExpenseWithStageGate(expense, mapped, options, router);
            return;
          }
        }
        toast.error(
          getApiErrorMessage(
            caught,
            'Expense status could not be updated. Open the card or try again.',
          ),
        );
      }
    },
    [options, router],
  );
}
