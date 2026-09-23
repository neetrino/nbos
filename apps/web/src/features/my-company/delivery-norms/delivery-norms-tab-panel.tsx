'use client';

import { CoreUnitsSection } from './core-units-section';
import { DeliveryNormsFunctionsSection } from './delivery-norms-functions-section';
import type { DeliveryNormsSection } from './delivery-norms-workspace';
import { RoleRatesSection } from './role-rates-section';
import type { DeliveryNormsPageData } from './use-delivery-norms-page-data';

type DeliveryNormsTabPanelProps = {
  section: DeliveryNormsSection;
  data: DeliveryNormsPageData;
  canSeeCatalog: boolean;
  canSeeRules: boolean;
  canAdd: boolean;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
};

export function DeliveryNormsTabPanel({
  section,
  data,
  canSeeCatalog,
  canSeeRules,
  canAdd,
  canPublish,
  onChanged,
  onError,
}: DeliveryNormsTabPanelProps) {
  if (section === 'functions') {
    return (
      <DeliveryNormsFunctionsSection
        canSeeCatalog={canSeeCatalog}
        canSeeRules={canSeeRules}
        canAdd={canAdd}
        canPublish={canPublish}
        prices={data.prices}
        salePrices={data.salePrices}
        onRulesChanged={onChanged}
        onError={onError}
      />
    );
  }
  if (section === 'rates') {
    return (
      <RoleRatesSection
        rows={data.rates}
        canAdd={canAdd}
        canPublish={canPublish}
        onChanged={onChanged}
        onError={onError}
        embedded
      />
    );
  }
  return (
    <CoreUnitsSection
      rows={data.profiles}
      catalog={data.catalog}
      salePrices={data.salePrices}
      canAdd={canAdd}
      canPublish={canPublish}
      onChanged={onChanged}
      onError={onError}
    />
  );
}
