export const INVOICE_PRODUCT_GATE_FIELD = 'product' as const;

const MANUAL_PRODUCT_REQUIRED_STATUSES = new Set(['AWAITING_PAYMENT', 'OVERDUE', 'PAID']);

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
