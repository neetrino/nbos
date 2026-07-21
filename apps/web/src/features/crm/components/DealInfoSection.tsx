'use client';

import { Building2, Calendar, CreditCard, FolderKanban, Layers, Receipt, Tag } from 'lucide-react';
import {
  AmdCurrencyIcon,
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DetailSheetFieldSegmented,
  InlineField,
  RelationPickerField,
} from '@/components/shared';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { DEAL_TYPES, PAYMENT_TYPES, PRODUCT_CATEGORIES } from '../constants/dealPipeline';
import type { SearchLoader } from './deal-general-tab.types';
import {
  buildDealProjectChangePatch,
  buildDealTypeChangePatch,
  type DealGeneralDraft,
} from './deal-general-form-state';
import { TAX_STATUS_OPTIONS } from './deal-general-tab.helpers';
import { dealStageGateFieldClass } from '@/features/crm/deal-stage-gate-highlight';

interface DealInfoFieldsProps {
  draft: DealGeneralDraft;
  patchDraft: (partial: Partial<DealGeneralDraft>) => void;
  filteredProductTypeOptions: Array<{ value: string; label: string }>;
  searchProjects: SearchLoader;
  searchProducts: SearchLoader;
  searchCompanies: SearchLoader;
  disabled?: boolean;
  /** When true, OUTSOURCE delivery toggle is locked (Deal Won). */
  outsourceToggleLocked?: boolean;
  gateRequiredFields?: ReadonlySet<string>;
}

/** Left column: commercial basics and company (when Tax). */
export function DealInfoProjectBillingFields({
  draft,
  patchDraft,
  searchCompanies,
  disabled = false,
  gateRequiredFields = new Set(),
}: Pick<
  DealInfoFieldsProps,
  'draft' | 'patchDraft' | 'searchCompanies' | 'disabled' | 'gateRequiredFields'
>) {
  const companyPicker = useRelationPickerActions('company');

  return (
    <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
      <InlineField
        variant="controlled"
        label="Cost"
        type="money"
        value={draft.amount ?? ''}
        placeholder="Enter amount..."
        icon={<AmdCurrencyIcon className="text-muted-foreground/70" />}
        disabled={disabled}
        className={dealStageGateFieldClass(gateRequiredFields, 'amount')}
        onValueChange={(v) => patchDraft({ amount: v === '' ? null : Number(v) })}
      />

      <DetailSheetFieldSegmented
        label="Tax Status"
        icon={<Receipt size={12} />}
        value={draft.taxStatus}
        options={TAX_STATUS_OPTIONS}
        disabled={disabled}
        className={dealStageGateFieldClass(gateRequiredFields, 'taxStatus')}
        onValueChange={(taxStatus) => patchDraft({ taxStatus })}
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

      {(draft.taxStatus ?? 'TAX') === 'TAX' && (
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
      )}
    </div>
  );
}

