'use client';

import {
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  FolderKanban,
  Layers,
  Receipt,
  Sparkles,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InlineField, SearchField } from '@/components/shared';
import { DEAL_TYPES, PAYMENT_TYPES, PRODUCT_CATEGORIES } from '../constants/dealPipeline';
import type { SearchLoader } from './deal-general-tab.types';
import type { DealGeneralDraft } from './deal-general-form-state';
import { TAX_STATUS_OPTIONS } from './deal-general-tab.helpers';
import { DEAL_SHEET_SECTION } from '@/features/shared/crm-sheet-section-ids';

interface DealInfoSectionProps {
  draft: DealGeneralDraft;
  patchDraft: (partial: Partial<DealGeneralDraft>) => void;
  filteredProductTypeOptions: Array<{ value: string; label: string }>;
  searchProjects: SearchLoader;
  searchProducts: SearchLoader;
  searchCompanies: SearchLoader;
  disabled?: boolean;
}

export function DealInfoSection({
  draft,
  patchDraft,
  filteredProductTypeOptions,
  searchProjects,
  searchProducts,
  searchCompanies,
  disabled = false,
}: DealInfoSectionProps) {
  const isExtension = draft.type === 'EXTENSION';

  return (
    <section
      id={DEAL_SHEET_SECTION.INFO}
      className="rounded-2xl border border-stone-100 bg-gradient-to-br from-stone-50/80 to-white p-5 dark:border-stone-800 dark:from-stone-900/30 dark:to-transparent"
    >
      <h4 className="text-muted-foreground mb-4 flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
        <Tag size={12} />
        Deal Info
      </h4>
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <InlineField
          variant="controlled"
          label="Cost"
          type="number"
          value={draft.amount ?? ''}
          placeholder="Enter amount..."
          icon={<DollarSign size={12} />}
          disabled={disabled}
          onValueChange={(v) => patchDraft({ amount: v === '' ? null : Number(v) })}
        />

        <InlineField
          variant="controlled"
          label="Payment Type"
          type="select"
          value={draft.paymentType ?? ''}
          options={PAYMENT_TYPES.map((type) => ({ value: type.value, label: type.label }))}
          placeholder="Select payment type..."
          icon={<CreditCard size={12} />}
          clearable
          disabled={disabled}
          onValueChange={(v) => patchDraft({ paymentType: v || null })}
        />

        <InlineField
          variant="controlled"
          label="Tax Status"
          type="select"
          value={draft.taxStatus}
          options={TAX_STATUS_OPTIONS.map((type) => ({ value: type.value, label: type.label }))}
          placeholder="Tax / Tax Free"
          icon={<Receipt size={12} />}
          disabled={disabled}
          onValueChange={(v) => patchDraft({ taxStatus: v })}
        />

        <SearchField
          selectionMode="stage"
          label="Project"
          value={draft.projectId}
          disabled={disabled}
          displayValue={
            draft.isNewProject ? (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <Sparkles size={13} />
                New Project
              </span>
            ) : draft.linkedProjectLabel ? (
              <span className="text-foreground text-sm font-medium">
                {draft.linkedProjectLabel}
              </span>
            ) : undefined
          }
          placeholder="Search projects..."
          icon={<FolderKanban size={12} />}
          onSearch={searchProjects}
          onStageSelect={(id, label) => {
            patchDraft({
              projectId: id,
              linkedProjectLabel: label,
              isNewProject: false,
            });
          }}
          onClear={() => {
            patchDraft({
              projectId: null,
              linkedProjectLabel: null,
              isNewProject: false,
            });
          }}
          newBadge={
            !draft.isNewProject ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                className="shrink-0 gap-1.5 border-emerald-200 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
                onClick={() => {
                  patchDraft({
                    isNewProject: true,
                    projectId: null,
                    linkedProjectLabel: null,
                  });
                }}
              >
                <Sparkles size={12} />
                New Project
              </Button>
            ) : undefined
          }
        />

        <InlineField
          variant="controlled"
          label="Deal Type"
          type="select"
          value={draft.type}
          options={DEAL_TYPES.map((type) => ({ value: type.value, label: type.label }))}
          icon={<Layers size={12} />}
          disabled={disabled}
          onValueChange={(v) => {
            if (v) patchDraft({ type: v });
          }}
        />

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

        {(draft.type === 'PRODUCT' || draft.type === 'OUTSOURCE') && (
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
            onValueChange={(v) => {
              if (!v) {
                patchDraft({ productCategory: null, productType: null });
                return;
              }
              patchDraft({ productCategory: v, productType: null });
            }}
          />
        )}

        {(draft.type === 'PRODUCT' || draft.type === 'OUTSOURCE') && draft.productCategory && (
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
            onValueChange={(v) => patchDraft({ productType: v || null })}
          />
        )}

        {isExtension && (
          <SearchField
            selectionMode="stage"
            label="Existing Product"
            value={draft.existingProductId}
            disabled={disabled}
            displayValue={
              draft.existingProductPickLabel ? (
                <span className="text-foreground text-sm font-medium">
                  {draft.existingProductPickLabel}
                </span>
              ) : undefined
            }
            placeholder="Search products..."
            icon={<Layers size={12} />}
            onSearch={searchProducts}
            onStageSelect={(id, label) =>
              patchDraft({ existingProductId: id, existingProductPickLabel: label })
            }
            onClear={() => patchDraft({ existingProductId: null, existingProductPickLabel: null })}
          />
        )}

        {(draft.taxStatus ?? 'TAX') === 'TAX' && (
          <SearchField
            selectionMode="stage"
            label="Company"
            value={draft.companyId}
            disabled={disabled}
            displayValue={
              draft.companyPickLabel ? (
                <span className="text-foreground text-sm font-medium">
                  {draft.companyPickLabel}
                </span>
              ) : undefined
            }
            placeholder="Search company..."
            icon={<Building2 size={12} />}
            onSearch={searchCompanies}
            onStageSelect={(id, label) => patchDraft({ companyId: id, companyPickLabel: label })}
            onClear={() => patchDraft({ companyId: null, companyPickLabel: null })}
          />
        )}
      </div>
    </section>
  );
}
