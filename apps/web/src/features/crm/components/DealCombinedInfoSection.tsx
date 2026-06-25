'use client';

import { Briefcase } from 'lucide-react';
import {
  DETAIL_SHEET_COLUMN_DIVIDER_CLASS,
  DETAIL_SHEET_SUBSECTION_LABEL_CLASS,
  DetailSheetCollapsibleSection,
} from '@/components/shared';
import { DEAL_SHEET_SECTION } from '@/features/shared/crm-sheet-section-ids';
import {
  DEAL_SHEET_COLLAPSE_KEY,
  useDealSheetSectionCollapse,
} from '../hooks/use-deal-sheet-section-collapse';
import { DealInfoDealProductFields, DealInfoProjectBillingFields } from './DealInfoSection';
import type { SearchLoader } from './deal-general-tab.types';
import type { DealGeneralDraft } from './deal-general-form-state';

interface DealCombinedInfoSectionProps {
  draft: DealGeneralDraft;
  patchDraft: (partial: Partial<DealGeneralDraft>) => void;
  filteredProductTypeOptions: Array<{ value: string; label: string }>;
  searchProjects: SearchLoader;
  searchProducts: SearchLoader;
  searchCompanies: SearchLoader;
  disabled?: boolean;
  gateRequiredFields?: ReadonlySet<string>;
}

export function DealCombinedInfoSection({
  draft,
  patchDraft,
  filteredProductTypeOptions,
  searchProjects,
  searchProducts,
  searchCompanies,
  disabled = false,
  gateRequiredFields = new Set(),
}: DealCombinedInfoSectionProps) {
  const { open, onOpenChange } = useDealSheetSectionCollapse(DEAL_SHEET_COLLAPSE_KEY.DEAL_PROJECT);

  return (
    <DetailSheetCollapsibleSection
      id={DEAL_SHEET_SECTION.INFO}
      title="Deal & project"
      icon={<Briefcase size={12} />}
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-0">
        <div className="min-w-0 sm:pr-5">
          <p className={DETAIL_SHEET_SUBSECTION_LABEL_CLASS}>Project & billing</p>
          <DealInfoProjectBillingFields
            draft={draft}
            patchDraft={patchDraft}
            searchProjects={searchProjects}
            searchCompanies={searchCompanies}
            disabled={disabled}
            gateRequiredFields={gateRequiredFields}
          />
        </div>
        <div className={`min-w-0 ${DETAIL_SHEET_COLUMN_DIVIDER_CLASS}`}>
          <p className={DETAIL_SHEET_SUBSECTION_LABEL_CLASS}>Deal & product</p>
          <DealInfoDealProductFields
            draft={draft}
            patchDraft={patchDraft}
            filteredProductTypeOptions={filteredProductTypeOptions}
            searchProducts={searchProducts}
            disabled={disabled}
            gateRequiredFields={gateRequiredFields}
          />
        </div>
      </div>
    </DetailSheetCollapsibleSection>
  );
}
