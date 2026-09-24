'use client';

import { useCallback, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DELIVERY_COMPENSATION_RULES_MODULE, FUNCTION_CATALOG_MODULE } from '@nbos/shared';
import { DataView, ErrorState, ListMutationErrorBanner, LoadingState } from '@/components/shared';
import type { DeliveryEnrollmentSetting } from '@/lib/api/delivery-norms';
import { usePermission } from '@/lib/permissions';
import { LOADING_CARD_COUNT } from './delivery-norms.constants';
import { DeliveryNormsTabPanel } from './delivery-norms-tab-panel';
import { useDeliveryNormsStoredLocation } from './delivery-norms-tab-storage';
import { resolveDeliveryNormsSection, type DeliveryNormsSection } from './delivery-norms-workspace';
import { EnrollmentSwitchSection } from './enrollment-switch-section';
import { useDeliveryNormsSectionTabs } from './use-delivery-norms-hero-slots';
import {
  useDeliveryNormsPageData,
  type DeliveryNormsPageData,
} from './use-delivery-norms-page-data';

const SECTION_QUERY = 'section';

export function DeliveryNormsPage() {
  const { can } = usePermission();
  const canSeeCatalog = can('VIEW', FUNCTION_CATALOG_MODULE);
  const canSeeRules = can('VIEW', DELIVERY_COMPENSATION_RULES_MODULE);
  const canAdd = can('ADD', DELIVERY_COMPENSATION_RULES_MODULE);
  const canPublish = can('EDIT', DELIVERY_COMPENSATION_RULES_MODULE);
  const { data, loading, error, setError, load } = useDeliveryNormsPageData(canSeeRules);
  const { section, setSection } = useDeliveryNormsSection(canSeeRules);
  const sectionTabs = useDeliveryNormsSectionTabs({
    section,
    canSeeRules,
    onSectionChange: setSection,
  });
  const panel = (
    <DeliveryNormsTabPanel
      section={section}
      data={data}
      canSeeCatalog={canSeeCatalog}
      canSeeRules={canSeeRules}
      canAdd={canAdd}
      canPublish={canPublish}
      onChanged={() => void load()}
      onError={setError}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      {error && hasDeliveryNormsData(data) ? (
        <ListMutationErrorBanner message={error} onDismiss={() => setError(null)} />
      ) : null}
      <DeliveryNormsControls
        tabs={sectionTabs}
        canSeeRules={canSeeRules}
        setting={data.enrollment}
        canToggle={canPublish}
        onChanged={() => void load()}
        onError={setError}
      />
      <DataView
        loading={loading && section !== 'functions'}
        error={error}
        hasData={canSeeCatalog || hasDeliveryNormsData(data)}
        loadingFallback={<LoadingState variant="cards" count={LOADING_CARD_COUNT} />}
        errorFallback={<ErrorState description={error ?? ''} onRetry={() => void load()} />}
        emptyFallback={panel}
      >
        {panel}
      </DataView>
    </div>
  );
}

function DeliveryNormsControls({
  tabs,
  canSeeRules,
  setting,
  canToggle,
  onChanged,
  onError,
}: {
  tabs: ReactNode;
  canSeeRules: boolean;
  setting: DeliveryEnrollmentSetting | null;
  canToggle: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {tabs}
      {canSeeRules ? (
        <>
          <span className="bg-border h-5 w-px shrink-0" aria-hidden />
          <EnrollmentSwitchSection
            setting={setting}
            canToggle={canToggle}
            onChanged={onChanged}
            onError={onError}
          />
        </>
      ) : null}
    </div>
  );
}

function useDeliveryNormsSection(canSeeRules: boolean): {
  section: DeliveryNormsSection;
  setSection: (section: DeliveryNormsSection) => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [stored, setStored] = useDeliveryNormsStoredLocation();
  const section = resolveDeliveryNormsSection({
    query: searchParams.get(SECTION_QUERY),
    stored,
    canSeeRules,
  });

  const setSection = useCallback(
    (next: DeliveryNormsSection) => {
      setStored({ section: next });
      const params = new URLSearchParams(searchParams.toString());
      params.set(SECTION_QUERY, next);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, setStored],
  );

  return { section, setSection };
}

function hasDeliveryNormsData(data: DeliveryNormsPageData): boolean {
  return (
    data.enrollment !== null ||
    data.rates.length > 0 ||
    data.profiles.length > 0 ||
    data.prices.length > 0 ||
    data.salePrices.length > 0 ||
    data.catalog.length > 0
  );
}
