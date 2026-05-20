'use client';

import { DollarSign, Receipt } from 'lucide-react';
import { InlineField } from '@/components/shared';
import { TAX_STATUSES } from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import type { InvoiceGeneralDraft } from '@/features/finance/utils/invoice-general-form-state';

const TAX_SELECT_OPTIONS = TAX_STATUSES.map((row) => ({ value: row.value, label: row.label }));

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
        label="Tax status"
        type="select"
        value={draft.taxStatus}
        selectOptions={TAX_SELECT_OPTIONS}
        icon={<Receipt size={12} />}
        disabled={disabled}
        onValueChange={(taxStatus) => patchDraft({ taxStatus })}
      />
    </div>
  );
}
