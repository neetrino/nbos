import {
  INVOICE_PAYMENT_METHOD_OPTIONS,
  type InvoicePaymentMethod,
} from '@/features/finance/constants/finance';
import { invoicePaymentMethodMessageKey } from './invoice-message-keys';

export function invoicePaymentMethodSelectOptions(
  translate: (key: 'paymentMethod.TRANSACTION' | 'paymentMethod.CASH') => string,
  hasKey: (key: 'paymentMethod.TRANSACTION' | 'paymentMethod.CASH') => boolean,
): { value: InvoicePaymentMethod; label: string }[] {
  return INVOICE_PAYMENT_METHOD_OPTIONS.map((option) => {
    const key = invoicePaymentMethodMessageKey(option.value);
    return {
      value: option.value,
      label: key && hasKey(key) ? translate(key) : option.label,
    };
  });
}
