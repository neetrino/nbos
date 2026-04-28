'use client';

import type { Dispatch, SetStateAction } from 'react';
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
import { InlineField, SearchField, StatusBadge } from '@/components/shared';
import {
  DEAL_TYPES,
  PAYMENT_TYPES,
  PRODUCT_CATEGORIES,
  formatAmount,
} from '../constants/dealPipeline';
import type { Deal } from '@/lib/api/deals';
import type { SaveField, SaveMultipleFields, SearchLoader } from './deal-general-tab.types';
import { formatDate, TAX_STATUS_OPTIONS, toDateInputValue } from './deal-general-tab.helpers';

interface DealInfoSectionProps {
  deal: Deal;
  linkedProjectName: string | null;
  isNewProject: boolean;
  productTypeOptions: Array<{ value: string; label: string }>;
  filteredProductTypeOptions: Array<{ value: string; label: string }>;
  setLinkedProjectName: Dispatch<SetStateAction<string | null>>;
  setIsNewProject: Dispatch<SetStateAction<boolean>>;
  searchProjects: SearchLoader;
  searchProducts: SearchLoader;
  searchCompanies: SearchLoader;
  saveField: SaveField;
  saveMultipleFields: SaveMultipleFields;
}

export function DealInfoSection({
  deal,
  linkedProjectName,
  isNewProject,
  productTypeOptions,
  filteredProductTypeOptions,
  setLinkedProjectName,
  setIsNewProject,
  searchProjects,
  searchProducts,
  searchCompanies,
  saveField,
  saveMultipleFields,
}: DealInfoSectionProps) {
  const dealTypeLabel = DEAL_TYPES.find((type) => type.value === deal.type)?.label ?? deal.type;
  const isExtension = deal.type === 'EXTENSION';

  return (
    <section className="rounded-2xl border border-stone-100 bg-gradient-to-br from-stone-50/80 to-white p-5 dark:border-stone-800 dark:from-stone-900/30 dark:to-transparent">
      <h4 className="text-muted-foreground mb-4 flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
        <Tag size={12} />
        Deal Info
      </h4>
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <InlineField
          label="Cost"
          value={deal.amount}
          displayValue={
            deal.amount != null ? (
              <span className="text-lg font-extrabold text-amber-600 tabular-nums dark:text-amber-400">
                {formatAmount(deal.amount)}
              </span>
            ) : undefined
          }
          type="number"
          placeholder="Enter amount..."
          icon={<DollarSign size={12} />}
          onSave={(value) => saveField('amount', value)}
        />

        <InlineField
          label="Payment Type"
          value={deal.paymentType}
          displayValue={
            deal.paymentType ? (
              <span className="text-foreground text-sm font-medium">
                {PAYMENT_TYPES.find((type) => type.value === deal.paymentType)?.label ??
                  deal.paymentType}
              </span>
            ) : undefined
          }
          type="select"
          options={PAYMENT_TYPES.map((type) => ({ value: type.value, label: type.label }))}
          placeholder="Select payment type..."
          icon={<CreditCard size={12} />}
          onSave={(value) => saveField('paymentType', value)}
        />

        <InlineField
          label="Tax Status"
          value={deal.taxStatus ?? 'TAX'}
          displayValue={
            <span className="text-foreground text-sm font-medium">
              {TAX_STATUS_OPTIONS.find((type) => type.value === (deal.taxStatus ?? 'TAX'))?.label ??
                deal.taxStatus ??
                'TAX'}
            </span>
          }
          type="select"
          options={TAX_STATUS_OPTIONS.map((type) => ({ value: type.value, label: type.label }))}
          placeholder="Tax / Tax Free"
          icon={<Receipt size={12} />}
          onSave={(value) => saveField('taxStatus', value)}
        />

        <SearchField
          label="Project"
          value={linkedProjectName}
          displayValue={
            isNewProject ? (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <Sparkles size={13} />
                New Project
              </span>
            ) : linkedProjectName ? (
              <span className="text-foreground text-sm font-medium">{linkedProjectName}</span>
            ) : undefined
          }
          placeholder="Search projects..."
          icon={<FolderKanban size={12} />}
          onSearch={searchProjects}
          onSave={async (value, label) => {
            await saveField('projectId', value);
            setLinkedProjectName(label);
            setIsNewProject(false);
          }}
          newBadge={
            !isNewProject ? (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 border-emerald-200 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
                onClick={() => {
                  setIsNewProject(true);
                  setLinkedProjectName(null);
                }}
              >
                <Sparkles size={12} />
                New Project
              </Button>
            ) : undefined
          }
        />

        <InlineField
          label="Deal Type"
          value={deal.type}
          displayValue={
            <StatusBadge label={dealTypeLabel} variant={getDealTypeVariant(deal.type)} />
          }
          type="select"
          options={DEAL_TYPES.map((type) => ({ value: type.value, label: type.label }))}
          icon={<Layers size={12} />}
          onSave={(value) => saveField('type', value)}
        />

        {deal.type === 'MAINTENANCE' && (
          <InlineField
            label="Planned Maintenance Start"
            value={toDateInputValue(deal.maintenanceStartAt)}
            displayValue={
              deal.maintenanceStartAt ? (
                <span className="text-foreground text-sm font-medium">
                  {formatDate(deal.maintenanceStartAt)}
                </span>
              ) : undefined
            }
            type="date"
            placeholder="Select start date..."
            icon={<Calendar size={12} />}
            onSave={(value) => saveField('maintenanceStartAt', value)}
          />
        )}

        {(deal.type === 'PRODUCT' || deal.type === 'OUTSOURCE') && (
          <InlineField
            label="Product Category"
            value={deal.productCategory ?? null}
            displayValue={
              deal.productCategory ? (
                <StatusBadge
                  label={
                    PRODUCT_CATEGORIES.find((category) => category.value === deal.productCategory)
                      ?.label ?? deal.productCategory
                  }
                  variant="purple"
                />
              ) : undefined
            }
            type="select"
            options={PRODUCT_CATEGORIES.map((category) => ({
              value: category.value,
              label: category.label,
            }))}
            placeholder="Select category..."
            icon={<Layers size={12} />}
            onSave={(value) =>
              saveMultipleFields({ productCategory: value as string, productType: null })
            }
          />
        )}

        {(deal.type === 'PRODUCT' || deal.type === 'OUTSOURCE') && deal.productCategory && (
          <InlineField
            label="Product Type"
            value={deal.productType ?? null}
            displayValue={
              deal.productType ? (
                <span className="text-foreground text-sm font-medium">
                  {productTypeOptions.find((type) => type.value === deal.productType)?.label ??
                    deal.productType}
                </span>
              ) : undefined
            }
            type="select"
            options={filteredProductTypeOptions}
            placeholder="Select product type..."
            icon={<Tag size={12} />}
            onSave={(value) => saveField('productType', value)}
          />
        )}

        {isExtension && (
          <SearchField
            label="Existing Product"
            value={deal.existingProductId ?? null}
            displayValue={
              deal.existingProduct ? (
                <span className="text-foreground text-sm font-medium">
                  {deal.existingProduct.name}
                </span>
              ) : undefined
            }
            placeholder="Search products..."
            icon={<Layers size={12} />}
            onSearch={searchProducts}
            onSave={(value) => saveField('existingProductId', value)}
          />
        )}

        {(deal.taxStatus ?? 'TAX') === 'TAX' && (
          <SearchField
            label="Company"
            value={deal.companyId ?? null}
            displayValue={
              deal.company ? (
                <span className="text-foreground text-sm font-medium">{deal.company.name}</span>
              ) : undefined
            }
            placeholder="Search company..."
            icon={<Building2 size={12} />}
            onSearch={searchCompanies}
            onSave={(value) => saveField('companyId', value)}
          />
        )}
      </div>
    </section>
  );
}

function getDealTypeVariant(type: string) {
  if (type === 'EXTENSION') return 'blue';
  if (type === 'OUTSOURCE') return 'purple';
  if (type === 'MAINTENANCE') return 'teal';
  return 'amber';
}
