'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import { DetailSheetCollapsibleSection } from '@/components/shared';
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
  onFilesChanged?: () => void;
}

export function DealOfferContractSection({
  dealId,
  gateRequiredFields = new Set(),
  onFilesChanged,
}: DealOfferContractSectionProps) {
  const t = useTranslations('crm');
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
      title={t('dealSheet.sectionOfferContract')}
      icon={<FileText size={12} />}
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="flex flex-col gap-5">
        <div
          className={cn('min-w-0', dealStageGateFieldClass(gateRequiredFields, 'offerProof', ''))}
        >
          <DealFilesBlock
            dealId={dealId}
            purpose="OFFER"
            outlinedLabel={t('dealSheet.files.offer')}
            onFilesChanged={onFilesChanged}
          />
        </div>
        <div
          className={cn(
            'min-w-0',
            dealStageGateFieldClass(gateRequiredFields, 'contractProof', ''),
          )}
        >
          <DealFilesBlock
            dealId={dealId}
            purpose="CONTRACT"
            outlinedLabel={t('dealSheet.files.contract')}
            onFilesChanged={onFilesChanged}
          />
        </div>
      </div>
    </DetailSheetCollapsibleSection>
  );
}
