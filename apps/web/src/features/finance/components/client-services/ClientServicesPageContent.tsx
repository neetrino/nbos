'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DeleteConfirmDialog,
  IntegratedSearchFilters,
  LoadingState,
  SEARCH_DEBOUNCE_MS,
  ViewModeSwitch,
  useDebouncedValue,
  useDeleteConfirm,
  useModuleHeroSlots,
} from '@/components/shared';
import { useClientServicesViewMode } from '@/features/finance/constants/client-services-view';
import { buildClientServicesViewOptions } from './client-services-view-options';
import {
  translateClientServiceBilling,
  translateClientServiceStatus,
  translateClientServiceType,
  useClientServicesT,
} from './client-service-message-keys';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { OPEN_CLIENT_SERVICE_QUERY } from '@/features/finance/constants/client-service-deep-link';
import {
  buildClientServiceIntegratedFilterConfigs,
  CLIENT_SERVICE_FILTER_BILLING_KEY,
  CLIENT_SERVICE_FILTER_STATUS_KEY,
  CLIENT_SERVICE_FILTER_TYPE_KEY,
} from './build-client-service-integrated-filter-configs';
import { subscribeClientServiceRegistryRefresh } from './client-service-registry-events';
import { ClientServiceCreateDialog } from './ClientServiceCreateDialog';
import { ClientServiceDetailSheet } from './ClientServiceDetailSheet';
import { ClientServicesPageSettingsSheet } from './ClientServicesPageSettingsSheet';
import { ClientServiceListView } from './ClientServiceListView';
import { ClientServiceStatusBoardView } from './ClientServiceStatusBoardView';
import { ClientServiceMonthsBoardView } from './ClientServiceMonthsBoardView';
import {
  clientServicesApi,
  type ClientServiceRecord,
  type ClientServiceRecordListParams,
} from '@/lib/api/client-services';
import { getApiErrorMessage } from '@/lib/api-errors';
import { useMobilePreferredView } from '@/hooks/use-mobile-preferred-view';
import { SEARCH_FILTER_PAGE_ID, usePersistedSearchFilters } from '@/lib/persisted-client-state';

const CLIENT_SERVICE_FILTER_DEFAULTS: Record<string, string> = {
  [CLIENT_SERVICE_FILTER_TYPE_KEY]: 'all',
  [CLIENT_SERVICE_FILTER_STATUS_KEY]: 'all',
  [CLIENT_SERVICE_FILTER_BILLING_KEY]: 'all',
};

export function ClientServicesPageContent() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ClientServicesPageInner />
    </Suspense>
  );
}

