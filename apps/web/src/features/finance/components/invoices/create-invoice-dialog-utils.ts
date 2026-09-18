import type { CreateInvoiceInput, Order } from '@/lib/api/finance';
import type { Subscription } from '@/lib/api/subscriptions';
import { defaultCreateInvoiceDueDateIso } from './create-invoice-dialog.constants';

export interface CreateInvoiceFormState {
  amount: string;
  dueDate: string;
  productId?: string;
  productLabel?: string | null;
}

export interface CreateInvoiceHiddenContext {
  productId?: string | null;
  productLabel?: string | null;
  companyId?: string | null;
  orderId?: string | null;
  subscriptionId?: string | null;
}

export function applyHiddenProductToInvoiceForm(
  form: CreateInvoiceFormState,
  hidden?: CreateInvoiceHiddenContext,
): CreateInvoiceFormState {
  const productId = form.productId?.trim() || hidden?.productId?.trim() || '';
  if (!productId) return form;
  return {
    ...form,
    productId,
    productLabel: form.productLabel ?? hidden?.productLabel ?? null,
  };
}

export function shouldShowStandardInvoiceProductField(input: {
  order?: unknown;
  subscriptionId?: string | null;
  clientServiceContext?: unknown;
  submitOverride?: unknown;
}): boolean {
  return (
    !input.order &&
    !input.subscriptionId?.trim() &&
    !input.clientServiceContext &&
    !input.submitOverride
  );
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
  const periodAmount = parseFloat(subscription.amount);
  return {
    amount: Number.isFinite(periodAmount) ? String(periodAmount) : '',
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
      companyId: order.company?.id,
      amount,
      type: resolveOrderInvoiceType(order),
      dueDate,
    };
  }

  if (subscription) {
    return {
      subscriptionId: subscription.id,
      productId: subscription.productId,
      ...(subscription.company?.id ? { companyId: subscription.company.id } : {}),
      amount,
      type: 'SUBSCRIPTION',
      dueDate,
    };
  }

  const productId = form.productId?.trim() || hidden?.productId?.trim() || undefined;

  return {
    ...(productId ? { productId } : {}),
    ...(hidden?.companyId ? { companyId: hidden.companyId } : {}),
    ...(hidden?.orderId ? { orderId: hidden.orderId } : {}),
    ...(hidden?.subscriptionId ? { subscriptionId: hidden.subscriptionId } : {}),
    amount,
    dueDate,
  };
}

export function canSubmitCreateInvoice(
  form: CreateInvoiceFormState,
  options?: { requireProduct?: boolean; hiddenProductId?: string | null },
): boolean {
  if (!(Number(form.amount) > 0)) return false;
  if (!options?.requireProduct) return true;
  return Boolean(form.productId?.trim() || options.hiddenProductId?.trim());
}
