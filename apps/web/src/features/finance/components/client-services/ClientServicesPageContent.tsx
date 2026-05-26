'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CheckSquare, FileText, ListChecks, Plus, Receipt, ServerCog, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  EmptyState,
  ErrorState,
  IntegratedSearchFilters,
  LoadingState,
  DeleteConfirmDialog,
  useDeleteConfirm,
  useModuleHeroSlots,
} from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  CLIENT_SERVICE_BILLING_MODELS,
  CLIENT_SERVICE_STATUSES,
  CLIENT_SERVICE_TYPES,
  clientServiceOptionLabel,
} from '@/features/finance/constants/client-services';
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
import {
  clientServicesApi,
  type ClientServiceRecord,
  type ClientServiceStats,
} from '@/lib/api/client-services';
import { getApiErrorMessage } from '@/lib/api-errors';
import { usePermission } from '@/lib/permissions';

function formatShortDate(value: string | null): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: '2-digit' }).format(
    new Date(value),
  );
}

function money(value: string | null): string {
  return value ? formatAmount(Number(value)) : '-';
}

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

  const [items, setItems] = useState<ClientServiceRecord[]>([]);
  const [, setStats] = useState<ClientServiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const deleteConfirm = useDeleteConfirm();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [billingFilter, setBillingFilter] = useState('all');
  const { me } = usePermission();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [list, nextStats] = await Promise.all([
        clientServicesApi.getAll({ page: 1, pageSize: 100 }),
        clientServicesApi.getStats(),
      ]);
      setItems(list.items);
      setStats(nextStats);
      setError(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Client services could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

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
    if (key === CLIENT_SERVICE_FILTER_TYPE_KEY) {
      setTypeFilter(value);
      return;
    }
    if (key === CLIENT_SERVICE_FILTER_STATUS_KEY) {
      setStatusFilter(value);
      return;
    }
    if (key === CLIENT_SERVICE_FILTER_BILLING_KEY) {
      setBillingFilter(value);
    }
  }, []);

  const handleClearClientServiceFilters = useCallback(() => {
    setSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
    setBillingFilter('all');
  }, []);

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((service) => {
      const matchesSearch =
        !q ||
        service.name.toLowerCase().includes(q) ||
        (service.provider?.toLowerCase().includes(q) ?? false) ||
        (service.project?.name?.toLowerCase().includes(q) ?? false) ||
        (service.project?.code?.toLowerCase().includes(q) ?? false);
      const matchesType = typeFilter === 'all' || service.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
      const matchesBilling = billingFilter === 'all' || service.billingModel === billingFilter;
      return matchesSearch && matchesType && matchesStatus && matchesBilling;
    });
  }, [billingFilter, items, search, statusFilter, typeFilter]);

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

  const handleDelete = async (id: string) => {
    try {
      await clientServicesApi.delete(id);
      await fetchData();
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Client service could not be deleted.'));
    }
  };

  const runServiceAction = async (
    service: ClientServiceRecord,
    kind: 'invoice' | 'plan' | 'expense' | 'task',
  ) => {
    setActionId(`${kind}:${service.id}`);
    try {
      if (kind === 'invoice') {
        await clientServicesApi.createInvoice(service.id);
        toast.success('Linked invoice card created.');
      }
      if (kind === 'plan') {
        await clientServicesApi.createExpensePlan(service.id);
        toast.success('Linked expense plan created.');
      }
      if (kind === 'expense') {
        await clientServicesApi.createExpense(service.id);
        toast.success('Linked expense card created.');
      }
      if (kind === 'task') {
        if (!me?.id) throw new Error('Current employee is not loaded.');
        await clientServicesApi.createTask(service.id, { creatorId: me.id });
        toast.success('Linked task created.');
      }
      await fetchData();
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Client service action failed.'));
    } finally {
      setActionId(null);
    }
  };

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, provider, or project…"
          filters={clientServiceFilterConfigs}
          filterValues={clientServiceFilterValues}
          onFilterChange={handleClientServiceFilterChange}
          onClearAll={handleClearClientServiceFilters}
        />
      ),
      trailing: (
        <>
          <ClientServicesPageSettingsSheet refreshDisabled={loading} onRefresh={fetchData} />
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
      fetchData,
      handleClearClientServiceFilters,
      handleClientServiceFilterChange,
      loading,
      openCreate,
      search,
    ],
  );

  useModuleHeroSlots(moduleHeroSlots);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      {loading ? <LoadingState /> : null}
      {!loading && error ? (
        <ErrorState title="Client services unavailable" description={error} />
      ) : null}
      {!loading && !error && items.length > 0 && visibleItems.length === 0 ? (
        <EmptyState
          icon={ServerCog}
          title="No services match filters"
          description="Clear search or filters to see the full catalog."
        />
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState
          icon={ServerCog}
          title="No client services yet"
          description="Create the first domain, hosting, SaaS, account or license record for a project."
          action={<Button onClick={openCreate}>Create service</Button>}
        />
      ) : null}
      {!loading && !error && visibleItems.length > 0 ? (
        <div className="border-border bg-card overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Amounts</TableHead>
                <TableHead>Renewal</TableHead>
                <TableHead>Links</TableHead>
                <TableHead className="w-[260px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleItems.map((service) => (
                <TableRow
                  key={service.id}
                  className="hover:bg-muted/40 cursor-pointer"
                  onClick={() => openServiceDetail(service.id)}
                >
                  <TableCell>
                    <span className="font-medium">{service.name}</span>
                    <p className="text-muted-foreground text-xs">
                      {clientServiceOptionLabel(CLIENT_SERVICE_TYPES, service.type)} -{' '}
                      {clientServiceOptionLabel(CLIENT_SERVICE_STATUSES, service.status)}
                    </p>
                  </TableCell>
                  <TableCell>
                    {service.project.code}
                    <p className="text-muted-foreground text-xs">{service.project.name}</p>
                  </TableCell>
                  <TableCell>
                    {clientServiceOptionLabel(CLIENT_SERVICE_BILLING_MODELS, service.billingModel)}
                    <p className="text-muted-foreground text-xs">
                      {service.provider ?? 'No provider'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">Cost:</span> {money(service.ourCost)}
                    <br />
                    <span className="text-muted-foreground">Charge:</span>{' '}
                    {money(service.clientCharge)}
                  </TableCell>
                  <TableCell>{formatShortDate(service.renewalDate)}</TableCell>
                  <TableCell>
                    {service._count.invoices} inv - {service._count.expensePlans} plans -{' '}
                    {service._count.expenses} exp
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      {service.billingModel === 'CLIENT_PAID' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionId === `invoice:${service.id}`}
                          title="Create linked invoice"
                          onClick={() => void runServiceAction(service, 'invoice')}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actionId === `plan:${service.id}`}
                        title="Create linked expense plan"
                        onClick={() => void runServiceAction(service, 'plan')}
                      >
                        <ListChecks className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actionId === `expense:${service.id}`}
                        title="Create linked expense card"
                        onClick={() => void runServiceAction(service, 'expense')}
                      >
                        <Receipt className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actionId === `task:${service.id}` || !me?.id}
                        title="Create linked task"
                        onClick={() => void runServiceAction(service, 'task')}
                      >
                        <CheckSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          deleteConfirm.request({ id: service.id, name: service.name })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <ClientServiceCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => void fetchData()}
      />

      <ClientServiceDetailSheet
        serviceId={openServiceIdFromUrl}
        open={Boolean(openServiceIdFromUrl)}
        onOpenChange={handleServiceSheetOpenChange}
        onSaved={() => void fetchData()}
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
