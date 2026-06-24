'use client';

import { useState } from 'react';
import {
  Calendar,
  CircleDot,
  DollarSign,
  FolderKanban,
  Layers,
  Receipt,
  RefreshCw,
  Tag,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DetailSheetCollapsibleSection,
  DetailSheetFieldSegmented,
  DetailSheetSection,
  EntityNotesSection,
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
  CLIENT_SERVICE_STATUS_SEGMENTED_OPTIONS,
  CLIENT_SERVICE_TYPE_SEGMENTED_OPTIONS,
} from '@/features/finance/constants/client-services';
import { INVOICE_TAX_STATUS_OPTIONS } from '@/features/finance/constants/finance';
import type { ClientServiceFormState } from '@/features/finance/utils/client-service-form-state';
import type { ClientServiceRecord } from '@/lib/api/client-services';
import type { Project } from '@/lib/api/projects';
function mapSelectOptions(options: ReadonlyArray<{ value: string; label: string }>) {
  return options.map((row) => ({ value: row.value, label: row.label }));
}

const TAX_OPTIONS = mapSelectOptions(INVOICE_TAX_STATUS_OPTIONS);

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
  const [datesOpen, setDatesOpen] = useState(true);
  const searchProjects = useProjectRelationSearch();
  const projectPicker = useRelationPickerActions('project');

  const linkedProject = projects.find((p) => p.id === draft.projectId);
  const projectLabel = linkedProject ? `${linkedProject.code} — ${linkedProject.name}` : null;

  return (
    <div className="flex max-w-[48rem] flex-col gap-4">
      <DetailSheetCollapsibleSection
        title="Basics"
        icon={<Tag size={12} />}
        open={basicsOpen}
        onOpenChange={setBasicsOpen}
      >
        <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InlineField
              variant="controlled"
              label="Name"
              type="text"
              value={draft.name}
              placeholder="Service name"
              disabled={formDisabled}
              className="min-w-0"
              onValueChange={(name) => patchDraft({ name })}
            />
            <RelationPickerField
              label="Project"
              entityKind="project"
              value={draft.projectId || null}
              selectionLabel={projectLabel}
              placeholder="Search projects…"
              icon={<FolderKanban size={12} />}
              disabled={formDisabled}
              className="min-w-0"
              onSearch={searchProjects}
              onSelect={(id) => patchDraft({ projectId: id })}
              {...projectPicker}
            />
          </div>
          <DetailSheetFieldSegmented
            label="Type"
            icon={<Layers size={12} />}
            value={draft.type}
            options={CLIENT_SERVICE_TYPE_SEGMENTED_OPTIONS}
            disabled={formDisabled}
            onValueChange={(type) => patchDraft({ type })}
          />
          <DetailSheetFieldSegmented
            label="Status"
            icon={<CircleDot size={12} />}
            value={draft.status}
            options={CLIENT_SERVICE_STATUS_SEGMENTED_OPTIONS}
            disabled={formDisabled}
            onValueChange={(status) => patchDraft({ status })}
          />
          <InlineField
            variant="controlled"
            label="Provider"
            type="text"
            value={draft.provider}
            placeholder="Optional"
            disabled={formDisabled}
            onValueChange={(provider) => patchDraft({ provider })}
          />
        </div>
      </DetailSheetCollapsibleSection>

      <DetailSheetCollapsibleSection
        title="Billing"
        icon={<DollarSign size={12} />}
        open={billingOpen}
        onOpenChange={setBillingOpen}
      >
        <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
          <InlineField
            variant="controlled"
            label="Billing model"
            type="select"
            value={draft.billingModel}
            options={mapSelectOptions(CLIENT_SERVICE_BILLING_MODELS)}
            disabled={formDisabled}
            onValueChange={(billingModel) => billingModel && patchDraft({ billingModel })}
          />
          <InlineField
            variant="controlled"
            label="Pricing"
            type="select"
            value={draft.pricingModel}
            options={mapSelectOptions(CLIENT_SERVICE_PRICING_MODELS)}
            disabled={formDisabled}
            onValueChange={(pricingModel) => pricingModel && patchDraft({ pricingModel })}
          />
          <InlineField
            variant="controlled"
            label="Frequency"
            type="select"
            value={draft.frequency}
            options={mapSelectOptions(CLIENT_SERVICE_FREQUENCIES)}
            disabled={formDisabled}
            onValueChange={(frequency) => frequency && patchDraft({ frequency })}
          />
          <InlineField
            variant="controlled"
            label="Our cost"
            type="money"
            value={draft.ourCost}
            icon={<DollarSign size={12} />}
            disabled={formDisabled}
            onValueChange={(ourCost) => patchDraft({ ourCost })}
          />
          <InlineField
            variant="controlled"
            label="Client charge"
            type="money"
            value={draft.clientCharge}
            icon={<DollarSign size={12} />}
            disabled={formDisabled}
            onValueChange={(clientCharge) => patchDraft({ clientCharge })}
          />
          <InlineField
            variant="controlled"
            label="Tax Status"
            type="select"
            value={draft.taxStatus}
            options={TAX_OPTIONS}
            placeholder="Tax / Tax Free"
            icon={<Receipt size={12} />}
            disabled={formDisabled}
            onValueChange={(taxStatus) => taxStatus && patchDraft({ taxStatus })}
          />
        </div>
      </DetailSheetCollapsibleSection>

      <DetailSheetCollapsibleSection
        title="Dates"
        icon={<Calendar size={12} />}
        open={datesOpen}
        onOpenChange={setDatesOpen}
      >
        <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InlineField
              variant="controlled"
              label="Start date"
              type="date"
              value={draft.startDate}
              icon={<Calendar size={12} />}
              disabled={formDisabled}
              onValueChange={(startDate) => patchDraft({ startDate })}
            />
            <InlineField
              variant="controlled"
              label="Renewal date"
              type="date"
              value={draft.renewalDate}
              icon={<RefreshCw size={12} />}
              disabled={formDisabled}
              onValueChange={(renewalDate) => patchDraft({ renewalDate })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={draft.notificationsEnabled}
              disabled={formDisabled}
              onCheckedChange={(checked) => patchDraft({ notificationsEnabled: checked === true })}
            />
            Renewal notifications
          </label>
        </div>
      </DetailSheetCollapsibleSection>

      <EntityNotesSection
        entityType="generic"
        entityId={serviceId}
        value={draft.notes}
        onChange={(notes) => patchDraft({ notes: notes ?? '' })}
        placeholder="Optional notes…"
        disabled={formDisabled}
      />

      <DetailSheetSection title="Proofs">
        <FinanceProofAttachments
          entityType="CLIENT_SERVICE_RECORD"
          entityId={serviceId}
          purpose="EXPENSE_PROOF"
          title=""
        />
      </DetailSheetSection>
    </div>
  );
}
