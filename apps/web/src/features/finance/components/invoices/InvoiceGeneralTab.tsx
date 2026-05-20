'use client';

import type { InvoiceSheetInvoice } from './InvoiceSheetSections';
import {
  InvoiceDescriptionSection,
  InvoiceDetailsSection,
  InvoiceLinkedEntitiesSection,
  InvoiceMoneySummaryRow,
} from './InvoiceSheetSections';
import { FinanceProofAttachments } from '@/features/finance/components/FinanceProofAttachments';
import { DetailSheetSection } from '@/components/shared';

interface InvoiceGeneralTabProps {
  invoice: InvoiceSheetInvoice;
  gateRequiredFields: ReadonlySet<string>;
  onInvoiceUpdated?: (invoice: InvoiceSheetInvoice) => void;
}

export function InvoiceGeneralTab({
  invoice,
  gateRequiredFields,
  onInvoiceUpdated,
}: InvoiceGeneralTabProps) {
  return (
    <div className="space-y-4">
      <DetailSheetSection title="Money">
        <InvoiceMoneySummaryRow invoice={invoice} gateRequiredFields={gateRequiredFields} />
      </DetailSheetSection>

      <InvoiceLinkedEntitiesSection invoice={invoice} />

      <InvoiceDescriptionSection description={invoice.description} />

      <InvoiceDetailsSection invoice={invoice} onInvoiceUpdated={onInvoiceUpdated} />

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
