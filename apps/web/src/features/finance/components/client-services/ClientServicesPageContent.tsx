'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
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
import { CLIENT_SERVICES_VIEW_OPTIONS } from './client-services-view-options';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { clientServicesPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { OPEN_CLIENT_SERVICE_QUERY } from '@/features/finance/constants/client-service-deep-link';
import {
  buildClientServiceIntegratedFilterConfigs,
  CLIENT_SERVICE_FILTER_BILLING_KEY,
  CLIENT_SERVICE_FILTER_STATUS_KEY,
  CLIENT_SERVICE_FILTER_TYPE_KEY,
} from './build-client-service-integrated-filter-configs';
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

export function ClientServicesPageContent() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ClientServicesPageInner />
    </Suspense>
  );
}

function ClientServicesPageInner() {
  useFinanceDocumentTitle(clientServicesPageTitle());
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const openServiceIdFromUrl = searchParams.get(OPEN_CLIENT_SERVICE_QUERY)?.trim() || null;

  const [view, handleViewChange] = useClientServicesViewMode();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [reloadToken, setReloadToken] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const deleteConfirm = useDeleteConfirm();
  const [selectedService, setSelectedService] = useState<ClientServiceRecord | null>(null);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS).trim();
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [billingFilter, setBillingFilter] = useState('all');
  const refreshAll = useCallback(() => setReloadToken((token) => token + 1), []);

  const baseParams = useMemo<ClientServiceRecordListParams>(
    () => ({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      ...(billingFilter !== 'all' ? { billingModel: billingFilter } : {}),
    }),
    [billingFilter, debouncedSearch, statusFilter, typeFilter],
  );

  const clientServiceFilterConfigs = useMemo(() => buildClientServiceIntegratedFilterConfigs(), []);

  const clientServiceFilterValues = useMemo(
    () => ({
      [CLIENT_SERVICE_FILTER_TYPE_KEY]: typeFilter,
      [CLIENT_SERVICE_FILTER_STATUS_KEY]: statusFilter,
      [CLIENT_SERVICE_FILTER_BILLING_KEY]: billingFilter,
    }),
    [billingFilter, statusFilter, typeFilter],
  );

  const handleClientServiceFilterChange = useCallback((key: string, value: string) => {
    if (key === CLIENT_SERVICE_FILTER_TYPE_KEY) setTypeFilter(value);
    else if (key === CLIENT_SERVICE_FILTER_STATUS_KEY) setStatusFilter(value);
    else if (key === CLIENT_SERVICE_FILTER_BILLING_KEY) setBillingFilter(value);
  }, []);

  const handleClearClientServiceFilters = useCallback(() => {
    setSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
    setBillingFilter('all');
  }, []);

  const openCreate = useCallback(() => setCreateOpen(true), []);

  const openServiceDetail = useCallback(
    (service: ClientServiceRecord) => {
      setSelectedService(service);
      const params = new URLSearchParams(searchParams.toString());
      params.set(OPEN_CLIENT_SERVICE_QUERY, service.id);
      router.push(`${pathname ?? '/finance/client-services'}?${params.toString()}`);
    },
    [pathname, router, searchParams],
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
      );
    },
    [pathname, router, searchParams],
  );

  const handleCancelService = useCallback(
    async (id: string) => {
      try {
        await clientServicesApi.cancel(id);
        toast.success('Client service cancelled');
        if (openServiceIdFromUrl === id) {
          handleServiceSheetOpenChange(false);
        }
        refreshAll();
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, 'Client service could not be cancelled.'));
      }
    },
    [handleServiceSheetOpenChange, openServiceIdFromUrl, refreshAll],
  );

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name or provider…"
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
          options={CLIENT_SERVICES_VIEW_OPTIONS}
          ariaLabel="Client services view mode"
        />
      ),
      trailing: (
        <>
          <ClientServicesPageSettingsSheet refreshDisabled={false} onRefresh={refreshAll} />
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            New service
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
      view,
    ],
  );

  useModuleHeroSlots(moduleHeroSlots);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex min-h-0 flex-1 flex-col">
        {view === 'status' ? (
          <ClientServiceStatusBoardView
            baseParams={baseParams}
            reloadToken={reloadToken}
            onOpen={openServiceDetail}
          />
        ) : view === 'months' ? (
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
        onSaved={refreshAll}
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
        title="Cancel client service?"
        description="The service will be marked cancelled and hidden from active lists. Linked finance records and history stay intact."
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
