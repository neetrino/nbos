'use client';

import { FINANCE_PROOF_PURPOSES, type FinanceProofPurpose } from '@nbos/shared';
import { DETAIL_SHEET_SECTION_TITLE_CLASS } from '@/components/shared';
import { EntityAttachmentBlock } from '@/features/drive/EntityAttachmentBlock';
import { cn } from '@/lib/utils';

interface FinanceProofAttachmentsProps {
  entityType: 'INVOICE' | 'PAYMENT' | 'EXPENSE' | 'CLIENT_SERVICE_RECORD';
  entityId: string;
  purpose: FinanceProofPurpose;
  title?: string;
  emptyHint?: string;
  /** Caption on the field border. The add button stays in the row. */
  borderLabel?: string;
}

export function FinanceProofAttachments({
  entityType,
  entityId,
  purpose,
  title = 'Proofs & attachments',
  emptyHint = 'Drag finance proof files here (restricted visibility)',
  borderLabel,
}: FinanceProofAttachmentsProps) {
  const caption = borderLabel?.trim() ?? '';
  return (
    <section className={caption ? undefined : 'space-y-3'}>
      {caption || !title ? null : (
        <h4 className={cn(DETAIL_SHEET_SECTION_TITLE_CLASS, 'mb-0')}>{title}</h4>
      )}
      <EntityAttachmentBlock
        entityType={entityType}
        entityId={entityId}
        libraryKey="finance"
        purpose={purpose}
        purposes={FINANCE_PROOF_PURPOSES}
        emptyHint={caption ? '' : emptyHint}
        borderLabel={caption || undefined}
      />
    </section>
  );
}
