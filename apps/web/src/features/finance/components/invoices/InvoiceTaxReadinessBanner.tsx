'use client';

import { getOfficialInvoiceRequestSendErrors } from '@nbos/shared';
import type { Invoice } from '@/lib/api/finance';

export function InvoiceTaxReadinessBanner({ invoice }: { invoice: Invoice }) {
  const errors = getOfficialInvoiceRequestSendErrors({
    taxStatus: invoice.taxStatus,
    companyId: invoice.companyId,
    company: invoice.company,
  });
  if (errors.length === 0) return null;

  return (
    <div className="space-y-1 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
      <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
        Fill company requisites before issuing this Tax invoice
      </p>
      <ul className="text-muted-foreground space-y-1 text-xs">
        {errors.map((error) => (
          <li key={`${error.field}-${error.message}`}>{error.message}</li>
        ))}
      </ul>
    </div>
  );
}
