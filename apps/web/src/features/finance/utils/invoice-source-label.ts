import { CLIENT_SERVICE_TYPES } from '@/features/finance/constants/client-services';

export const INVOICE_SOURCE_DEAL_LABEL = 'Deal';
export const INVOICE_SOURCE_ORDER_LABEL = 'Order';
export const INVOICE_SOURCE_SUBSCRIPTION_LABEL = 'Subscription';
export const INVOICE_SOURCE_MANUAL_LABEL = 'Manual';
const CLIENT_SERVICE_SOURCE_FALLBACK_LABEL = 'Service';

export type InvoiceSourceLabelInput = {
  orderId?: string | null;
  order?: { deal?: { id?: string | null } | null } | null;
  subscriptionId?: string | null;
  clientServiceRecordId?: string | null;
  clientServiceRecord?: { type?: string | null } | null;
  type?: string | null;
};

/**
 * Sheet-header source: Deal → Order → Subscription → client-service type → Manual.
 * Does not use Invoice.type except as a fallback when CSR type is missing.
 */
export function getInvoiceSourceLabel(invoice: InvoiceSourceLabelInput): string {
  if (invoice.order?.deal?.id) return INVOICE_SOURCE_DEAL_LABEL;
  if (invoice.orderId || invoice.order) return INVOICE_SOURCE_ORDER_LABEL;
  if (invoice.subscriptionId) return INVOICE_SOURCE_SUBSCRIPTION_LABEL;
  if (invoice.clientServiceRecordId || invoice.clientServiceRecord) {
    return resolveClientServiceSourceLabel(invoice.clientServiceRecord?.type ?? invoice.type);
  }
  return INVOICE_SOURCE_MANUAL_LABEL;
}

function resolveClientServiceSourceLabel(type: string | null | undefined): string {
  const match = CLIENT_SERVICE_TYPES.find((option) => option.value === type);
  return match?.label ?? CLIENT_SERVICE_SOURCE_FALLBACK_LABEL;
}