function ClientServicesPageInner() {
  const t = useClientServicesT();
  useFinanceDocumentTitle(t('page.title'));
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const openServiceIdFromUrl = searchParams.get(OPEN_CLIENT_SERVICE_QUERY)?.trim() || null;

  const [view, handleViewChange] = useClientServicesViewMode();
  const displayView = useMobilePreferredView(view, 'months');
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [reloadToken, setReloadToken] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const deleteConfirm = useDeleteConfirm();
  const [selectedService, setSelectedService] = useState<ClientServiceRecord | null>(null);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS).trim();
  const [clientFilters, setClientFilters] = usePersistedSearchFilters(
    SEARCH_FILTER_PAGE_ID.financeClientServices,
    CLIENT_SERVICE_FILTER_DEFAULTS,
  );
  const typeFilter = clientFilters[CLIENT_SERVICE_FILTER_TYPE_KEY] ?? 'all';
  const statusFilter = clientFilters[CLIENT_SERVICE_FILTER_STATUS_KEY] ?? 'all';
  const billingFilter = clientFilters[CLIENT_SERVICE_FILTER_BILLING_KEY] ?? 'all';
  const refreshAll = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => subscribeClientServiceRegistryRefresh(refreshAll), [refreshAll]);

  const baseParams = useMemo<ClientServiceRecordListParams>(
    () => ({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      ...(billingFilter !== 'all' ? { billingModel: billingFilter } : {}),
    }),
    [billingFilter, debouncedSearch, statusFilter, typeFilter],
  );

  const clientServiceFilterConfigs = useMemo(
    () =>
      buildClientServiceIntegratedFilterConfigs({
        type: t('filters.type'),
        status: t('filters.status'),
        billing: t('filters.billing'),
        typeLabel: (value, fallback) => translateClientServiceType(t, value, fallback),
        statusLabel: (value, fallback) => translateClientServiceStatus(t, value, fallback),
        billingLabel: (value, fallback) => translateClientServiceBilling(t, value, fallback),
      }),
    [t],
  );

  const clientServiceFilterValues = useMemo(
    () => ({
      [CLIENT_SERVICE_FILTER_TYPE_KEY]: typeFilter,
      [CLIENT_SERVICE_FILTER_STATUS_KEY]: statusFilter,
      [CLIENT_SERVICE_FILTER_BILLING_KEY]: billingFilter,
    }),
    [billingFilter, statusFilter, typeFilter],
  );

  const handleClientServiceFilterChange = useCallback(
    (key: string, value: string) => {
      setClientFilters((prev) => ({ ...prev, [key]: value }));
    },
    [setClientFilters],
  );

  const handleClearClientServiceFilters = useCallback(() => {
    setSearch('');
    setClientFilters(CLIENT_SERVICE_FILTER_DEFAULTS);
  }, [setClientFilters]);

  const openCreate = useCallback(() => setCreateOpen(true), []);

  const openServiceDetail = useCallback(
    (service: ClientServiceRecord) => {
      setSelectedService(service);
      const params = new URLSearchParams(searchParams.toString());
      params.set(OPEN_CLIENT_SERVICE_QUERY, service.id);
      router.push(`${pathname ?? '/finance/client-services'}?${params.toString()}`, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const handleCreated = useCallback(
    (service: ClientServiceRecord) => {
      refreshAll();
      openServiceDetail(service);
    },
    [openServiceDetail, refreshAll],
  );

  const handleServiceSheetOpenChange = useCallback(
    (next: boolean) => {
      if (next) return;
      setSelectedService(null);
      const params = new URLSearchParams(searchParams.toString());
      if (!params.has(OPEN_CLIENT_SERVICE_QUERY)) return;
      params.delete(OPEN_CLIENT_SERVICE_QUERY);
      const qs = params.toString();
      router.replace(
        qs
          ? `${pathname ?? '/finance/client-services'}?${qs}`
          : (pathname ?? '/finance/client-services'),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const handleCancelService = useCallback(
    async (id: string) => {
      try {
        await clientServicesApi.cancel(id);
        toast.success(t('toasts.cancelled'));
        if (openServiceIdFromUrl === id) {
          handleServiceSheetOpenChange(false);
        }
        refreshAll();
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, t('errors.cancel')));
      }
    },
    [handleServiceSheetOpenChange, openServiceIdFromUrl, refreshAll, t],
  );

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={t('page.searchPlaceholder')}
          filters={clientServiceFilterConfigs}
          filterValues={clientServiceFilterValues}
          onFilterChange={handleClientServiceFilterChange}
          onClearAll={handleClearClientServiceFilters}
        />
      ),
      viewMode: (
        <ViewModeSwitch
          value={view}
          onChange={handleViewChange}
          options={buildClientServicesViewOptions(t)}
          ariaLabel={t('page.viewAria')}
        />
      ),
      trailing: (
        <>
          <ClientServicesPageSettingsSheet refreshDisabled={false} onRefresh={refreshAll} />
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            {t('page.newService')}
          </Button>
        </>
      ),
    }),
    [
      clientServiceFilterConfigs,
      clientServiceFilterValues,
      handleClearClientServiceFilters,
      handleClientServiceFilterChange,
      handleViewChange,
      openCreate,
      refreshAll,
      search,
      t,
      view,
    ],
  );

  useModuleHeroSlots(moduleHeroSlots);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex min-h-0 flex-1 flex-col">
        {displayView === 'status' ? (
          <ClientServiceStatusBoardView
            baseParams={baseParams}
            reloadToken={reloadToken}
            onOpen={openServiceDetail}
          />
        ) : displayView === 'months' ? (
          <ClientServiceMonthsBoardView
            baseParams={baseParams}
            year={year}
            onYearChange={setYear}
            reloadToken={reloadToken}
            onOpen={openServiceDetail}
          />
        ) : (
          <ClientServiceListView
            baseParams={baseParams}
            reloadToken={reloadToken}
            onOpen={openServiceDetail}
            onCreate={openCreate}
          />
        )}
      </div>

      <ClientServiceCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={handleCreated}
      />

      <ClientServiceDetailSheet
        serviceId={openServiceIdFromUrl}
        initialService={selectedService}
        open={Boolean(openServiceIdFromUrl)}
        onOpenChange={handleServiceSheetOpenChange}
        onSaved={refreshAll}
        onRequestCancel={(target) => deleteConfirm.request(target)}
      />

      <DeleteConfirmDialog
        level="simple"
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        itemName={deleteConfirm.target?.name ?? ''}
        title={t('cancel.title')}
        description={t('cancel.description')}
        dismissLabel={t('cancel.dismiss')}
        confirmLabel={t('cancel.confirm')}
        submittingLabel={t('cancel.submitting')}
        onConfirm={() => {
          const id = deleteConfirm.target?.id;
          if (!id) return;
          deleteConfirm.clear();
          void handleCancelService(id);
        }}
      />
    </div>
  );
}
