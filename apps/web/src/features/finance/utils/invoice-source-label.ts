import { CLIENT_SERVICE_TYPES } from '@/features/finance/constants/client-services';

export const INVOICE_SOURCE_DEAL_LABEL = 'Deal';
export const INVOICE_SOURCE_ORDER_LABEL = 'Order';
export const INVOICE_SOURCE_SUBSCRIPTION_LABEL = 'Subscription';
export const INVOICE_SOURCE_MANUAL_LABEL = 'Manual';
const CLIENT_SERVICE_SOURCE_FALLBACK_LABEL = 'Service';

export type InvoiceSourceFamily = 'deal' | 'order' | 'subscription' | 'client_service' | 'manual';

export type InvoiceSourceLabelInput = {
  orderId?: string | null;
  order?: { deal?: { id?: string | null } | null } | null;
  subscriptionId?: string | null;
  clientServiceRecordId?: string | null;
  clientServiceRecord?: { type?: string | null } | null;
  type?: string | null;
};

/** Linked origin family for board chrome: Deal → Order → Subscription → client service → Manual. */
export function resolveInvoiceSourceFamily(invoice: InvoiceSourceLabelInput): InvoiceSourceFamily {
  if (invoice.order?.deal?.id) return 'deal';
  if (invoice.orderId || invoice.order) return 'order';
  if (invoice.subscriptionId) return 'subscription';
  if (invoice.clientServiceRecordId || invoice.clientServiceRecord) return 'client_service';
  return 'manual';
}

/**
 * Sheet-header source: Deal → Order → Subscription → client-service type → Manual.
 * Does not use Invoice.type except as a fallback when CSR type is missing.
 */
export function getInvoiceSourceLabel(invoice: InvoiceSourceLabelInput): string {
  const family = resolveInvoiceSourceFamily(invoice);
  if (family === 'deal') return INVOICE_SOURCE_DEAL_LABEL;
  if (family === 'order') return INVOICE_SOURCE_ORDER_LABEL;
  if (family === 'subscription') return INVOICE_SOURCE_SUBSCRIPTION_LABEL;
  if (family === 'client_service') {
    return resolveClientServiceSourceLabel(invoice.clientServiceRecord?.type ?? invoice.type);
  }
  return INVOICE_SOURCE_MANUAL_LABEL;
}

function resolveClientServiceSourceLabel(type: string | null | undefined): string {
  const match = CLIENT_SERVICE_TYPES.find((option) => option.value === type);
  return match?.label ?? CLIENT_SERVICE_SOURCE_FALLBACK_LABEL;
}
