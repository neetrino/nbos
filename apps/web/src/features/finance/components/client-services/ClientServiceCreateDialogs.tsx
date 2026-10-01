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
import {
  clientServiceBillsClient,
  clientServicePaysProvider,
} from '@/features/finance/constants/client-services';
import { clientServicesApi, type ClientServiceRecord } from '@/lib/api/client-services';
import { expensesApi } from '@/lib/api/finance';
import { useClientServicesT } from './client-service-message-keys';

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
  const t = useClientServicesT();
  const invoiceDefaultForm = useMemo(() => getClientServiceInvoiceFormDefaults(service), [service]);

  const expenseDefaultForm = useMemo(() => getClientServiceExpenseFormDefaults(service), [service]);

  const clientServiceContext = useMemo(
    () => ({
      name: service.name,
      projectLabel: service.project.name,
    }),
    [service.name, service.project.name],
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
      if (!payload) throw new Error(t('errors.expenseIncomplete'));
      return expensesApi.create(payload);
    },
    [service, t],
  );

  const handleInvoiceCreated = useCallback(() => {
    toast.success(t('toasts.invoiceCreated'));
    onInvoiceCreated();
  }, [onInvoiceCreated, t]);

  const handleExpenseCreated = useCallback(() => {
    toast.success(t('toasts.expenseCreated'));
    onExpenseCreated();
  }, [onExpenseCreated, t]);

  if (!clientServicePaysProvider(service.billingModel)) return null;
  const billsClient = clientServiceBillsClient(service.billingModel);

  return (
    <>
      {billsClient ? (
        <CreateInvoiceDialog
          open={invoiceOpen}
          onOpenChange={onInvoiceOpenChange}
          defaultForm={invoiceDefaultForm}
          clientServiceContext={clientServiceContext}
          hiddenContext={{ productId: service.productId }}
          submitOverride={submitInvoice}
          forceNestedBackdrop
          onCreated={handleInvoiceCreated}
        />
      ) : null}

      <CreateExpenseDialog
        open={expenseOpen}
        onOpenChange={onExpenseOpenChange}
        initialForm={expenseDefaultForm}
        submitOverride={submitExpense}
        showPlanPicker={false}
        forceNestedBackdrop
        onCreated={handleExpenseCreated}
      />
    </>
  );
}
