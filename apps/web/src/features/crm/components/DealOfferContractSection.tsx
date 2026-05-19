'use client';

import { Clock, FileText, ScrollText } from 'lucide-react';
import { DetailSheetSection, InlineField } from '@/components/shared';
import type { DealGeneralDraft } from './deal-general-form-state';
import { DEAL_SHEET_SECTION } from '@/features/shared/crm-sheet-section-ids';
import { EntityAttachmentBlock } from '@/features/drive/EntityAttachmentBlock';

const OFFER_FILE_PURPOSES = [
  'OFFER_DRAFT',
  'OFFER_SENT',
  'OFFER_APPROVED',
  'MESSENGER_PROOF',
] as const;

interface DealOfferContractSectionProps {
  dealId: string;
  draft: DealGeneralDraft;
  patchDraft: (partial: Partial<DealGeneralDraft>) => void;
  disabled?: boolean;
}

export function DealOfferContractSection({
  dealId,
  draft,
  patchDraft,
  disabled = false,
}: DealOfferContractSectionProps) {
  return (
    <>
      <DetailSheetSection
        id={DEAL_SHEET_SECTION.OFFER_CONTRACT}
        title="Offer & follow-up"
        icon={<FileText size={12} />}
      >
        <InlineField
          variant="controlled"
          label="Response due"
          type="date"
          value={draft.responseDueAt ?? ''}
          placeholder="Follow-up date…"
          icon={<Clock size={12} />}
          disabled={disabled}
          onValueChange={(v) => patchDraft({ responseDueAt: v || null })}
        />

        <div className="mt-5 border-t border-stone-100 pt-5 dark:border-stone-800">
          <p className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-wide uppercase">
            Offer files
          </p>
          <EntityAttachmentBlock
            entityType="DEAL"
            entityId={dealId}
            libraryKey="deals"
            purposes={OFFER_FILE_PURPOSES}
            emptyHint="Attach offer PDFs, drafts, or messenger proofs."
          />
        </div>
      </DetailSheetSection>

      <DetailSheetSection title="Contract" icon={<ScrollText size={12} />}>
        <EntityAttachmentBlock
          entityType="DEAL"
          entityId={dealId}
          libraryKey="deals"
          purpose="CONTRACT"
          emptyHint="Attach signed contracts linked to this deal."
        />
      </DetailSheetSection>
    </>
  );
}
