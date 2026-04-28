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
import { DealContactTeamSection } from './DealContactTeamSection';
import { DealFinanceActionsPanel } from './DealFinanceActionsPanel';
import { DealHandoffPanel } from './DealHandoffPanel';
import { DealInfoSection } from './DealInfoSection';
import { DealMarketingSection } from './DealMarketingSection';
import { DealNotesSection } from './DealNotesSection';
import { DealOfferContractSection } from './DealOfferContractSection';
import { DealSourceLeadSection } from './DealSourceLeadSection';

interface DealGeneralTabProps {
  deal: Deal;
  onUpdate: (id: string, data: Partial<Deal>) => Promise<void>;
  onRefresh?: () => void;
  onOpenTaskTab?: () => void;
  onOpenDeal?: (id: string) => void;
}

export function DealGeneralTab({
  deal,
  onUpdate,
  onRefresh,
  onOpenTaskTab,
  onOpenDeal,
}: DealGeneralTabProps) {
  const [isNewProject, setIsNewProject] = useState(false);
  const [linkedProjectName, setLinkedProjectName] = useState<string | null>(null);
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

  const saveField = async (field: string, value: string | number | null) => {
    const payload: Record<string, unknown> = {};
    payload[field] = field === 'amount' ? normalizeAmount(value) : value || null;
    await onUpdate(deal.id, payload as Partial<Deal>);
  };

  const saveMultipleFields = async (fields: Record<string, string | null>) => {
    await onUpdate(deal.id, fields as Partial<Deal>);
  };

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
      if (!deal.sourceDetail) return [];
      const options = await marketingApi.getAttributionOptions(deal.sourceDetail);
      return options
        .filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
        .map((option) => ({
          value: `${option.type}:${option.id}`,
          label: option.label,
          subtitle: option.subtitle ?? option.type,
        }));
    },
    [deal.sourceDetail],
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

  const firstOrder = deal.orders?.[0];
  const projectId = deal.projectId ?? firstOrder?.projectId;
  const taxStatus = deal.taxStatus ?? 'TAX';

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-6">
        <DealInfoSection
          deal={deal}
          linkedProjectName={linkedProjectName}
          isNewProject={isNewProject}
          productTypeOptions={productTypeOptions}
          filteredProductTypeOptions={getFilteredProductTypeOptions(deal, productTypeOptions)}
          setLinkedProjectName={setLinkedProjectName}
          setIsNewProject={setIsNewProject}
          searchProjects={searchProjects}
          searchProducts={searchProducts}
          searchCompanies={searchCompanies}
          saveField={saveField}
          saveMultipleFields={saveMultipleFields}
        />
        <DealOfferContractSection deal={deal} saveField={saveField} />
        <DealMarketingSection
          deal={deal}
          searchAttributionOptions={searchAttributionOptions}
          searchPartners={searchPartners}
          searchContacts={searchContacts}
          saveField={saveField}
          saveMultipleFields={saveMultipleFields}
        />
        <DealContactTeamSection deal={deal} searchContacts={searchContacts} saveField={saveField} />
        <DealNotesSection deal={deal} saveField={saveField} />
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

function normalizeAmount(value: string | number | null) {
  return typeof value === 'string' ? (value ? Number(value) : null) : value;
}

function getFilteredProductTypeOptions(
  deal: Deal,
  productTypeOptions: Array<{ value: string; label: string }>,
) {
  const category = deal.productCategory;
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
