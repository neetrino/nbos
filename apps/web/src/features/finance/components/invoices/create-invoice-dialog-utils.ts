import type { CreateInvoiceInput, Order } from '@/lib/api/finance';

export interface CreateInvoiceFormState {
  projectId: string;
  amount: string;
  type: string;
  dueDate: string;
}

export function getOrderOutstandingAmount(order: Order): number {
  const total = Number(order.amount ?? order.totalAmount ?? 0);
  const paid = Number(order.paidAmount ?? 0);
  return Math.max(0, total - paid);
}

export function getInitialInvoiceForm(order?: Order | null): CreateInvoiceFormState {
  return {
    projectId: order?.projectId ?? '',
    amount: order ? String(getOrderOutstandingAmount(order)) : '',
    type: order?.type ?? 'DEVELOPMENT',
    dueDate: '',
  };
}

export function buildCreateInvoicePayload(
  form: CreateInvoiceFormState,
  order?: Order | null,
): CreateInvoiceInput {
  const projectId = order?.projectId ?? form.projectId;
  return {
    projectId,
    orderId: order?.id,
    companyId: order?.company?.id,
    amount: Number(form.amount),
    type: form.type,
    dueDate: form.dueDate || undefined,
  };
}

export function canSubmitCreateInvoice(form: CreateInvoiceFormState): boolean {
  return Boolean(form.projectId && form.type && Number(form.amount) > 0);
}
