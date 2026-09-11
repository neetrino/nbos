'use client';

import { StickyNote } from 'lucide-react';
import {
  getInvoiceOrderCommentOptions,
  INVOICE_ORDER_COMMENT_FIELD,
  INVOICE_ORDER_COMMENT_LABELS_HY,
} from '@nbos/shared';
import { InlineField } from '@/components/shared';
import { invoiceStageGateFieldClass } from '@/features/finance/constants/invoice-stage-gate-highlight';
import type { InvoiceGeneralDraft } from '@/features/finance/utils/invoice-general-form-state';
import type { Invoice } from '@/lib/api/finance';

interface InvoiceOrderCommentFieldProps {
  invoice: Invoice;
  draft: InvoiceGeneralDraft;
  patchDraft: (partial: Partial<InvoiceGeneralDraft>) => void;
  gateRequiredFields?: ReadonlySet<string>;
  disabled?: boolean;
}

export function InvoiceOrderCommentField({
  invoice,
  draft,
  patchDraft,
  gateRequiredFields = new Set(),
  disabled = false,
}: InvoiceOrderCommentFieldProps) {
  if (!invoice.orderId) return null;
  const dealType = invoice.order?.deal?.type ?? null;
  const options = getInvoiceOrderCommentOptions(dealType).map((value) => ({
    value,
    label: INVOICE_ORDER_COMMENT_LABELS_HY[value],
  }));

  return (
    <div
      className={invoiceStageGateFieldClass(
        gateRequiredFields,
        INVOICE_ORDER_COMMENT_FIELD,
        'mt-4',
      )}
    >
      <InlineField
        variant="controlled"
        label="Accountant note"
        type="select"
        value={draft.orderComment ?? ''}
        options={options}
        placeholder="Select note"
        icon={<StickyNote size={12} />}
        disabled={disabled}
        onValueChange={(orderComment) => patchDraft({ orderComment: orderComment || null })}
      />
    </div>
  );
}
