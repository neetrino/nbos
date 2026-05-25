import type { ApiFieldError } from '@/lib/api-errors';
import type { Invoice } from '@/lib/api/finance';

export const INVOICE_GATE_FIELD_PAYMENTS = 'payments' as const;
export const INVOICE_GATE_FIELD_MONEY_STATUS = 'moneyStatus' as const;

function invoiceOutstandingAmount(invoice: Invoice): number {
  const coverage = invoice.paymentCoverage;
  if (coverage?.outstandingAmount !== undefined) return coverage.outstandingAmount;
  const amount = parseFloat(invoice.amount);
  const paid = coverage?.paidAmount ?? 0;
  return Number.isFinite(amount) ? Math.max(0, amount - paid) : 0;
}

/** Local pre-check aligned with `InvoicesService.assertManualMoneyStatusAllowed`. */
export function getLocalInvoiceMoneyStatusGateErrors(
  invoice: Invoice,
  targetMoneyStatus: string,
): ApiFieldError[] {
  const errors: ApiFieldError[] = [];
  const outstanding = invoiceOutstandingAmount(invoice);

  if (targetMoneyStatus === 'PAID' && outstanding > 0) {
    errors.push({
      field: INVOICE_GATE_FIELD_PAYMENTS,
      message: 'Record payments until the invoice is fully covered before marking it paid.',
    });
  }

  if (invoice.moneyStatus === 'PAID' && targetMoneyStatus !== 'PAID') {
    errors.push({
      field: INVOICE_GATE_FIELD_MONEY_STATUS,
      message: 'Fully paid invoices must stay in Paid money status.',
    });
  }

  return errors;
}

/** Maps API guard messages to sheet field highlights when structured `errors[]` is absent. */
export function mapInvoiceMoneyStatusApiMessage(message: string): ApiFieldError[] {
  if (message.includes('Cannot mark invoice as paid before payments fully cover')) {
    return [
      {
        field: INVOICE_GATE_FIELD_PAYMENTS,
        message,
      },
    ];
  }
  if (message.includes('Fully paid invoices must stay in PAID')) {
    return [
      {
        field: INVOICE_GATE_FIELD_MONEY_STATUS,
        message,
      },
    ];
  }
  return [];
}
