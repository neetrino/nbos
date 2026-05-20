'use client';

import { useEffect } from 'react';
import { FileText, ScrollText } from 'lucide-react';
import { DetailSheetCollapsibleSection } from '@/components/shared';
import { DETAIL_SHEET_STAGE_GATE_REQUIRED_CLASS } from '@/components/shared/detail-sheet-classes';
import { DEAL_SHEET_SECTION } from '@/features/shared/crm-sheet-section-ids';
import {
  DEAL_SHEET_COLLAPSE_KEY,
  useDealSheetSectionCollapse,
} from '../hooks/use-deal-sheet-section-collapse';
import { DealFilesBlock } from './DealFilesBlock';
import { cn } from '@/lib/utils';

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
  const offerCollapse = useDealSheetSectionCollapse(DEAL_SHEET_COLLAPSE_KEY.OFFER);
  const contractCollapse = useDealSheetSectionCollapse(DEAL_SHEET_COLLAPSE_KEY.CONTRACT);

  useEffect(() => {
    if (offerRequired) offerCollapse.onOpenChange(true);
  }, [offerRequired, offerCollapse.onOpenChange]);

  useEffect(() => {
    if (contractRequired) contractCollapse.onOpenChange(true);
  }, [contractRequired, contractCollapse.onOpenChange]);

  return (
    <div className="flex flex-col gap-4">
      <DetailSheetCollapsibleSection
        id={DEAL_SHEET_SECTION.OFFER_CONTRACT}
        title="Offer"
        icon={<FileText size={12} />}
        open={offerCollapse.open}
        onOpenChange={offerCollapse.onOpenChange}
        className={cn(offerRequired && DETAIL_SHEET_STAGE_GATE_REQUIRED_CLASS)}
      >
        <DealFilesBlock dealId={dealId} purpose="OFFER" />
      </DetailSheetCollapsibleSection>

      <DetailSheetCollapsibleSection
        title="Contract"
        icon={<ScrollText size={12} />}
        open={contractCollapse.open}
        onOpenChange={contractCollapse.onOpenChange}
        className={cn(contractRequired && DETAIL_SHEET_STAGE_GATE_REQUIRED_CLASS)}
      >
        <DealFilesBlock dealId={dealId} purpose="CONTRACT" />
      </DetailSheetCollapsibleSection>
    </div>
  );
}
