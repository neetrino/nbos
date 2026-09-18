export const INVOICE_PRODUCT_GATE_FIELD = 'product' as const;

export const INVOICE_CREATE_PRODUCT_REQUIRED_MESSAGE =
  'A product is required to create this invoice.';

const MANUAL_PRODUCT_REQUIRED_STATUSES = new Set(['AWAITING_PAYMENT', 'OVERDUE', 'PAID']);

/** Issued cards freeze payer/product: collection, paid, or official request already sent. */
export function isInvoicePayerContextLocked(input: {
  moneyStatus: string;
  officialInvoiceRequestSent?: boolean;
}): boolean {
  if (input.officialInvoiceRequestSent) return true;
  return MANUAL_PRODUCT_REQUIRED_STATUSES.has(input.moneyStatus);
}

export function getInvoiceManualProductGateErrors(input: {
  type: string;
  productId?: string | null;
  targetMoneyStatus: string;
}): Array<{ field: string; message: string }> {
  if (input.type !== 'MANUAL') return [];
  if (!MANUAL_PRODUCT_REQUIRED_STATUSES.has(input.targetMoneyStatus)) return [];
  if (input.productId) return [];
  return [
    {
      field: INVOICE_PRODUCT_GATE_FIELD,
      message: 'Link a product on the invoice card before awaiting payment.',
    },
  ];
}

/** Unsourced (manual) create requires an explicit product. Source ids inherit ownership. */
export function isUnsourcedInvoiceCreateMissingProduct(input: {
  productId?: string | null;
  orderId?: string | null;
  subscriptionId?: string | null;
  clientServiceRecordId?: string | null;
}): boolean {
  if (input.orderId?.trim()) return false;
  if (input.subscriptionId?.trim()) return false;
  if (input.clientServiceRecordId?.trim()) return false;
  return !input.productId?.trim();
}
