import type { CreateInvoiceInput, Order } from '@/lib/api/finance';
import type { Subscription } from '@/lib/api/subscriptions';

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

export function getInitialInvoiceFormFromSubscription(
  subscription: Subscription,
): CreateInvoiceFormState {
  const monthly = parseFloat(subscription.amount);
  return {
    projectId: subscription.projectId,
    amount: Number.isFinite(monthly) ? String(monthly) : '',
    type: 'SUBSCRIPTION',
    dueDate: '',
  };
}

export function buildCreateInvoicePayload(
  form: CreateInvoiceFormState,
  order?: Order | null,
  subscription?: Subscription | null,
): CreateInvoiceInput {
  if (order) {
    const projectId = order.projectId ?? form.projectId;
    return {
      projectId,
      orderId: order.id,
      companyId: order.company?.id,
      amount: Number(form.amount),
      type: form.type,
      dueDate: form.dueDate || undefined,
    };
  }
  if (subscription) {
    return {
      projectId: subscription.projectId,
      subscriptionId: subscription.id,
      ...(subscription.company?.id ? { companyId: subscription.company.id } : {}),
      amount: Number(form.amount),
      type: form.type,
      dueDate: form.dueDate || undefined,
    };
  }
  return {
    projectId: form.projectId,
    amount: Number(form.amount),
    type: form.type,
    dueDate: form.dueDate || undefined,
  };
}

export function canSubmitCreateInvoice(form: CreateInvoiceFormState): boolean {
  return Boolean(form.projectId && form.type && Number(form.amount) > 0);
}
