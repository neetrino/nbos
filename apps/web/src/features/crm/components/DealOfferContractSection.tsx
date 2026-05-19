'use client';

import { FileText, ScrollText } from 'lucide-react';
import { DetailSheetSection } from '@/components/shared';
import { DEAL_SHEET_SECTION } from '@/features/shared/crm-sheet-section-ids';
import { DealFilesBlock } from './DealFilesBlock';

interface DealOfferContractSectionProps {
  dealId: string;
}

export function DealOfferContractSection({ dealId }: DealOfferContractSectionProps) {
  return (
    <>
      <DetailSheetSection
        id={DEAL_SHEET_SECTION.OFFER_CONTRACT}
        title="Offer"
        icon={<FileText size={12} />}
      >
        <DealFilesBlock dealId={dealId} purpose="OFFER" />
      </DetailSheetSection>

      <DetailSheetSection title="Contract" icon={<ScrollText size={12} />}>
        <DealFilesBlock dealId={dealId} purpose="CONTRACT" />
      </DetailSheetSection>
    </>
  );
}
