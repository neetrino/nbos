import { defaultCreateInvoiceDueDateIso } from '@/features/finance/components/invoices/create-invoice-dialog.constants';
import type { CreateInvoiceFormState } from '@/features/finance/components/invoices/create-invoice-dialog-utils';
import type { CreateExpenseFormState } from '@/features/finance/utils/expense-create-defaults';
import { parseExpenseDraftAmount } from '@/features/finance/utils/expense-general-form-state';
import type { ClientServiceRecord } from '@/lib/api/client-services';
import type { CreateExpensePayload } from '@/lib/api/finance';
import { clientServiceTaskDefaultDueDate } from './client-service-task-links';

/** Mirrors API `clientServiceExpenseCategory` (`client-service-flow-helpers.ts`). */
export function clientServiceExpenseCategory(type: string): string {
  if (type === 'DOMAIN') return 'DOMAIN';
  if (type === 'HOSTING') return 'HOSTING';
  return 'SERVICE';
}

function formatMoneyDefault(value: string | null | undefined): string {
  if (!value) return '';
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : '';
}

export function getClientServiceInvoiceFormDefaults(
  service: Pick<ClientServiceRecord, 'clientCharge' | 'renewalDate'>,
): CreateInvoiceFormState {
  return {
    amount: formatMoneyDefault(service.clientCharge),
    dueDate:
      clientServiceTaskDefaultDueDate(service.renewalDate) ?? defaultCreateInvoiceDueDateIso(),
  };
}

export function getClientServiceExpenseFormDefaults(
  service: Pick<ClientServiceRecord, 'name' | 'ourCost' | 'renewalDate'>,
): CreateExpenseFormState {
  return {
    name: service.name,
    amount: formatMoneyDefault(service.ourCost),
    dueDate: clientServiceTaskDefaultDueDate(service.renewalDate) ?? '',
  };
}

export function buildClientServiceExpensePayload(
  form: CreateExpenseFormState,
  service: ClientServiceRecord,
): CreateExpensePayload | null {
  const amount = parseExpenseDraftAmount(form.amount);
  const name = form.name.trim();
  if (!name || amount == null) return null;

  return {
    name,
    amount,
    type: 'PLANNED',
    category: clientServiceExpenseCategory(service.type),
    frequency: 'ONE_TIME',
    status: 'PLANNED',
    dueDate: form.dueDate.trim() || null,
    projectId: service.projectId,
    clientServiceRecordId: service.id,
    isPassThrough: service.billingModel === 'WE_PAY',
    taxStatus: service.taxStatus,
    notes: `From client service: ${service.name}`,
  };
}
