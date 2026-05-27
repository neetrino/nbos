'use client';

import { useCallback, useEffect, useState } from 'react';
import { PRODUCT_TYPES, PRODUCT_TYPES_BY_CATEGORY } from '../constants/dealPipeline';
import type { Deal } from '@/lib/api/deals';
import { contactsApi, companiesApi } from '@/lib/api/clients';
import { marketingApi } from '@/lib/api/marketing';
import { partnersApi } from '@/lib/api/partners';
import { productsApi } from '@/lib/api/products';
import { projectsApi } from '@/lib/api/projects';
import { systemListsApi } from '@/lib/api/systemLists';
import { employeesApi } from '@/lib/api/employees';
import {
  DETAIL_SHEET_PAIRED_COLUMNS_CLASS,
  DETAIL_SHEET_PAIRED_FULL_WIDTH_CLASS,
  DETAIL_SHEET_SECTION_STRETCH_CLASS,
} from '@/components/shared';
import { cn } from '@/lib/utils';
import { DealContactTeamSection } from './DealContactTeamSection';
import { DealFinanceActionsPanel } from './DealFinanceActionsPanel';
import { DealHandoffPanel } from './DealHandoffPanel';
import { DealCombinedInfoSection } from './DealCombinedInfoSection';
import { DealMarketingSection } from './DealMarketingSection';
import { DealOfferContractSection } from './DealOfferContractSection';
import { DealSourceLeadSection } from './DealSourceLeadSection';
import type { DealGeneralDraft } from './deal-general-form-state';

interface DealGeneralTabProps {
  deal: Deal;
  draft: DealGeneralDraft;
  patchDraft: (partial: Partial<DealGeneralDraft>) => void;
  formDisabled?: boolean;
  onRefresh?: () => void;
  onOpenTaskTab?: () => void;
  onOpenDeal?: (id: string) => void;
  gateRequiredFields?: ReadonlySet<string>;
}

const SECTION_STRETCH = DETAIL_SHEET_SECTION_STRETCH_CLASS;

