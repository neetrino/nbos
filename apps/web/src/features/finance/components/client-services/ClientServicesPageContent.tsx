'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, ServerCog, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  CLIENT_SERVICE_BILLING_MODELS,
  CLIENT_SERVICE_STATUSES,
  CLIENT_SERVICE_TYPES,
  clientServiceOptionLabel,
} from '@/features/finance/constants/client-services';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { clientServicesPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { ClientServiceDialog } from './ClientServiceDialog';
import {
  clientServicesApi,
  type ClientServiceRecord,
  type ClientServiceStats,
} from '@/lib/api/client-services';
import { getApiErrorMessage } from '@/lib/api-errors';

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
  useFinanceDocumentTitle(clientServicesPageTitle());

  const [items, setItems] = useState<ClientServiceRecord[]>([]);
  const [stats, setStats] = useState<ClientServiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<ClientServiceRecord | null>(null);

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

  const summary = useMemo(
    () => [
      { label: 'Total services', value: stats?.total ?? items.length },
      { label: 'Due soon', value: stats?.dueSoon ?? 0 },
      {
        label: 'Client-paid',
        value:
          stats?.byBillingModel.find((row) => row.billingModel === 'CLIENT_PAID')?._count._all ?? 0,
      },
      {
        label: 'Company-paid',
        value:
          stats?.byBillingModel.find((row) => row.billingModel === 'COMPANY_PAID')?._count._all ??
          0,
      },
    ],
    [items.length, stats],
  );

  const openCreate = () => {
    setServiceToEdit(null);
    setDialogOpen(true);
  };

  const handleDelete = async (service: ClientServiceRecord) => {
    if (!window.confirm(`Delete client service "${service.name}"? Linked finance records stay.`)) {
      return;
    }
    try {
      await clientServicesApi.delete(service.id);
      await fetchData();
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Client service could not be deleted.'));
    }
  };

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader
        title="Client services"
        description="Runtime records for domains, hosting, SaaS, accounts and licenses around client projects."
      >
        {
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void fetchData()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New service
            </Button>
          </div>
        }
      </PageHeader>

      <section className="grid gap-3 md:grid-cols-4">
        {summary.map((card) => (
          <div key={card.label} className="border-border bg-card rounded-xl border p-4">
            <p className="text-muted-foreground text-sm">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </section>

      {loading ? <LoadingState /> : null}
      {!loading && error ? (
        <ErrorState title="Client services unavailable" description={error} />
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState
          icon={ServerCog}
          title="No client services yet"
          description="Create the first domain, hosting, SaaS, account or license record for a project."
          action={<Button onClick={openCreate}>Create service</Button>}
        />
      ) : null}
      {!loading && !error && items.length > 0 ? (
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
                <TableHead className="w-[130px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <button
                      className="text-left font-medium hover:underline"
                      onClick={() => {
                        setServiceToEdit(service);
                        setDialogOpen(true);
                      }}
                    >
                      {service.name}
                    </button>
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
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => void handleDelete(service)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <ClientServiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        serviceToEdit={serviceToEdit}
        onSaved={() => void fetchData()}
      />
    </div>
  );
}
