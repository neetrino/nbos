'use client';

import { useEffect } from 'react';
import { FileText } from 'lucide-react';
import {
  DETAIL_SHEET_SUBSECTION_LABEL_CLASS,
  DetailSheetCollapsibleSection,
} from '@/components/shared';
import { DEAL_SHEET_SECTION } from '@/features/shared/crm-sheet-section-ids';
import { dealStageGateFieldClass } from '@/features/crm/deal-stage-gate-highlight';
import { cn } from '@/lib/utils';
import {
  DEAL_SHEET_COLLAPSE_KEY,
  useDealSheetSectionCollapse,
} from '../hooks/use-deal-sheet-section-collapse';
import { DealFilesBlock } from './DealFilesBlock';

interface DealOfferContractSectionProps {
  dealId: string;
  gateRequiredFields?: ReadonlySet<string>;
}

export function DealOfferContractSection({
  dealId,
  gateRequiredFields = new Set(),
}: DealOfferContractSectionProps) {
  const offerRequired = gateRequiredFields.has('offerProof');
  const contractRequired = gateRequiredFields.has('contractProof');
  const { open, onOpenChange } = useDealSheetSectionCollapse(
    DEAL_SHEET_COLLAPSE_KEY.OFFER_CONTRACT,
  );

  useEffect(() => {
    if (offerRequired || contractRequired) onOpenChange(true);
  }, [offerRequired, contractRequired, onOpenChange]);

  return (
    <DetailSheetCollapsibleSection
      id={DEAL_SHEET_SECTION.OFFER_CONTRACT}
      title="Offer & contract"
      icon={<FileText size={12} />}
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="flex flex-col">
        <div
          className={cn('min-w-0', dealStageGateFieldClass(gateRequiredFields, 'offerProof', ''))}
        >
          <p className={DETAIL_SHEET_SUBSECTION_LABEL_CLASS}>Offer</p>
          <DealFilesBlock dealId={dealId} purpose="OFFER" />
        </div>
        <div
          className={cn(
            'min-w-0 pt-5',
            dealStageGateFieldClass(gateRequiredFields, 'contractProof', ''),
          )}
        >
          <p className={DETAIL_SHEET_SUBSECTION_LABEL_CLASS}>Contract</p>
          <DealFilesBlock dealId={dealId} purpose="CONTRACT" />
        </div>
      </div>
    </DetailSheetCollapsibleSection>
  );
}
