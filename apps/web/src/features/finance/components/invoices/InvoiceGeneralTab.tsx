'use client';

import { useTranslations } from 'next-intl';
import { isInvoicePayerContextLocked } from '@nbos/shared';
import type { InvoiceSheetInvoice } from './InvoiceSheetSections';
import { InvoiceLinkedEntitiesSection, InvoiceOfficialSection } from './InvoiceSheetSections';
import { FinanceProofAttachments } from '@/features/finance/components/FinanceProofAttachments';
import {
  DETAIL_SHEET_TAB_BODY_STRETCH_CLASS,
  DetailSheetOptionalDescription,
  DetailSheetSection,
} from '@/components/shared';
import { InvoiceGeneralBillingFields } from './InvoiceGeneralBillingFields';
import { InvoiceManualContextFields } from './InvoiceManualContextFields';
import { InvoiceOrderCommentField } from './InvoiceOrderCommentField';
import { InvoiceMoneyCard } from './InvoiceMoneyCard';
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
  const t = useTranslations('invoices');
  const billingFields =
    draft && onInvoiceUpdated ? (
      <>
        <InvoiceGeneralBillingFields
          draft={draft}
          patchDraft={patchDraft}
          disabled={formDisabled}
        />
        <InvoiceOrderCommentField
          invoice={invoice}
          draft={draft}
          patchDraft={patchDraft}
          gateRequiredFields={gateRequiredFields}
          disabled={formDisabled}
        />
      </>
    ) : null;

  return (
    <div className={`${DETAIL_SHEET_TAB_BODY_STRETCH_CLASS} mx-auto w-full max-w-none gap-4`}>
      <InvoiceMoneyCard
        invoice={invoice}
        gateRequiredFields={gateRequiredFields}
        billingFields={billingFields}
      />

      {draft && onInvoiceUpdated ? (
        <DetailSheetSection title={t('sheet.clientContext')}>
          <InvoiceManualContextFields
            invoice={invoice}
            draft={draft}
            patchDraft={patchDraft}
            gateRequiredFields={gateRequiredFields}
            disabled={
              formDisabled ||
              isInvoicePayerContextLocked({
                moneyStatus: invoice.moneyStatus,
                officialInvoiceRequestSent: invoice.officialInvoiceRequestSent,
              })
            }
          />
        </DetailSheetSection>
      ) : null}

      <InvoiceOfficialSection
        invoice={invoice}
        onInvoiceUpdated={onInvoiceUpdated}
        gateRequiredFields={gateRequiredFields}
      />

      <InvoiceLinkedEntitiesSection invoice={invoice} gateRequiredFields={gateRequiredFields} />

      <DetailSheetSection title={t('sheet.proofs')}>
        <FinanceProofAttachments
          entityType="INVOICE"
          entityId={invoice.id}
          purpose="INVOICE_REQUEST_PROOF"
          title=""
        />
      </DetailSheetSection>

      {draft ? (
        <DetailSheetOptionalDescription
          entityType="generic"
          entityId={invoice.id}
          value={draft.notes}
          onChange={(notes) => patchDraft({ notes: notes ?? '' })}
          disabled={formDisabled}
        />
      ) : null}
    </div>
  );
}
