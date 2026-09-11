'use client';

import { useState } from 'react';
import { CalendarDays, DollarSign } from 'lucide-react';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DetailSheetCollapsibleSection,
  DetailSheetFieldSegmented,
  InlineField,
} from '@/components/shared';
import {
  CLIENT_SERVICE_BILLING_MODEL_SEGMENTED_OPTIONS,
  CLIENT_SERVICE_FREQUENCIES,
  CLIENT_SERVICE_PRICING_MODEL_SEGMENTED_OPTIONS,
} from '@/features/finance/constants/client-services';
import { INVOICE_TAX_STATUS_OPTIONS } from '@/features/finance/constants/finance';
import {
  EXPENSE_SHEET_FIELD_CELL_CLASS,
  EXPENSE_SHEET_FIELD_ROW_2_CLASS,
} from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import type { ClientServiceFormState } from '@/features/finance/utils/client-service-form-state';

interface ClientServiceGeneralBillingSectionProps {
  draft: ClientServiceFormState;
  patchDraft: (partial: Partial<ClientServiceFormState>) => void;
  formDisabled: boolean;
}

export function ClientServiceGeneralBillingSection({
  draft,
  patchDraft,
  formDisabled,
}: ClientServiceGeneralBillingSectionProps) {
  const [open, setOpen] = useState(true);

  return (
    <DetailSheetCollapsibleSection
      title="Billing"
      icon={<DollarSign size={12} />}
      open={open}
      onOpenChange={setOpen}
    >
      <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
        <ClientServiceBillingModelRow
          draft={draft}
          formDisabled={formDisabled}
          patchDraft={patchDraft}
        />
        <ClientServiceBillingAmountsRow
          draft={draft}
          formDisabled={formDisabled}
          patchDraft={patchDraft}
        />
        <ClientServiceBillingFrequencyRow
          draft={draft}
          formDisabled={formDisabled}
          patchDraft={patchDraft}
        />
      </div>
    </DetailSheetCollapsibleSection>
  );
}

function ClientServiceBillingModelRow({
  draft,
  formDisabled,
  patchDraft,
}: ClientServiceGeneralBillingSectionProps) {
  return (
    <div className={EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
      <DetailSheetFieldSegmented
        label="Billing model"
        value={draft.billingModel}
        options={CLIENT_SERVICE_BILLING_MODEL_SEGMENTED_OPTIONS}
        disabled={formDisabled}
        className={EXPENSE_SHEET_FIELD_CELL_CLASS}
        onValueChange={(billingModel) => patchDraft({ billingModel })}
      />
      <DetailSheetFieldSegmented
        label="Pricing"
        value={draft.pricingModel}
        options={CLIENT_SERVICE_PRICING_MODEL_SEGMENTED_OPTIONS}
        disabled={formDisabled}
        className={EXPENSE_SHEET_FIELD_CELL_CLASS}
        onValueChange={(pricingModel) => patchDraft({ pricingModel })}
      />
    </div>
  );
}

function ClientServiceBillingAmountsRow({
  draft,
  formDisabled,
  patchDraft,
}: ClientServiceGeneralBillingSectionProps) {
  return (
    <div className={EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
      <InlineField
        variant="controlled"
        label="Our cost"
        type="money"
        value={draft.ourCost}
        icon={<DollarSign size={12} />}
        disabled={formDisabled}
        className={EXPENSE_SHEET_FIELD_CELL_CLASS}
        onValueChange={(ourCost) => patchDraft({ ourCost })}
      />
      <InlineField
        variant="controlled"
        label="Client charge"
        type="money"
        value={draft.clientCharge}
        icon={<DollarSign size={12} />}
        disabled={formDisabled}
        className={EXPENSE_SHEET_FIELD_CELL_CLASS}
        onValueChange={(clientCharge) => patchDraft({ clientCharge })}
      />
    </div>
  );
}

function ClientServiceBillingFrequencyRow({
  draft,
  formDisabled,
  patchDraft,
}: ClientServiceGeneralBillingSectionProps) {
  return (
    <div className={EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
      <InlineField
        variant="controlled"
        label="Frequency"
        type="select"
        value={draft.frequency}
        options={CLIENT_SERVICE_FREQUENCIES.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        icon={<CalendarDays size={12} />}
        disabled={formDisabled}
        className={EXPENSE_SHEET_FIELD_CELL_CLASS}
        onValueChange={(frequency) => frequency && patchDraft({ frequency })}
      />
      <DetailSheetFieldSegmented
        label="Tax"
        value={draft.taxStatus}
        options={INVOICE_TAX_STATUS_OPTIONS}
        disabled={formDisabled}
        className={EXPENSE_SHEET_FIELD_CELL_CLASS}
        onValueChange={(taxStatus) => patchDraft({ taxStatus })}
      />
    </div>
  );
}
