'use client';

import { useState } from 'react';
import {
  CalendarDays,
  CircleDot,
  DollarSign,
  FolderKanban,
  Layers,
  Receipt,
  Tag,
  Wallet,
} from 'lucide-react';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DETAIL_SHEET_TAB_BODY_STRETCH_CLASS,
  DetailSheetCollapsibleSection,
  DetailSheetOptionalDescription,
  DetailSheetSection,
  InlineField,
  RelationPickerField,
} from '@/components/shared';
import { useProjectRelationSearch } from '@/components/shared/relation-picker/relation-search-loaders';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { FinanceProofAttachments } from '@/features/finance/components/FinanceProofAttachments';
import {
  CLIENT_SERVICE_BILLING_MODELS,
  CLIENT_SERVICE_FREQUENCIES,
  CLIENT_SERVICE_PRICING_MODELS,
  CLIENT_SERVICE_STATUSES,
  CLIENT_SERVICE_TYPES,
} from '@/features/finance/constants/client-services';
import { INVOICE_TAX_STATUS_OPTIONS } from '@/features/finance/constants/finance';
import {
  EXPENSE_SHEET_FIELD_CELL_CLASS,
  EXPENSE_SHEET_FIELD_ROW_3_CLASS,
} from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import type { ClientServiceFormState } from '@/features/finance/utils/client-service-form-state';
import type { ClientServiceRecord } from '@/lib/api/client-services';
import type { Project } from '@/lib/api/projects';
import { projectDisplayName } from '@/lib/format/project-product-display';
import { ClientServiceGeneralDatesSection } from './ClientServiceGeneralDatesSection';

interface ClientServiceGeneralTabProps {
  serviceId: string;
  service: ClientServiceRecord;
  draft: ClientServiceFormState;
  patchDraft: (partial: Partial<ClientServiceFormState>) => void;
  projects: Project[];
  formDisabled?: boolean;
}

export function ClientServiceGeneralTab({
  serviceId,
  draft,
  patchDraft,
  projects,
  formDisabled = false,
}: ClientServiceGeneralTabProps) {
  const [basicsOpen, setBasicsOpen] = useState(true);
  const [billingOpen, setBillingOpen] = useState(true);
  const searchProjects = useProjectRelationSearch();
  const projectPicker = useRelationPickerActions('project');

  const linkedProject = projects.find((p) => p.id === draft.projectId);
  const projectLabel = projectDisplayName(linkedProject);

  return (
    <div className={`${DETAIL_SHEET_TAB_BODY_STRETCH_CLASS} w-full max-w-none gap-3`}>
      <DetailSheetCollapsibleSection
        title="Basics"
        icon={<Tag size={12} />}
        open={basicsOpen}
        onOpenChange={setBasicsOpen}
      >
        <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
          <RelationPickerField
            label="Project"
            entityKind="project"
            value={draft.projectId || null}
            selectionLabel={projectLabel}
            placeholder="Search projects…"
            icon={<FolderKanban size={12} />}
            disabled={formDisabled}
            className="w-full min-w-0"
            onSearch={searchProjects}
            onSelect={(id) => patchDraft({ projectId: id })}
            {...projectPicker}
          />
          <div className={EXPENSE_SHEET_FIELD_ROW_3_CLASS}>
            <InlineField
              variant="controlled"
              label="Type"
              type="select"
              value={draft.type}
              options={CLIENT_SERVICE_TYPES.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              icon={<Layers size={12} />}
              disabled={formDisabled}
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(type) => type && patchDraft({ type })}
            />
            <InlineField
              variant="controlled"
              label="Status"
              type="select"
              value={draft.status}
              options={CLIENT_SERVICE_STATUSES.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              icon={<CircleDot size={12} />}
              disabled={formDisabled}
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(status) => status && patchDraft({ status })}
            />
            <InlineField
              variant="controlled"
              label="Provider"
              type="text"
              value={draft.provider}
              placeholder="Optional"
              disabled={formDisabled}
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(provider) => patchDraft({ provider })}
            />
          </div>
        </div>
      </DetailSheetCollapsibleSection>

      <DetailSheetCollapsibleSection
        title="Billing"
        icon={<DollarSign size={12} />}
        open={billingOpen}
        onOpenChange={setBillingOpen}
      >
        <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
          <div className={EXPENSE_SHEET_FIELD_ROW_3_CLASS}>
            <InlineField
              variant="controlled"
              label="Billing model"
              type="select"
              value={draft.billingModel}
              options={CLIENT_SERVICE_BILLING_MODELS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              icon={<Wallet size={12} />}
              disabled={formDisabled}
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(billingModel) => billingModel && patchDraft({ billingModel })}
            />
            <InlineField
              variant="controlled"
              label="Pricing"
              type="select"
              value={draft.pricingModel}
              options={CLIENT_SERVICE_PRICING_MODELS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              icon={<Tag size={12} />}
              disabled={formDisabled}
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(pricingModel) => pricingModel && patchDraft({ pricingModel })}
            />
            <InlineField
              variant="controlled"
              label="Frequency"
              type="select"
              value={draft.frequency}
              options={CLIENT_SERVICE_FREQUENCIES.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              icon={<CalendarDays size={12} />}
              disabled={formDisabled}
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(frequency) => frequency && patchDraft({ frequency })}
            />
          </div>
          <div className={EXPENSE_SHEET_FIELD_ROW_3_CLASS}>
            <InlineField
              variant="controlled"
              label="Our cost"
              type="money"
              value={draft.ourCost}
              icon={<DollarSign size={12} />}
              disabled={formDisabled}
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(ourCost) => patchDraft({ ourCost })}
            />
            <InlineField
              variant="controlled"
              label="Client charge"
              type="money"
              value={draft.clientCharge}
              icon={<DollarSign size={12} />}
              disabled={formDisabled}
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(clientCharge) => patchDraft({ clientCharge })}
            />
            <InlineField
              variant="controlled"
              label="Tax"
              type="select"
              value={draft.taxStatus}
              options={INVOICE_TAX_STATUS_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              icon={<Receipt size={12} />}
              disabled={formDisabled}
              className={EXPENSE_SHEET_FIELD_CELL_CLASS}
              onValueChange={(taxStatus) => taxStatus && patchDraft({ taxStatus })}
            />
          </div>
        </div>
      </DetailSheetCollapsibleSection>

      <ClientServiceGeneralDatesSection
        draft={draft}
        patchDraft={patchDraft}
        formDisabled={formDisabled}
      />

      <DetailSheetSection title="Proofs">
        <FinanceProofAttachments
          entityType="CLIENT_SERVICE_RECORD"
          entityId={serviceId}
          purpose="EXPENSE_PROOF"
          title=""
        />
      </DetailSheetSection>

      <DetailSheetOptionalDescription
        entityType="generic"
        entityId={serviceId}
        value={draft.notes}
        onChange={(notes) => patchDraft({ notes: notes ?? '' })}
        disabled={formDisabled}
      />
    </div>
  );
}
