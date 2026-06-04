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
  ViewModeSwitch,
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
  type ClientServiceRecordListParams,
  type ClientServiceStats,
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
  const [stats, setStats] = useState<ClientServiceStats | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const deleteConfirm = useDeleteConfirm();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [billingFilter, setBillingFilter] = useState('all');
  const refreshAll = useCallback(() => setReloadToken((token) => token + 1), []);

  const baseParams = useMemo<ClientServiceRecordListParams>(
    () => ({
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      ...(billingFilter !== 'all' ? { billingModel: billingFilter } : {}),
    }),
    [billingFilter, search, statusFilter, typeFilter],
  );

  const statsParams = useMemo(
    () => ({
      type: baseParams.type,
      status: baseParams.status,
      billingModel: baseParams.billingModel,
      year,
    }),
    [baseParams.billingModel, baseParams.status, baseParams.type, year],
  );

  useEffect(() => {
    let active = true;
    clientServicesApi
      .getStats(statsParams)
      .then((next) => {
        if (active) setStats(next);
      })
      .catch(() => {
        if (active) setStats(null);
      });
    return () => {
      active = false;
    };
  }, [statsParams, reloadToken]);

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
    (serviceId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(OPEN_CLIENT_SERVICE_QUERY, serviceId);
      router.push(`${pathname ?? '/finance/client-services'}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleServiceSheetOpenChange = useCallback(
    (next: boolean) => {
      if (next) return;
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

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await clientServicesApi.delete(id);
        if (openServiceIdFromUrl === id) {
          handleServiceSheetOpenChange(false);
        }
        refreshAll();
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, 'Client service could not be deleted.'));
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
            stats={stats}
            reloadToken={reloadToken}
            onOpen={openServiceDetail}
          />
        ) : view === 'months' ? (
          <ClientServiceMonthsBoardView
            baseParams={baseParams}
            stats={stats}
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
        open={Boolean(openServiceIdFromUrl)}
        onOpenChange={handleServiceSheetOpenChange}
        onSaved={refreshAll}
        onRequestDelete={(target) => deleteConfirm.request(target)}
      />

      <DeleteConfirmDialog
        level="simple"
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        itemName={deleteConfirm.target?.name ?? ''}
        title="Delete client service?"
        description="Linked finance records and history stay in the system."
        onConfirm={() => {
          const id = deleteConfirm.target?.id;
          if (!id) return;
          deleteConfirm.clear();
          void handleDelete(id);
        }}
      />
    </div>
  );
}
