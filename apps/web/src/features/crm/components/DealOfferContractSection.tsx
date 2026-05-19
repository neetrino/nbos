'use client';

import { Calendar, Clock, FileText } from 'lucide-react';
import { DetailSheetSection, InlineField } from '@/components/shared';
import type { DealGeneralDraft } from './deal-general-form-state';
import { DEAL_SHEET_SECTION } from '@/features/shared/crm-sheet-section-ids';
import { EntityAttachmentBlock } from '@/features/drive/EntityAttachmentBlock';

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
    <DetailSheetSection
      id={DEAL_SHEET_SECTION.OFFER_CONTRACT}
      title="Offer & files"
      icon={<FileText size={12} />}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InlineField
          variant="controlled"
          label="Offer sent"
          type="date"
          value={draft.offerSentAt ?? ''}
          placeholder="Select date…"
          icon={<Calendar size={12} />}
          disabled={disabled}
          onValueChange={(v) => patchDraft({ offerSentAt: v || null })}
        />
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
        <InlineField
          variant="controlled"
          label="Contract signed"
          type="date"
          value={draft.contractSignedAt ?? ''}
          placeholder="Select date…"
          icon={<Calendar size={12} />}
          disabled={disabled}
          onValueChange={(v) => patchDraft({ contractSignedAt: v || null })}
        />
      </div>

      <div className="mt-5 border-t border-stone-100 pt-5 dark:border-stone-800">
        <EntityAttachmentBlock
          entityType="DEAL"
          entityId={dealId}
          libraryKey="deals"
          emptyHint="Attach offers, contracts, or messenger proofs. Up to 12 files show here."
        />
      </div>
    </DetailSheetSection>
  );
}
