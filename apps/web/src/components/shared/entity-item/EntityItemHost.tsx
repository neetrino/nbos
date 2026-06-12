'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { TaskSheet } from '@/features/tasks/components/TaskSheet';
import { InvoiceSheet } from '@/features/finance/components/InvoiceSheet';
import { ExpenseDetailSheet } from '@/features/finance/components/expenses/ExpenseDetailSheet';
import { BonusEntryReleasesSheet } from '@/features/finance/components/bonus/bonus-entry-releases-sheet';
import { getApiErrorMessage } from '@/lib/api-errors';
import { invoicesApi, paymentsApi, type Expense, type Invoice } from '@/lib/api/finance';
import { bonusesApi, type BonusEntryListRow } from '@/lib/api/bonus';
import type { Task } from '@/lib/api/tasks';
import { EntityItemHostProvider } from './entity-item-context';
import type { EntityItemOpenTarget } from './entity-item.types';

export interface EntityItemHostProps {
  children: ReactNode;
  /** When true, child sheets stack above the parent sheet rail (variant A). */
  nested?: boolean;
  onEntityChanged?: () => void;
}

export function EntityItemHost({ children, nested = true, onEntityChanged }: EntityItemHostProps) {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [initialTask, setInitialTask] = useState<Task | null>(null);
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceLoadId, setInvoiceLoadId] = useState<string | null>(null);
  const [invoiceSheetOpen, setInvoiceSheetOpen] = useState(false);
  const [bonusEntry, setBonusEntry] = useState<BonusEntryListRow | null>(null);
  const [bonusEntryLoadId, setBonusEntryLoadId] = useState<string | null>(null);
  const [bonusEntrySheetOpen, setBonusEntrySheetOpen] = useState(false);
  const [expenseId, setExpenseId] = useState<string | null>(null);
  const [initialExpense, setInitialExpense] = useState<Expense | null>(null);
  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false);

  useEffect(() => {
    if (!invoiceSheetOpen || !invoiceLoadId || invoice?.id === invoiceLoadId) return;
    let cancelled = false;
    void invoicesApi
      .getById(invoiceLoadId)
      .then((loaded) => {
        if (!cancelled) setInvoice(loaded);
      })
      .catch((caught) => {
        if (!cancelled) {
          toast.error(getApiErrorMessage(caught, 'Invoice could not be opened.'));
          setInvoiceSheetOpen(false);
        }
      })
      .finally(() => {
        if (!cancelled) setInvoiceLoadId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [invoice?.id, invoiceLoadId, invoiceSheetOpen]);

  useEffect(() => {
    if (!bonusEntrySheetOpen || !bonusEntryLoadId || bonusEntry?.id === bonusEntryLoadId) return;
    let cancelled = false;
    void bonusesApi
      .getById(bonusEntryLoadId)
      .then((loaded) => {
        if (!cancelled) setBonusEntry(loaded);
      })
      .catch((caught) => {
        if (!cancelled) {
          toast.error(getApiErrorMessage(caught, 'Bonus entry could not be opened.'));
          setBonusEntrySheetOpen(false);
        }
      })
      .finally(() => {
        if (!cancelled) setBonusEntryLoadId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [bonusEntry?.id, bonusEntryLoadId, bonusEntrySheetOpen]);

  const openEntityItem = useCallback((target: EntityItemOpenTarget) => {
    if (target.kind === 'task') {
      setTaskId(target.id);
      setInitialTask(target.task ?? null);
      setTaskSheetOpen(true);
      return;
    }
    if (target.kind === 'expense') {
      setExpenseId(target.id);
      setInitialExpense(target.expense ?? null);
      setExpenseSheetOpen(true);
      return;
    }
    if (target.kind === 'invoice') {
      setInvoice(target.invoice ?? null);
      setInvoiceLoadId(target.invoice ? null : target.id);
      setInvoiceSheetOpen(true);
      return;
    }
    if (target.kind === 'bonus_entry') {
      setBonusEntry(target.entry ?? null);
      setBonusEntryLoadId(target.entry ? null : target.id);
      setBonusEntrySheetOpen(true);
    }
  }, []);

  const api = useMemo(() => ({ openEntityItem }), [openEntityItem]);

  const handleTaskSheetOpenChange = useCallback((next: boolean) => {
    setTaskSheetOpen(next);
    if (!next) {
      setTaskId(null);
      setInitialTask(null);
    }
  }, []);

  const handleInvoiceSheetOpenChange = useCallback((next: boolean) => {
    setInvoiceSheetOpen(next);
    if (!next) {
      setInvoice(null);
      setInvoiceLoadId(null);
    }
  }, []);

  const handleBonusEntrySheetOpenChange = useCallback((next: boolean) => {
    setBonusEntrySheetOpen(next);
    if (!next) {
      setBonusEntry(null);
      setBonusEntryLoadId(null);
    }
  }, []);

  const handleExpenseSheetOpenChange = useCallback((next: boolean) => {
    setExpenseSheetOpen(next);
    if (!next) {
      setExpenseId(null);
      setInitialExpense(null);
    }
  }, []);

  const handleInvoiceUpdated = useCallback(
    (updated: Invoice) => {
      setInvoice(updated);
      onEntityChanged?.();
    },
    [onEntityChanged],
  );

  const handleInvoiceDeleted = useCallback(
    (_invoiceId: string) => {
      setInvoiceSheetOpen(false);
      setInvoice(null);
      setInvoiceLoadId(null);
      onEntityChanged?.();
    },
    [onEntityChanged],
  );

  const handlePaymentRecorded = useCallback(
    async (data: {
      invoiceId: string;
      amount: number;
      paymentDate: string;
      paymentMethod?: string;
      notes?: string;
    }) => {
      await paymentsApi.create(data);
      const updated = await invoicesApi.getById(data.invoiceId);
      setInvoice(updated);
      onEntityChanged?.();
    },
    [onEntityChanged],
  );

  const handleMoneyStatusChange = useCallback(
    async (id: string, moneyStatus: string) => {
      try {
        const updated = await invoicesApi.updateMoneyStatus(id, moneyStatus);
        setInvoice((current) => (current?.id === id ? updated : current));
        onEntityChanged?.();
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, 'Could not update invoice money status.'));
      }
    },
    [onEntityChanged],
  );

  const invoiceLoading = invoiceSheetOpen && !invoice && invoiceLoadId != null;
  const bonusLoading = bonusEntrySheetOpen && !bonusEntry && bonusEntryLoadId != null;

  return (
    <EntityItemHostProvider value={api}>
      {children}

      <TaskSheet
        taskId={taskId}
        initialTask={initialTask}
        open={taskSheetOpen}
        onOpenChange={handleTaskSheetOpenChange}
        onUpdate={() => onEntityChanged?.()}
        forceNestedBackdrop={nested}
      />

      <InvoiceSheet
        invoice={invoice}
        open={invoiceSheetOpen}
        loading={invoiceLoading}
        onOpenChange={handleInvoiceSheetOpenChange}
        onInvoiceUpdated={handleInvoiceUpdated}
        onInvoiceDeleted={handleInvoiceDeleted}
        onMoneyStatusChange={handleMoneyStatusChange}
        onPaymentRecorded={handlePaymentRecorded}
        forceNestedBackdrop={nested}
      />

      <BonusEntryReleasesSheet
        entry={bonusEntry}
        open={bonusEntrySheetOpen}
        loading={bonusLoading}
        onOpenChange={handleBonusEntrySheetOpenChange}
        onAfterPatch={() => onEntityChanged?.()}
        forceNestedBackdrop={nested}
      />

      <ExpenseDetailSheet
        expenseId={expenseId}
        initialExpense={initialExpense}
        open={expenseSheetOpen}
        onOpenChange={handleExpenseSheetOpenChange}
        onExpenseUpdated={() => onEntityChanged?.()}
        onExpenseDeleted={() => onEntityChanged?.()}
        forceNestedBackdrop={nested}
      />
    </EntityItemHostProvider>
  );
}