export function DealGeneralTab({
  deal,
  draft,
  patchDraft,
  formDisabled = false,
  onRefresh,
  onOpenTaskTab,
  onOpenDeal,
  gateRequiredFields = new Set(),
}: DealGeneralTabProps) {
  const [productTypeOptions, setProductTypeOptions] = useState<
    Array<{ value: string; label: string }>
  >(PRODUCT_TYPES.map((product) => ({ value: product.value, label: product.label })));

  useEffect(() => {
    systemListsApi
      .getOptionsByKey('PRODUCT_TYPE')
      .then((options) =>
        setProductTypeOptions(
          options.map((option) => ({ value: option.code, label: option.label })),
        ),
      )
      .catch(() => {
        /* keep PRODUCT_TYPES fallback */
      });
  }, []);

  const searchProjects = useCallback(async (query: string) => {
    const data = await projectsApi.getAll({ pageSize: 5, search: query || undefined });
    return data.items.map((project) => ({
      value: project.id,
      label: project.name,
      subtitle: project.code,
    }));
  }, []);

  const searchContacts = useCallback(async (query: string) => {
    const data = await contactsApi.getAll({ pageSize: 5, search: query || undefined });
    return data.items.map((contact) => ({
      value: contact.id,
      label: `${contact.firstName} ${contact.lastName}`,
      subtitle: contact.email ?? undefined,
    }));
  }, []);

  const searchAttributionOptions = useCallback(
    async (query: string) => {
      if (!draft.sourceDetail) return [];
      const options = await marketingApi.getAttributionOptions(draft.sourceDetail);
      return options
        .filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
        .map((option) => ({
          value: `${option.type}:${option.id}`,
          label: option.label,
          subtitle: option.subtitle ?? option.type,
        }));
    },
    [draft.sourceDetail],
  );

  const searchPartners = useCallback(async (query: string) => {
    const data = await partnersApi.getAll({ pageSize: 5, search: query || undefined });
    return data.items.map((partner) => ({ value: partner.id, label: partner.name }));
  }, []);

  const searchProducts = useCallback(async (query: string) => {
    const data = await productsApi.getAll({ pageSize: 10, search: query || undefined });
    return data.items.map((product) => ({
      value: product.id,
      label: product.name,
      subtitle: product.productType,
    }));
  }, []);

  const searchCompanies = useCallback(async (query: string) => {
    const data = await companiesApi.getAll({
      pageSize: 10,
      ...(query && { search: query }),
    });
    return data.items.map((company) => ({ value: company.id, label: company.name }));
  }, []);

  const searchEmployees = useCallback(async (query: string) => {
    const data = await employeesApi.getAll({ pageSize: 20, search: query || undefined });
    return data.items.map((employee) => ({
      value: employee.id,
      label: `${employee.firstName} ${employee.lastName}`,
      subtitle: employee.position ?? employee.email,
    }));
  }, []);

  const firstOrder = deal.orders?.[0];
  const projectId = deal.projectId ?? firstOrder?.projectId;
  const taxStatus = deal.taxStatus ?? 'TAX';

  const filteredProductTypeOptions = getFilteredProductTypeOptions(draft, productTypeOptions);

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,52rem)_minmax(0,1fr)_auto] xl:items-start xl:gap-6">
      <div className="flex max-w-[52rem] min-w-0 flex-col gap-4">
        <DealCombinedInfoSection
          entityId={deal.id}
          draft={draft}
          patchDraft={patchDraft}
          filteredProductTypeOptions={filteredProductTypeOptions}
          searchProjects={searchProjects}
          searchProducts={searchProducts}
          searchCompanies={searchCompanies}
          disabled={formDisabled}
          gateRequiredFields={gateRequiredFields}
        />
        <DealOfferContractSection dealId={deal.id} gateRequiredFields={gateRequiredFields} />
        <div className={cn(DETAIL_SHEET_PAIRED_COLUMNS_CLASS)}>
          <DealContactTeamSection
            deal={deal}
            draft={draft}
            patchDraft={patchDraft}
            searchEmployees={searchEmployees}
            disabled={formDisabled}
            gateRequiredFields={gateRequiredFields}
            sectionClassName={cn(SECTION_STRETCH, DETAIL_SHEET_PAIRED_FULL_WIDTH_CLASS)}
          />
          <DealMarketingSection
            deal={deal}
            draft={draft}
            patchDraft={patchDraft}
            searchAttributionOptions={searchAttributionOptions}
            searchPartners={searchPartners}
            searchContacts={searchContacts}
            onRefresh={onRefresh}
            disabled={formDisabled}
            gateRequiredFields={gateRequiredFields}
            sectionClassName={cn(SECTION_STRETCH, DETAIL_SHEET_PAIRED_FULL_WIDTH_CLASS)}
          />
          <DealSourceLeadSection deal={deal} className={DETAIL_SHEET_PAIRED_FULL_WIDTH_CLASS} />
        </div>
        <DealEntityMetaLine createdAt={deal.createdAt} updatedAt={deal.updatedAt} />
      </div>

      <div aria-hidden className="hidden min-h-0 xl:block" />

      <aside className="flex w-64 shrink-0 flex-col gap-4 xl:w-72">
        <DealFinanceActionsPanel
          deal={deal}
          projectId={projectId}
          firstOrder={firstOrder}
          taxStatus={taxStatus}
          onRefresh={onRefresh}
          onOpenTaskTab={onOpenTaskTab}
        />
        <DealHandoffPanel deal={deal} onOpenDeal={onOpenDeal} />
      </aside>
    </div>
  );
}

function getFilteredProductTypeOptions(
  draft: DealGeneralDraft,
  productTypeOptions: Array<{ value: string; label: string }>,
) {
  const category = draft.productCategory;
  if (!category) return productTypeOptions;
  const allowed = PRODUCT_TYPES_BY_CATEGORY[category] ?? [];
  if (allowed.length === 0) return productTypeOptions;
  return productTypeOptions.filter(
    (option) => allowed.includes(option.value) || option.value === 'OTHER',
  );
}

interface DealEntityMetaLineProps {
  createdAt: string;
  updatedAt: string;
}

function DealEntityMetaLine({ createdAt, updatedAt }: DealEntityMetaLineProps) {
  return (
    <p className="text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-1 px-1 text-xs tabular-nums">
      <span>
        <span className="font-medium">Created</span> {formatDealMetaDate(createdAt)}
      </span>
      <span aria-hidden className="text-muted-foreground/40">
        |
      </span>
      <span>
        <span className="font-medium">Last updated</span> {formatDealMetaDate(updatedAt)}
      </span>
    </p>
  );
}

function formatDealMetaDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
