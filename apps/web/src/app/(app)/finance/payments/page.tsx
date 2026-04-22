'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCcw, CreditCard, DollarSign, FileText, FolderKanban, Calendar } from 'lucide-react';
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
import { PageHeader, FilterBar, EmptyState, StatusBadge } from '@/components/shared';
import {
  FINANCE_PERIOD_OPTIONS,
  getFinancePeriodParams,
  type FinancePeriod,
  formatAmount,
} from '@/features/finance/constants/finance';
import { paymentsApi, type Payment, type PaymentStats } from '@/lib/api/finance';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<FinancePeriod>('month');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const periodParams = getFinancePeriodParams(period);
      const [data, paymentStats] = await Promise.all([
        paymentsApi.getAll({
          pageSize: 100,
          search: search || undefined,
          ...periodParams,
        }),
        paymentsApi.getStats(periodParams),
      ]);
      setPayments(data.items);
      setStats(paymentStats);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }, [search, period]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const totalCollected = Number(stats?.totalCollected ?? 0);
  const thisMonthTotal = Number(stats?.thisMonthCollected ?? 0);
  const totalPayments = stats?.totalPayments ?? payments.length;

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader title="Payments" description={`${payments.length} payments`}>
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
        <Button variant="outline" size="icon" onClick={fetchPayments}>
          <RefreshCcw size={16} />
        </Button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4">
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Total Collected</p>
          <p className="mt-1 text-xl font-bold text-green-600">{formatAmount(totalCollected)}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">This Month</p>
          <p className="mt-1 text-xl font-bold">{formatAmount(thisMonthTotal)}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Total Payments</p>
          <p className="mt-1 text-xl font-bold">{totalPayments}</p>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by invoice, project..."
        filters={[]}
        filterValues={{}}
        onFilterChange={() => {}}
        onClearFilters={() => {}}
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments yet"
          description="Payments appear when invoices are marked as paid"
        />
      ) : (
        <div className="border-border overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment Date</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Confirmed By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <Calendar size={13} className="text-muted-foreground" />
                      {new Date(payment.paymentDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {payment.invoice ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <FileText size={12} className="text-muted-foreground" />
                        <span>{payment.invoice.code}</span>
                        {payment.invoice.type ? (
                          <StatusBadge label={payment.invoice.type} variant="blue" />
                        ) : null}
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    {payment.project ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <FolderKanban size={12} className="text-muted-foreground" />
                        {payment.project.name}
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {payment.company?.name ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="flex items-center justify-end gap-1 font-semibold text-green-600">
                      <DollarSign size={12} />
                      {formatAmount(parseFloat(payment.amount))}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {payment.paymentMethod ?? '—'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {payment.confirmer
                      ? `${payment.confirmer.firstName} ${payment.confirmer.lastName}`
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
