export const QUALIFYING_PRODUCT_INVOICE_TYPES = ['DEVELOPMENT', 'EXTENSION'] as const;

const EXCLUDED_SALES_INVOICE_TYPES = new Set(['DOMAIN', 'SERVICE']);

export type ClassicSalesInvoicePurpose = 'qualifying_product' | 'excluded' | 'ambiguous';

export function isQualifyingProductInvoiceType(type: string): boolean {
  return (QUALIFYING_PRODUCT_INVOICE_TYPES as readonly string[]).includes(type);
}

/**
 * Classic one-time accrual uses order/product identity. Domain and unrelated service
 * invoices are excluded. Any other type on a Classic order is not guessed.
 */
export function classifyClassicSalesInvoicePurpose(
  type: string | null | undefined,
): ClassicSalesInvoicePurpose {
  if (type == null || type.trim() === '') {
    return 'ambiguous';
  }
  if (isQualifyingProductInvoiceType(type)) {
    return 'qualifying_product';
  }
  if (EXCLUDED_SALES_INVOICE_TYPES.has(type)) {
    return 'excluded';
  }
  return 'ambiguous';
}

/** Subscription invoices still ignore domain and unrelated service billing. */
export function isExcludedFromSalesAccrual(type: string | null | undefined): boolean {
  if (type == null) {
    return false;
  }
  return EXCLUDED_SALES_INVOICE_TYPES.has(type);
}
