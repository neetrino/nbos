'use client';

import { Receipt } from 'lucide-react';
import { AmdCurrencyIcon, DetailSheetFieldSegmented, InlineField } from '@/components/shared';
import { INVOICE_TAX_STATUS_OPTIONS } from '@/features/finance/constants/finance';
import type { InvoiceGeneralDraft } from '@/features/finance/utils/invoice-general-form-state';

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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <InlineField
        variant="controlled"
        label="Amount"
        type="money"
        value={draft.amount}
        icon={<AmdCurrencyIcon className="text-muted-foreground/70" />}
        disabled={disabled}
        onValueChange={(amount) => patchDraft({ amount })}
      />
      <DetailSheetFieldSegmented
        label="Tax Status"
        icon={<Receipt size={12} />}
        value={draft.taxStatus}
        options={INVOICE_TAX_STATUS_OPTIONS}
        disabled={disabled}
        onValueChange={(taxStatus) => patchDraft({ taxStatus })}
      />
    </div>
  );
}
