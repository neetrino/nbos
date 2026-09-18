import { INVOICE_PAYMENT_METHOD_OPTIONS } from '@/features/finance/constants/finance';

/** Human label for stored payment method codes (falls back to raw value). */
export function paymentMethodLabel(method: string | null | undefined): string | null {
  if (!method?.trim()) return null;
  const known = INVOICE_PAYMENT_METHOD_OPTIONS.find((option) => option.value === method);
  return known?.label ?? method;
}
