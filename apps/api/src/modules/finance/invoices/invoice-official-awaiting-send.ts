import {
  getOfficialInvoiceOrderCommentSendErrors,
  getOfficialInvoiceRequestSendErrors,
} from '@nbos/shared';
import type { InvoiceTaxCompanyRequisites } from '@nbos/shared';

export const OFFICIAL_SEND_CANCELLED_MESSAGE =
  'Cannot send official invoice request from Cancelled';

export function officialSendIdempotencyKey(
  invoiceId: string,
  cancelledAt: Date | null | undefined,
): string {
  return `official_send:${invoiceId}:${cancelledAt?.toISOString() ?? 'initial'}`;
}

export function canAutoSendOfficialOnAwaiting(invoice: {
  taxStatus: string;
  moneyStatus: string;
  officialInvoiceRequestSent: boolean;
  companyId: string | null;
  company: InvoiceTaxCompanyRequisites | null;
  orderId?: string | null;
  orderComment?: string | null;
}): boolean {
  if (invoice.taxStatus !== 'TAX') return false;
  if (invoice.moneyStatus !== 'AWAITING_PAYMENT') return false;
  if (invoice.officialInvoiceRequestSent) return false;
  if (getOfficialInvoiceRequestSendErrors(invoice).length > 0) return false;
  return getOfficialInvoiceOrderCommentSendErrors(invoice).length === 0;
}
