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
import { DealContactTeamSection } from './DealContactTeamSection';
import { DealFinanceActionsPanel } from './DealFinanceActionsPanel';
import { DealHandoffPanel } from './DealHandoffPanel';
import { DealInfoSection } from './DealInfoSection';
import { DealMarketingSection } from './DealMarketingSection';
import { DealNotesSection } from './DealNotesSection';
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
}

export function DealGeneralTab({
  deal,
  draft,
  patchDraft,
  formDisabled = false,
  onRefresh,
  onOpenTaskTab,
  onOpenDeal,
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

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-6">
        <DealInfoSection
          draft={draft}
          patchDraft={patchDraft}
          filteredProductTypeOptions={getFilteredProductTypeOptions(draft, productTypeOptions)}
          searchProjects={searchProjects}
          searchProducts={searchProducts}
          searchCompanies={searchCompanies}
          disabled={formDisabled}
        />
        <DealOfferContractSection
          dealId={deal.id}
          draft={draft}
          patchDraft={patchDraft}
          disabled={formDisabled}
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
        />
        <DealContactTeamSection
          deal={deal}
          draft={draft}
          patchDraft={patchDraft}
          searchContacts={searchContacts}
          searchEmployees={searchEmployees}
          disabled={formDisabled}
        />
        <DealNotesSection draft={draft} patchDraft={patchDraft} disabled={formDisabled} />
        <DealSourceLeadSection deal={deal} />
      </div>

      <div className="flex w-72 shrink-0 flex-col gap-4">
        <DealHandoffPanel deal={deal} onOpenDeal={onOpenDeal} />
        <DealFinanceActionsPanel
          deal={deal}
          projectId={projectId}
          firstOrder={firstOrder}
          taxStatus={taxStatus}
          canCreateInvoice={canCreateInvoice(deal, taxStatus)}
          onRefresh={onRefresh}
          onOpenTaskTab={onOpenTaskTab}
        />
      </div>
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

function canCreateInvoice(deal: Deal, taxStatus: string) {
  return Boolean(
    deal.amount != null &&
    Number(deal.amount) > 0 &&
    deal.paymentType &&
    deal.projectId &&
    deal.type &&
    taxStatus &&
    (taxStatus !== 'TAX' || deal.companyId),
  );
}
