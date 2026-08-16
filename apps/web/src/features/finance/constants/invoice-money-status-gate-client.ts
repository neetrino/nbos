import type { ApiFieldError } from '@/lib/api-errors';
import type { Invoice } from '@/lib/api/finance';

export const INVOICE_GATE_FIELD_PAYMENTS = 'payments' as const;
export const INVOICE_GATE_FIELD_MONEY_STATUS = 'moneyStatus' as const;
export const INVOICE_GATE_FIELD_COMPANY = 'company' as const;
export const INVOICE_GATE_FIELD_PROJECT = 'project' as const;

const AWAITING_PAYMENT_CONTEXT_STATUSES = new Set(['AWAITING_PAYMENT', 'OVERDUE']);

function requiresManualContextGate(invoice: Invoice, targetMoneyStatus: string): boolean {
  return invoice.type === 'MANUAL' && AWAITING_PAYMENT_CONTEXT_STATUSES.has(targetMoneyStatus);
}

/** Local pre-check aligned with `InvoicesService.assertManualMoneyStatusAllowed`. */
export function getLocalInvoiceMoneyStatusGateErrors(
  invoice: Invoice,
  targetMoneyStatus: string,
): ApiFieldError[] {
  const errors: ApiFieldError[] = [];

  if (requiresManualContextGate(invoice, targetMoneyStatus)) {
    if (!invoice.companyId) {
      errors.push({
        field: INVOICE_GATE_FIELD_COMPANY,
        message: 'Link a company on the invoice card before awaiting payment.',
      });
    }
    if (!invoice.projectId) {
      errors.push({
        field: INVOICE_GATE_FIELD_PROJECT,
        message: 'Link a project on the invoice card before awaiting payment.',
      });
    }
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
