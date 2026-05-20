'use client';

import { DollarSign, Receipt } from 'lucide-react';
import { InlineField } from '@/components/shared';
import { INVOICE_TAX_STATUS_OPTIONS } from '@/features/finance/constants/finance';
import type { InvoiceGeneralDraft } from '@/features/finance/utils/invoice-general-form-state';

const TAX_OPTIONS = INVOICE_TAX_STATUS_OPTIONS.map((row) => ({
  value: row.value,
  label: row.label,
}));

interface InvoiceGeneralBillingFieldsProps {
  draft: InvoiceGeneralDraft;
  patchDraft: (partial: Partial<InvoiceGeneralDraft>) => void;
  disabled?: boolean;
}

export function InvoiceGeneralBillingFields({
  draft,
  patchDraft,
  disabled = false,
}: InvoiceGeneralBillingFieldsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <InlineField
        variant="controlled"
        label="Amount"
        type="number"
        value={draft.amount}
        icon={<DollarSign size={12} />}
        disabled={disabled}
        onValueChange={(amount) => patchDraft({ amount })}
      />
      <InlineField
        variant="controlled"
        label="Tax Status"
        type="select"
        value={draft.taxStatus}
        options={TAX_OPTIONS}
        placeholder="Tax / Tax Free"
        icon={<Receipt size={12} />}
        disabled={disabled}
        onValueChange={(taxStatus) => taxStatus && patchDraft({ taxStatus })}
      />
    </div>
  );
}
