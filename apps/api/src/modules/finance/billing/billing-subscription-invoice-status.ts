import { resolveDepositInvoiceMoneyStatus } from '@nbos/shared';
import type { InvoiceTaxCompanyRequisites } from '@nbos/shared';
import { SUBSCRIPTION_EARLY_BILLING_DAY } from './subscription-billing-window';

/** Day-1 cards go to Awaiting when Tax-ready; days 2–31 stay New. */
export function resolveBillingInvoiceMoneyStatus(args: {
  billingDay: number;
  taxStatus: string;
  company: InvoiceTaxCompanyRequisites | null;
}): 'NEW' | 'AWAITING_PAYMENT' {
  if (args.billingDay !== SUBSCRIPTION_EARLY_BILLING_DAY) return 'NEW';
  return resolveDepositInvoiceMoneyStatus({
    taxStatus: args.taxStatus,
    company: args.company,
  });
}
