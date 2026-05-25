'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { TaskSheet } from '@/features/tasks/components/TaskSheet';
import { InvoiceSheet } from '@/features/finance/components/InvoiceSheet';
import { getApiErrorMessage } from '@/lib/api-errors';
import { invoicesApi, paymentsApi, type Invoice } from '@/lib/api/finance';
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
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceSheetOpen, setInvoiceSheetOpen] = useState(false);

  const openEntityItem = useCallback(async (target: EntityItemOpenTarget) => {
    if (target.kind === 'task') {
      setTaskId(target.id);
      setTaskSheetOpen(true);
      return;
    }
    if (target.kind === 'invoice') {
      try {
        const loaded = await invoicesApi.getById(target.id);
        setInvoice(loaded);
        setInvoiceSheetOpen(true);
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, 'Invoice could not be opened.'));
      }
    }
  }, []);

  const api = useMemo(() => ({ openEntityItem }), [openEntityItem]);

  const handleTaskSheetOpenChange = useCallback((next: boolean) => {
    setTaskSheetOpen(next);
    if (!next) setTaskId(null);
  }, []);

  const handleInvoiceSheetOpenChange = useCallback((next: boolean) => {
    setInvoiceSheetOpen(next);
    if (!next) setInvoice(null);
  }, []);

  const handleInvoiceUpdated = useCallback(
    (updated: Invoice) => {
      setInvoice(updated);
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

  return (
    <EntityItemHostProvider value={api}>
      {children}

      <TaskSheet
        taskId={taskId}
        open={taskSheetOpen}
        onOpenChange={handleTaskSheetOpenChange}
        onUpdate={() => onEntityChanged?.()}
        forceNestedBackdrop={nested}
      />

      <InvoiceSheet
        invoice={invoice}
        open={invoiceSheetOpen}
        onOpenChange={handleInvoiceSheetOpenChange}
        onInvoiceUpdated={handleInvoiceUpdated}
        onMoneyStatusChange={handleMoneyStatusChange}
        onPaymentRecorded={handlePaymentRecorded}
        forceNestedBackdrop={nested}
      />
    </EntityItemHostProvider>
  );
}
