'use client';

import { FINANCE_PROOF_PURPOSES, type FinanceProofPurpose } from '@nbos/shared';
import { EntityAttachmentBlock } from '@/features/drive/EntityAttachmentBlock';

interface FinanceProofAttachmentsProps {
  entityType: 'INVOICE' | 'PAYMENT' | 'EXPENSE' | 'CLIENT_SERVICE_RECORD';
  entityId: string;
  purpose: FinanceProofPurpose;
  title?: string;
  emptyHint?: string;
}

export function FinanceProofAttachments({
  entityType,
  entityId,
  purpose,
  title = 'Proofs & attachments',
  emptyHint = 'Drag finance proof files here (restricted visibility)',
}: FinanceProofAttachmentsProps) {
  return (
    <section className="space-y-3">
      <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        {title}
      </h4>
      <EntityAttachmentBlock
        entityType={entityType}
        entityId={entityId}
        libraryKey="finance"
        purpose={purpose}
        purposes={FINANCE_PROOF_PURPOSES}
        emptyHint={emptyHint}
      />
    </section>
  );
}
