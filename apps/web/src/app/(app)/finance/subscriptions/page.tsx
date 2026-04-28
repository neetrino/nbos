'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCcw, RefreshCw, DollarSign, FolderKanban, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  ErrorState,
  LoadingState,
  StatusBadge,
} from '@/components/shared';
import {
  FINANCE_PERIOD_OPTIONS,
  SUBSCRIPTION_TYPES,
  SUBSCRIPTION_STATUSES,
  getFinancePeriodParams,
  type FinancePeriod,
  getSubscriptionType,
  getSubscriptionStatus,
  formatAmount,
} from '@/features/finance/constants/finance';
import { subscriptionsApi, type Subscription, type SubscriptionStats } from '@/lib/api/finance';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('search') ?? '';
  });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [period, setPeriod] = useState<FinancePeriod>('month');

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const periodParams = getFinancePeriodParams(period);
      const [data, subscriptionStats] = await Promise.all([
        subscriptionsApi.getAll({
          pageSize: 100,
          search: search || undefined,
          type: filters.type && filters.type !== 'all' ? filters.type : undefined,
          status: filters.status && filters.status !== 'all' ? filters.status : undefined,
          ...periodParams,
        }),
        subscriptionsApi.getStats(periodParams),
      ]);
      setSubscriptions(data.items);
      setStats(subscriptionStats);
      setError(null);
    } catch {
      setError('Subscriptions could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [search, filters, period]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE');
  const totalMRR = Number(stats?.monthlyRevenue ?? 0);
  const activeSubscriptions = stats?.activeSubscriptions ?? activeSubs.length;
  const totalSubscriptions = stats?.total ?? subscriptions.length;

  const filterConfigs = [
    {
      key: 'type',
      label: 'Type',
      options: SUBSCRIPTION_TYPES.map((t) => ({ value: t.value, label: t.label })),
    },
    {
      key: 'status',
      label: 'Status',
      options: SUBSCRIPTION_STATUSES.map((s) => ({ value: s.value, label: s.label })),
    },
  ];

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(new Date().getFullYear(), i);
    return {
      key: i,
      label: date.toLocaleString('en-US', { month: 'short' }),
    };
  });

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader
        title="Subscriptions"
        description={`${activeSubscriptions} active, MRR ${formatAmount(totalMRR)}`}
      >
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
        <Button variant="outline" size="icon" onClick={fetchSubscriptions}>
          <RefreshCcw size={16} />
        </Button>
        <Button>
          <Plus size={16} />
          New Subscription
        </Button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4">
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Monthly Recurring Revenue</p>
          <p className="mt-1 text-xl font-bold text-green-600">{formatAmount(totalMRR)}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Active Subscriptions</p>
          <p className="mt-1 text-xl font-bold">{activeSubscriptions}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Total Subscriptions</p>
          <p className="mt-1 text-xl font-bold">{totalSubscriptions}</p>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by project or company..."
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        onClearFilters={() => setFilters({})}
      />

      {loading ? (
        <LoadingState count={4} />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchSubscriptions} />
      ) : subscriptions.length === 0 ? (
        <EmptyState
          icon={RefreshCw}
          title="No subscriptions yet"
          description="Set up recurring billing for your clients"
          action={
            <Button>
              <Plus size={16} />
              Create First Subscription
            </Button>
          }
        />
      ) : (
        <>
          {activeSubs.length > 0 && (
            <div className="border-border overflow-x-auto rounded-xl border">
              <table className="w-full text-xs">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="bg-secondary/50 text-muted-foreground sticky left-0 px-3 py-2 text-left font-medium">
                      Project
                    </th>
                    {months.map((m) => (
                      <th
                        key={m.key}
                        className="text-muted-foreground px-3 py-2 text-center font-medium"
                      >
                        {m.label}
                      </th>
                    ))}
                    <th className="text-muted-foreground px-3 py-2 text-right font-medium">
                      Annual
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {activeSubs.map((sub) => {
                    const amount = parseFloat(sub.amount);
                    const startMonth = new Date(sub.startDate).getMonth();
                    return (
                      <tr key={sub.id} className="hover:bg-secondary/30">
                        <td className="bg-card sticky left-0 px-3 py-2 font-medium">
                          <div>
                            <p>{sub.project?.name ?? 'N/A'}</p>
                            <p className="text-muted-foreground text-[10px]">
                              {formatAmount(amount)}/mo
                            </p>
                          </div>
                        </td>
                        {months.map((m) => {
                          const isActive = m.key >= startMonth;
                          const isPast = m.key < new Date().getMonth();
                          return (
                            <td key={m.key} className="px-3 py-2 text-center">
                              {isActive ? (
                                <span
                                  className={`inline-block rounded px-2 py-0.5 text-[10px] font-medium ${
                                    isPast
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                  }`}
                                >
                                  {formatAmount(amount)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-right font-bold">
                          {formatAmount(amount * (12 - startMonth))}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-secondary/30 font-bold">
                    <td className="bg-secondary/30 sticky left-0 px-3 py-2">Total</td>
                    {months.map((m) => {
                      const monthTotal = activeSubs.reduce((sum, sub) => {
                        const startMonth = new Date(sub.startDate).getMonth();
                        return m.key >= startMonth ? sum + parseFloat(sub.amount) : sum;
                      }, 0);
                      return (
                        <td key={m.key} className="px-3 py-2 text-center">
                          {monthTotal > 0 ? formatAmount(monthTotal) : '—'}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right">{formatAmount(totalMRR * 12)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="border-border overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount/mo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Billing Day</TableHead>
                  <TableHead>Start Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => {
                  const subType = getSubscriptionType(sub.type);
                  const subStatus = getSubscriptionStatus(sub.status);
                  return (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FolderKanban size={14} className="text-muted-foreground" />
                          <span className="font-medium">{sub.project?.name ?? 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {sub.company?.name ?? '—'}
                      </TableCell>
                      <TableCell>
                        {subType && <StatusBadge label={subType.label} variant={subType.variant} />}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="flex items-center justify-end gap-1 font-semibold">
                          <DollarSign size={12} className="text-accent" />
                          {formatAmount(parseFloat(sub.amount))}
                        </span>
                      </TableCell>
                      <TableCell>
                        {subStatus && (
                          <StatusBadge label={subStatus.label} variant={subStatus.variant} />
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-muted-foreground" />
                          {sub.billingDay}th
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(sub.startDate).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