/** Right column: deal type, project, and product fields (order by deal type). */
export function DealInfoDealProductFields({
  draft,
  patchDraft,
  filteredProductTypeOptions,
  searchProjects,
  searchProducts,
  disabled = false,
  outsourceToggleLocked = false,
  gateRequiredFields = new Set(),
}: Omit<DealInfoFieldsProps, 'searchCompanies'>) {
  const isProductLike = draft.type === 'PRODUCT' || draft.type === 'OUTSOURCE';
  const isLinkedProductDeal = draft.type === 'EXTENSION' || draft.type === 'MAINTENANCE';
  const showProject = isProductLike || isLinkedProductDeal;
  const allowProjectCreate = isProductLike;
  const outsourceToggleDisabled = disabled || outsourceToggleLocked;

  const projectPicker = useRelationPickerActions('project');
  const productPicker = useRelationPickerActions(
    'product',
    'deal-existing-product',
    draft.projectId ? { projectId: draft.projectId } : undefined,
  );

  return (
    <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
      <InlineField
        variant="controlled"
        label="Deal Type"
        type="select"
        value={draft.type}
        options={DEAL_TYPES.map((type) => ({ value: type.value, label: type.label }))}
        icon={<Layers size={12} />}
        disabled={disabled}
        className={dealStageGateFieldClass(gateRequiredFields, 'type')}
        onValueChange={(v) => {
          if (v) patchDraft(buildDealTypeChangePatch(draft, v));
        }}
      />

      {showProject && (
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
          onOpenSelected={projectPicker.onOpenSelected}
          {...(allowProjectCreate ? { onCreate: projectPicker.onCreate } : {})}
        />
      )}

      {draft.type === 'OUTSOURCE' && (
        <div className="flex items-start gap-2 pt-1">
          <Checkbox
            id="deal-outsource-goes-to-delivery"
            checked={draft.outsourceGoesToDelivery}
            disabled={outsourceToggleDisabled}
            onCheckedChange={(checked) => patchDraft({ outsourceGoesToDelivery: checked === true })}
          />
          <div className="min-w-0">
            <Label htmlFor="deal-outsource-goes-to-delivery" className="text-sm font-medium">
              Goes to Delivery Board
            </Label>
            <p className="text-muted-foreground text-xs">
              OFF (default): Product in Hub / Finance / WhatsApp without active Starting…Transfer.
              ON: full delivery lifecycle after Won. Locked after Won.
            </p>
          </div>
        </div>
      )}

      {isProductLike && (
        <InlineField
          variant="controlled"
          label="Product Category"
          type="select"
          value={draft.productCategory ?? ''}
          options={PRODUCT_CATEGORIES.map((category) => ({
            value: category.value,
            label: category.label,
          }))}
          placeholder="Select category..."
          icon={<Layers size={12} />}
          clearable
          disabled={disabled}
          className={dealStageGateFieldClass(gateRequiredFields, 'productCategory')}
          onValueChange={(v) => {
            if (!v) {
              patchDraft({ productCategory: null, productType: null });
              return;
            }
            patchDraft({ productCategory: v, productType: null });
          }}
        />
      )}

      {isProductLike && draft.productCategory && (
        <InlineField
          variant="controlled"
          label="Product Type"
          type="select"
          value={draft.productType ?? ''}
          options={filteredProductTypeOptions}
          placeholder="Select product type..."
          icon={<Tag size={12} />}
          clearable
          disabled={disabled}
          className={dealStageGateFieldClass(gateRequiredFields, 'productType')}
          onValueChange={(v) => patchDraft({ productType: v || null })}
        />
      )}

      {isLinkedProductDeal && (
        <RelationPickerField
          label="Existing Product"
          entityKind="product"
          value={draft.existingProductId}
          selectionLabel={draft.existingProductPickLabel}
          className={dealStageGateFieldClass(gateRequiredFields, 'existingProductId')}
          disabled={disabled}
          placeholder={draft.projectId ? 'Search products…' : 'Select a project first…'}
          icon={<Layers size={12} />}
          onSearch={searchProducts}
          onSelect={(id, label) =>
            patchDraft({ existingProductId: id, existingProductPickLabel: label })
          }
          onClear={() => patchDraft({ existingProductId: null, existingProductPickLabel: null })}
          onOpenSelected={productPicker.onOpenSelected}
        />
      )}

      {draft.type === 'MAINTENANCE' && (
        <InlineField
          variant="controlled"
          label="Planned Maintenance Start"
          type="date"
          value={draft.maintenanceStartAt ?? ''}
          placeholder="Select start date..."
          icon={<Calendar size={12} />}
          disabled={disabled}
          onValueChange={(v) => patchDraft({ maintenanceStartAt: v || null })}
        />
      )}

      {draft.type !== 'MAINTENANCE' && (
        <InlineField
          variant="controlled"
          label="Deadline"
          type="date"
          datePickerVariant="extended"
          value={draft.deadline ?? ''}
          placeholder="Select delivery deadline…"
          icon={<Calendar size={12} />}
          disabled={disabled}
          className={dealStageGateFieldClass(gateRequiredFields, 'deadline')}
          onValueChange={(v) => patchDraft({ deadline: v || null })}
        />
      )}
    </div>
  );
}
