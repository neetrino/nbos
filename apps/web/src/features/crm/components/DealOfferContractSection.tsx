'use client';

import { Clock, FileText, ScrollText } from 'lucide-react';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DetailSheetSection,
  InlineField,
} from '@/components/shared';
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
  sectionClassName?: string;
}

export function DealOfferContractSection({
  dealId,
  draft,
  patchDraft,
  disabled = false,
  sectionClassName,
}: DealOfferContractSectionProps) {
  return (
    <DetailSheetSection
      id={DEAL_SHEET_SECTION.OFFER_CONTRACT}
      title="Offer & follow-up"
      icon={<FileText size={12} />}
      className={sectionClassName}
    >
      <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
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

        <div className="border-t border-stone-100 pt-4 dark:border-stone-800">
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

        <div className="border-t border-stone-100 pt-4 dark:border-stone-800">
          <p className="text-muted-foreground mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-wide uppercase">
            <ScrollText size={12} />
            Contract
          </p>
          <EntityAttachmentBlock
            entityType="DEAL"
            entityId={dealId}
            libraryKey="deals"
            purpose="CONTRACT"
            emptyHint="Attach signed contracts linked to this deal."
          />
        </div>
      </div>
    </DetailSheetSection>
  );
}
