'use client';

import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { CreateInvoiceDialog } from '@/features/finance/components/invoices/CreateInvoiceDialog';
import { CreateExpenseDialog } from '@/features/finance/components/expenses/CreateExpenseDialog';
import {
  buildClientServiceExpensePayload,
  getClientServiceExpenseFormDefaults,
  getClientServiceInvoiceFormDefaults,
} from '@/features/finance/constants/client-service-create-defaults';
import { clientServicesApi, type ClientServiceRecord } from '@/lib/api/client-services';
import { expensesApi } from '@/lib/api/finance';

interface ClientServiceCreateDialogsProps {
  service: ClientServiceRecord;
  invoiceOpen: boolean;
  onInvoiceOpenChange: (open: boolean) => void;
  expenseOpen: boolean;
  onExpenseOpenChange: (open: boolean) => void;
  onInvoiceCreated: () => void;
  onExpenseCreated: () => void;
}

export function ClientServiceCreateDialogs({
  service,
  invoiceOpen,
  onInvoiceOpenChange,
  expenseOpen,
  onExpenseOpenChange,
  onInvoiceCreated,
  onExpenseCreated,
}: ClientServiceCreateDialogsProps) {
  const invoiceDefaultForm = useMemo(
    () => getClientServiceInvoiceFormDefaults(service),
    [service.clientCharge, service.renewalDate],
  );

  const expenseDefaultForm = useMemo(
    () => getClientServiceExpenseFormDefaults(service),
    [service.name, service.ourCost, service.renewalDate],
  );

  const clientServiceContext = useMemo(
    () => ({
      name: service.name,
      projectLabel: `${service.project.code} — ${service.project.name}`,
    }),
    [service.name, service.project.code, service.project.name],
  );

  const submitInvoice = useCallback(
    async (form: { amount: string; dueDate: string }) => {
      return clientServicesApi.createInvoice(service.id, {
        amount: Number(form.amount),
        dueDate: form.dueDate.trim() || null,
      });
    },
    [service.id],
  );

  const submitExpense = useCallback(
    async (form: ReturnType<typeof getClientServiceExpenseFormDefaults>) => {
      const payload = buildClientServiceExpensePayload(form, service);
      if (!payload) throw new Error('Expense form is incomplete.');
      return expensesApi.create(payload);
    },
    [service],
  );

  const handleInvoiceCreated = useCallback(() => {
    toast.success('Linked invoice card created.');
    onInvoiceCreated();
  }, [onInvoiceCreated]);

  const handleExpenseCreated = useCallback(() => {
    toast.success('Linked expense card created.');
    onExpenseCreated();
  }, [onExpenseCreated]);

  if (service.billingModel !== 'WE_PAY') return null;

  return (
    <>
      <CreateInvoiceDialog
        open={invoiceOpen}
        onOpenChange={onInvoiceOpenChange}
        defaultForm={invoiceDefaultForm}
        clientServiceContext={clientServiceContext}
        hiddenContext={{ projectId: service.projectId }}
        submitOverride={submitInvoice}
        forceNestedBackdrop
        onCreated={handleInvoiceCreated}
      />

      <CreateExpenseDialog
        open={expenseOpen}
        onOpenChange={onExpenseOpenChange}
        initialForm={expenseDefaultForm}
        submitOverride={submitExpense}
        forceNestedBackdrop
        onCreated={handleExpenseCreated}
      />
    </>
  );
}
