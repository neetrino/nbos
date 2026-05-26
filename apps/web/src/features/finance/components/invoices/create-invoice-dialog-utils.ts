import type { CreateInvoiceInput, Order } from '@/lib/api/finance';
import type { Subscription } from '@/lib/api/subscriptions';
import { defaultCreateInvoiceDueDateIso } from './create-invoice-dialog.constants';

export interface CreateInvoiceFormState {
  amount: string;
  dueDate: string;
}

export interface CreateInvoiceHiddenContext {
  projectId?: string | null;
  companyId?: string | null;
  orderId?: string | null;
  subscriptionId?: string | null;
}

export function getOrderOutstandingAmount(order: Order): number {
  const total = Number(order.amount ?? order.totalAmount ?? 0);
  const paid = Number(order.paidAmount ?? 0);
  return Math.max(0, total - paid);
}

export function getInitialInvoiceForm(order?: Order | null): CreateInvoiceFormState {
  return {
    amount: order ? String(getOrderOutstandingAmount(order)) : '',
    dueDate: defaultCreateInvoiceDueDateIso(),
  };
}

export function getInitialInvoiceFormFromSubscription(
  subscription: Subscription,
): CreateInvoiceFormState {
  const monthly = parseFloat(subscription.baseMonthlyAmount);
  return {
    amount: Number.isFinite(monthly) ? String(monthly) : '',
    dueDate: defaultCreateInvoiceDueDateIso(),
  };
}

function resolveOrderInvoiceType(order: Order): string {
  if (order.paymentType === 'SUBSCRIPTION') return 'SUBSCRIPTION';
  if (order.type === 'EXTENSION') return 'EXTENSION';
  if (order.type === 'MAINTENANCE') return 'SUBSCRIPTION';
  return 'DEVELOPMENT';
}

export function buildCreateInvoicePayload(
  form: CreateInvoiceFormState,
  order?: Order | null,
  subscription?: Subscription | null,
  hidden?: CreateInvoiceHiddenContext,
): CreateInvoiceInput {
  const amount = Number(form.amount);
  const dueDate = form.dueDate.trim() || undefined;

  if (order) {
    return {
      orderId: order.id,
      projectId: order.projectId,
      companyId: order.company?.id,
      amount,
      type: resolveOrderInvoiceType(order),
      dueDate,
    };
  }

  if (subscription) {
    return {
      subscriptionId: subscription.id,
      projectId: subscription.projectId,
      ...(subscription.company?.id ? { companyId: subscription.company.id } : {}),
      amount,
      type: 'SUBSCRIPTION',
      dueDate,
    };
  }

  return {
    ...(hidden?.projectId ? { projectId: hidden.projectId } : {}),
    ...(hidden?.companyId ? { companyId: hidden.companyId } : {}),
    ...(hidden?.orderId ? { orderId: hidden.orderId } : {}),
    ...(hidden?.subscriptionId ? { subscriptionId: hidden.subscriptionId } : {}),
    amount,
    dueDate,
  };
}

export function canSubmitCreateInvoice(form: CreateInvoiceFormState): boolean {
  return Number(form.amount) > 0;
}
