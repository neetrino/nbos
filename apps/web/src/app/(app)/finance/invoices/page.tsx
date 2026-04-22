'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  RefreshCcw,
  FileText,
  DollarSign,
  Calendar,
  Building2,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  PageHeader,
  FilterBar,
  EmptyState,
  StatusBadge,
  KanbanBoard,
  type KanbanColumn,
} from '@/components/shared';
import { InvoiceSheet } from '@/features/finance/components/InvoiceSheet';
import {
  FINANCE_PERIOD_OPTIONS,
  INVOICE_TYPES,
  INVOICE_STAGES,
  getFinancePeriodParams,
  type FinancePeriod,
  getInvoiceStage,
  formatAmount,
} from '@/features/finance/constants/finance';
import { invoicesApi, type Invoice, type InvoiceStats } from '@/lib/api/finance';

type ViewMode = 'kanban' | 'list';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, setView] = useState<ViewMode>('kanban');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [period, setPeriod] = useState<FinancePeriod>('month');

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const periodParams = getFinancePeriodParams(period);
      const [data, invoiceStats] = await Promise.all([
        invoicesApi.getAll({
          pageSize: 200,
          search: search || undefined,
          status: filters.status && filters.status !== 'all' ? filters.status : undefined,
          type: filters.type && filters.type !== 'all' ? filters.type : undefined,
          ...periodParams,
        }),
        invoicesApi.getStats(periodParams),
      ]);
      setInvoices(data.items);
      setStats(invoiceStats);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }, [search, filters, period]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setSheetOpen(true);
  };

  const handleStatusChange = async (id: string, status: string) => {
    const previousInvoices = invoices;

    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status } : inv)));

    try {
      await invoicesApi.updateStatus(id, status);
    } catch {
      setInvoices(previousInvoices);
    }
  };

  const handleMove = (itemId: string, _from: string, toColumn: string) => {
    handleStatusChange(itemId, toColumn);
  };

  const totalAmount =
    stats?.byStatus.reduce((sum, item) => sum + Number(item._sum.amount ?? 0), 0) ?? 0;
  const paidAmount = Number(stats?.totalRevenue ?? 0);
  const overdueAmount = Number(stats?.overdue.amount ?? 0);

  const filterConfigs = [
    {
      key: 'status',
      label: 'Status',
      options: INVOICE_STAGES.map((s) => ({ value: s.value, label: s.label })),
    },
    {
      key: 'type',
      label: 'Type',
      options: INVOICE_TYPES.map((t) => ({ value: t.value, label: t.label })),
    },
  ];

  const STAGE_COLORS: Record<string, string> = {
    THIS_MONTH: 'bg-blue-500',
    CREATE_INVOICE: 'bg-indigo-500',
    WAITING: 'bg-purple-500',
    DELAYED: 'bg-orange-500',
    ON_HOLD: 'bg-gray-400',
    FAIL: 'bg-red-500',
    PAID: 'bg-green-500',
  };

  const kanbanColumns = INVOICE_STAGES.map((stage) => ({
    key: stage.value,
    label: stage.label,
    color: STAGE_COLORS[stage.value] ?? 'bg-gray-400',
    items: invoices.filter((inv) => inv.status === stage.value),
  }));

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader title="Invoices" description={`${invoices.length} total`}>
        <div className="border-border flex rounded-lg border p-1">
          {FINANCE_PERIOD_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={period === option.value ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setPeriod(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="icon" onClick={fetchInvoices}>
          <RefreshCcw size={16} />
        </Button>
        <div className="border-border flex rounded-lg border">
          <Button
            variant={view === 'kanban' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setView('kanban')}
            className="rounded-r-none"
          >
            <LayoutGrid size={14} />
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setView('list')}
            className="rounded-l-none"
          >
            <List size={14} />
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4">
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Total Invoiced</p>
          <p className="mt-1 text-xl font-bold">{formatAmount(totalAmount)}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Collected</p>
          <p className="mt-1 text-xl font-bold text-green-600">{formatAmount(paidAmount)}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Overdue</p>
          <p className="mt-1 text-xl font-bold text-red-500">{formatAmount(overdueAmount)}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by invoice number, company..."
            filters={filterConfigs}
            filterValues={filters}
            onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
            onClearFilters={() => setFilters({})}
          />
        </div>
        <Button className="shrink-0">
          <Plus size={16} />
          New Invoice
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Create your first invoice to start tracking payments"
          action={
            <Button>
              <Plus size={16} />
              Create First Invoice
            </Button>
          }
        />
      ) : view === 'kanban' ? (
        <div className="min-h-0 flex-1">
          <KanbanBoard
            columns={kanbanColumns}
            getItemId={(inv: Invoice) => inv.id}
            onMove={handleMove}
            columnWidth={270}
            emptyMessage="No invoices"
            renderColumnHeader={(column: KanbanColumn<Invoice>) => {
              const columnTotal = column.items.reduce(
                (sum, inv) => sum + parseFloat(inv.amount),
                0,
              );
              return (
                <p className="text-foreground text-lg font-bold tabular-nums">
                  {formatAmount(columnTotal)}
                </p>
              );
            }}
            renderCard={(invoice: Invoice) => (
              <div
                className="border-border bg-card cursor-pointer space-y-2 rounded-xl border p-3 transition-shadow hover:shadow-sm"
                onClick={() => handleClick(invoice)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-medium">{invoice.code}</span>
                  {invoice.taxStatus === 'TAX' && <StatusBadge label="Tax" variant="green" />}
                </div>
                <p className="text-sm font-bold">{formatAmount(parseFloat(invoice.amount))}</p>
                {invoice.company && (
                  <div className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Building2 size={10} />
                    {invoice.company.name}
                  </div>
                )}
                {invoice.dueDate && (
                  <div className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Calendar size={10} />
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          />
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tax</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Paid Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const stage = getInvoiceStage(invoice.status);
                const isOverdue =
                  invoice.dueDate &&
                  new Date(invoice.dueDate) < new Date() &&
                  invoice.status !== 'PAID';
                return (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer"
                    onClick={() => handleClick(invoice)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{invoice.code}</p>
                        {invoice.order && (
                          <p className="text-muted-foreground text-xs">
                            Order: {invoice.order.code}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {invoice.company?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs">{invoice.type}</TableCell>
                    <TableCell className="text-right">
                      <span className="flex items-center justify-end gap-1 font-semibold">
                        <DollarSign size={12} className="text-accent" />
                        {formatAmount(parseFloat(invoice.amount))}
                      </span>
                    </TableCell>
                    <TableCell>
                      {stage && <StatusBadge label={stage.label} variant={stage.variant} />}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        label={invoice.taxStatus === 'TAX' ? 'Tax' : 'Free'}
                        variant={invoice.taxStatus === 'TAX' ? 'green' : 'gray'}
                      />
                    </TableCell>
                    <TableCell
                      className={`text-xs ${isOverdue ? 'font-medium text-red-500' : 'text-muted-foreground'}`}
                    >
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-green-600">
                      {invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <InvoiceSheet invoice={selectedInvoice} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
