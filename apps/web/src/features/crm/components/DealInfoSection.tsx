'use client';

import { Building2, CreditCard, FolderKanban } from 'lucide-react';
import {
  AmdCurrencyIcon,
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DetailSheetFieldSegmented,
  InlineField,
  RelationPickerField,
} from '@/components/shared';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { PAYMENT_TYPES } from '../constants/dealPipeline';
import type { SearchLoader } from './deal-general-tab.types';
import { buildDealProjectChangePatch, type DealGeneralDraft } from './deal-general-form-state';
import { TAX_STATUS_OPTIONS } from './deal-general-tab.helpers';
import { dealStageGateFieldClass } from '@/features/crm/deal-stage-gate-highlight';
import {
  DealSubscriptionTermField,
  dealAmountFieldLabel,
  showDealSubscriptionTermFields,
} from './DealSubscriptionTermField';

export { DealInfoDealProductFields } from './DealInfoDealProductFields';

interface DealInfoProjectBillingFieldsProps {
  draft: DealGeneralDraft;
  patchDraft: (partial: Partial<DealGeneralDraft>) => void;
  searchProjects: SearchLoader;
  searchCompanies: SearchLoader;
  disabled?: boolean;
  gateRequiredFields?: ReadonlySet<string>;
}

/** Left column: commercial basics, then always-visible Project and Company. */
export function DealInfoProjectBillingFields({
  draft,
  patchDraft,
  searchProjects,
  searchCompanies,
  disabled = false,
  gateRequiredFields = new Set(),
}: DealInfoProjectBillingFieldsProps) {
  return (
    <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
      <DealInfoCommercialFields
        draft={draft}
        patchDraft={patchDraft}
        disabled={disabled}
        gateRequiredFields={gateRequiredFields}
      />
      <DealInfoProjectField
        draft={draft}
        patchDraft={patchDraft}
        searchProjects={searchProjects}
        disabled={disabled}
        gateRequiredFields={gateRequiredFields}
      />
      <DealInfoCompanyField
        draft={draft}
        patchDraft={patchDraft}
        searchCompanies={searchCompanies}
        disabled={disabled}
        gateRequiredFields={gateRequiredFields}
      />
    </div>
  );
}

function DealInfoCommercialFields({
  draft,
  patchDraft,
  disabled = false,
  gateRequiredFields = new Set(),
}: Omit<DealInfoProjectBillingFieldsProps, 'searchProjects' | 'searchCompanies'>) {
  const showSubscriptionTerm = showDealSubscriptionTermFields(draft);

  return (
    <>
      <InlineField
        variant="controlled"
        label={dealAmountFieldLabel(draft.paymentType)}
        type="money"
        value={draft.amount ?? ''}
        placeholder="Enter amount..."
        icon={<AmdCurrencyIcon className="text-muted-foreground/70" />}
        disabled={disabled}
        className={dealStageGateFieldClass(gateRequiredFields, 'amount')}
        onValueChange={(v) => patchDraft({ amount: v === '' ? null : Number(v) })}
      />

      <DetailSheetFieldSegmented
        label="Payment Type"
        icon={<CreditCard size={12} />}
        value={draft.paymentType}
        options={PAYMENT_TYPES}
        disabled={disabled}
        className={dealStageGateFieldClass(gateRequiredFields, 'paymentType')}
        onValueChange={(paymentType) => patchDraft({ paymentType })}
      />

      {showSubscriptionTerm ? (
        <DealSubscriptionTermField
          draft={draft}
          patchDraft={patchDraft}
          disabled={disabled}
          gateRequiredFields={gateRequiredFields}
        />
      ) : null}

      <DetailSheetFieldSegmented
        label="Tax Status"
        hideLabel
        value={draft.taxStatus}
        options={TAX_STATUS_OPTIONS}
        disabled={disabled}
        className={dealStageGateFieldClass(gateRequiredFields, 'taxStatus')}
        onValueChange={(taxStatus) => patchDraft({ taxStatus })}
      />
    </>
  );
}

function DealInfoProjectField({
  draft,
  patchDraft,
  searchProjects,
  disabled = false,
  gateRequiredFields = new Set(),
}: Omit<DealInfoProjectBillingFieldsProps, 'searchCompanies'>) {
  const projectPicker = useRelationPickerActions('project');

  return (
    <RelationPickerField
      label="Project"
      entityKind="project"
      value={draft.projectId}
      selectionLabel={draft.linkedProjectLabel}
      className={dealStageGateFieldClass(gateRequiredFields, 'projectId')}
      disabled={disabled}
      placeholder="Search projects…"
      icon={<FolderKanban size={12} />}
      onSearch={searchProjects}
      onSelect={(id, label) => patchDraft(buildDealProjectChangePatch(id, label))}
      onClear={() => patchDraft(buildDealProjectChangePatch(null, null))}
      {...projectPicker}
    />
  );
}

function DealInfoCompanyField({
  draft,
  patchDraft,
  searchCompanies,
  disabled = false,
  gateRequiredFields = new Set(),
}: Omit<DealInfoProjectBillingFieldsProps, 'searchProjects'>) {
  const companyPicker = useRelationPickerActions('company');

  return (
    <RelationPickerField
      label="Company"
      entityKind="company"
      value={draft.companyId}
      selectionLabel={draft.companyPickLabel}
      className={dealStageGateFieldClass(gateRequiredFields, 'companyId')}
      disabled={disabled}
      placeholder="Search company…"
      icon={<Building2 size={12} />}
      onSearch={searchCompanies}
      onSelect={(id, label) => patchDraft({ companyId: id, companyPickLabel: label })}
      onClear={() => patchDraft({ companyId: null, companyPickLabel: null })}
      {...companyPicker}
    />
  );
}
