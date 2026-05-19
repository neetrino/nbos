'use client';

import { FileText, ScrollText } from 'lucide-react';
import { DetailSheetCollapsibleSection } from '@/components/shared';
import { DEAL_SHEET_SECTION } from '@/features/shared/crm-sheet-section-ids';
import {
  DEAL_SHEET_COLLAPSE_KEY,
  useDealSheetSectionCollapse,
} from '../hooks/use-deal-sheet-section-collapse';
import { DealFilesBlock } from './DealFilesBlock';

interface DealOfferContractSectionProps {
  dealId: string;
}

export function DealOfferContractSection({ dealId }: DealOfferContractSectionProps) {
  const offerCollapse = useDealSheetSectionCollapse(DEAL_SHEET_COLLAPSE_KEY.OFFER);
  const contractCollapse = useDealSheetSectionCollapse(DEAL_SHEET_COLLAPSE_KEY.CONTRACT);

  return (
    <div className="flex flex-col gap-4">
      <DetailSheetCollapsibleSection
        id={DEAL_SHEET_SECTION.OFFER_CONTRACT}
        title="Offer"
        icon={<FileText size={12} />}
        open={offerCollapse.open}
        onOpenChange={offerCollapse.onOpenChange}
      >
        <DealFilesBlock dealId={dealId} purpose="OFFER" />
      </DetailSheetCollapsibleSection>

      <DetailSheetCollapsibleSection
        title="Contract"
        icon={<ScrollText size={12} />}
        open={contractCollapse.open}
        onOpenChange={contractCollapse.onOpenChange}
      >
        <DealFilesBlock dealId={dealId} purpose="CONTRACT" />
      </DetailSheetCollapsibleSection>
    </div>
  );
}
