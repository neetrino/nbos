import { defaultCreateInvoiceDueDateIso } from '@/features/finance/components/invoices/create-invoice-dialog.constants';
import type { CreateInvoiceFormState } from '@/features/finance/components/invoices/create-invoice-dialog-utils';
import type { CreateExpenseFormState } from '@/features/finance/utils/expense-create-defaults';
import { parseExpenseDraftAmount } from '@/features/finance/utils/expense-general-form-state';
import {
  EMPTY_EXPENSE_PLAN_FORM,
  type ExpensePlanFormState,
} from '@/features/finance/utils/expense-plan-form-state';
import type { ClientServiceRecord } from '@/lib/api/client-services';
import type { CreateExpensePayload } from '@/lib/api/finance';
import type { CreateExpensePlanPayload } from '@/lib/api/expense-plans';
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

export function getClientServiceExpensePlanFormDefaults(
  service: ClientServiceRecord,
): ExpensePlanFormState {
  return {
    ...EMPTY_EXPENSE_PLAN_FORM,
    name: service.name,
    category: clientServiceExpenseCategory(service.type),
    amount: formatMoneyDefault(service.ourCost),
    frequency: service.frequency,
    nextDueDate: clientServiceTaskDefaultDueDate(service.renewalDate) ?? '',
    provider: service.provider ?? '',
    projectId: service.projectId,
    autoGenerate: service.billingModel === 'COMPANY_PAID',
    notes: `From client service: ${service.name}`,
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
    isPassThrough: service.billingModel === 'CLIENT_PAID',
    taxStatus: service.taxStatus,
    notes: `From client service: ${service.name}`,
  };
}

export function buildClientServiceExpensePlanPayload(
  form: ExpensePlanFormState,
  serviceId: string,
): CreateExpensePlanPayload | null {
  const parsedAmount = parseFloat(form.amount.replace(/\s/g, ''));
  if (!form.name.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return null;

  return {
    name: form.name.trim(),
    category: form.category,
    amount: parsedAmount,
    frequency: form.frequency,
    nextDueDate: form.nextDueDate.trim() ? form.nextDueDate : null,
    provider: form.provider.trim() || null,
    projectId: form.projectId !== 'none' ? form.projectId : null,
    clientServiceRecordId: serviceId,
    autoGenerate: form.autoGenerate,
    notes: form.notes.trim() || null,
  };
}
