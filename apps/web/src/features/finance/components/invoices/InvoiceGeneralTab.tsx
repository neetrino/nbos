'use client';

import type { InvoiceSheetInvoice } from './InvoiceSheetSections';
import {
  InvoiceDescriptionSection,
  InvoiceLinkedEntitiesSection,
  InvoiceMoneySummaryRow,
  InvoiceOfficialSection,
} from './InvoiceSheetSections';
import { FinanceProofAttachments } from '@/features/finance/components/FinanceProofAttachments';
import { DetailSheetSection } from '@/components/shared';
import { InvoiceGeneralBillingFields } from './InvoiceGeneralBillingFields';
import type { InvoiceGeneralDraft } from '@/features/finance/utils/invoice-general-form-state';

interface InvoiceGeneralTabProps {
  invoice: InvoiceSheetInvoice;
  gateRequiredFields: ReadonlySet<string>;
  draft: InvoiceGeneralDraft | null;
  patchDraft: (partial: Partial<InvoiceGeneralDraft>) => void;
  formDisabled?: boolean;
  onInvoiceUpdated?: (invoice: InvoiceSheetInvoice) => void;
}

export function InvoiceGeneralTab({
  invoice,
  gateRequiredFields,
  draft,
  patchDraft,
  formDisabled = false,
  onInvoiceUpdated,
}: InvoiceGeneralTabProps) {
  const billingFields =
    draft && onInvoiceUpdated ? (
      <InvoiceGeneralBillingFields draft={draft} patchDraft={patchDraft} disabled={formDisabled} />
    ) : null;

  return (
    <div className="mx-auto flex w-full max-w-none flex-col gap-4">
      <DetailSheetSection title="Money">
        <InvoiceMoneySummaryRow
          invoice={invoice}
          gateRequiredFields={gateRequiredFields}
          billingFields={billingFields}
        />
      </DetailSheetSection>

      <InvoiceOfficialSection invoice={invoice} onInvoiceUpdated={onInvoiceUpdated} />

      <InvoiceLinkedEntitiesSection invoice={invoice} />

      <InvoiceDescriptionSection description={invoice.description} />

      <DetailSheetSection title="Proofs">
        <FinanceProofAttachments
          entityType="INVOICE"
          entityId={invoice.id}
          purpose="INVOICE_REQUEST_PROOF"
          title=""
        />
      </DetailSheetSection>
    </div>
  );
}
