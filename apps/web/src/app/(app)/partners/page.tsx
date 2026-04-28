'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  RefreshCcw,
  Handshake,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
} from 'lucide-react';
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
  PARTNER_TYPES,
  PARTNER_DIRECTIONS,
  PARTNER_STATUSES,
  getPartnerType,
  getPartnerDirection,
  getPartnerStatus,
} from '@/features/partners/constants/partners';
import { partnersApi, type Partner, type PartnerStats } from '@/lib/api/partners';

const PARTNERS_LIST_PAGE_SIZE = 100;

function formatPercent(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(n)) return '—';
  return `${Number.isInteger(n) ? n : n.toFixed(1)}%`;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [listTotal, setListTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: 1,
        pageSize: PARTNERS_LIST_PAGE_SIZE,
        search: search || undefined,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        type: filters.type && filters.type !== 'all' ? filters.type : undefined,
        direction: filters.direction && filters.direction !== 'all' ? filters.direction : undefined,
      };
      const [listRes, statsRes] = await Promise.all([
        partnersApi.getAll(params),
        partnersApi.getStats(),
      ]);
      setPartners(listRes.items);
      setListTotal(listRes.meta.total);
      setStats(statsRes);
      setError(null);
    } catch {
      setError('Partners could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const filterConfigs = [
    {
      key: 'type',
      label: 'Tier',
      options: PARTNER_TYPES.map((t) => ({ value: t.value, label: t.label })),
    },
    {
      key: 'direction',
      label: 'Direction',
      options: PARTNER_DIRECTIONS.map((d) => ({ value: d.value, label: d.label })),
    },
    {
      key: 'status',
      label: 'Status',
      options: PARTNER_STATUSES.map((s) => ({ value: s.value, label: s.label })),
    },
  ];

  const summary = stats ?? {
    total: 0,
    totalSubscriptions: 0,
    avgPayoutPercent: 0,
  };

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader
        title="Partners"
        description={`${listTotal} partner${listTotal === 1 ? '' : 's'}`}
      >
        <Button variant="outline" size="icon" onClick={fetchPartners}>
          <RefreshCcw size={16} />
        </Button>
        <Button>
          <Plus size={16} />
          Add Partner
        </Button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4">
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Total partners</p>
          <p className="mt-1 text-xl font-bold">{summary.total}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Linked subscriptions</p>
          <p className="mt-1 text-xl font-bold">{summary.totalSubscriptions}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Avg default %</p>
          <p className="mt-1 text-xl font-bold">{summary.avgPayoutPercent.toFixed(1)}%</p>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name..."
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        onClearFilters={() => setFilters({})}
      />

      {loading ? (
        <LoadingState count={4} />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchPartners} />
      ) : partners.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No partners yet"
          description="Start building your partner network"
          action={
            <Button>
              <Plus size={16} /> Add First Partner
            </Button>
          }
        />
      ) : (
        <div className="border-border overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Default %</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Subscriptions</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((partner) => {
                const tier = getPartnerType(partner.type);
                const dir = getPartnerDirection(partner.direction);
                const st = getPartnerStatus(partner.status);
                const orders = partner._count?.orders ?? 0;
                const subs = partner._count?.subscriptions ?? 0;
                return (
                  <TableRow key={partner.id} className="cursor-pointer">
                    <TableCell>
                      <p className="font-medium">{partner.name}</p>
                    </TableCell>
                    <TableCell>
                      {tier && <StatusBadge label={tier.label} variant={tier.variant} />}
                    </TableCell>
                    <TableCell>
                      {dir && (
                        <div className="flex items-center gap-1">
                          {partner.direction === 'INBOUND' ? (
                            <ArrowDownLeft size={12} className="text-green-500" />
                          ) : partner.direction === 'OUTBOUND' ? (
                            <ArrowUpRight size={12} className="text-blue-500" />
                          ) : (
                            <ArrowLeftRight size={12} className="text-purple-500" />
                          )}
                          <StatusBadge label={dir.label} variant={dir.variant} />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-medium tabular-nums">
                      {formatPercent(partner.defaultPercent)}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">{orders}</TableCell>
                    <TableCell className="text-sm tabular-nums">{subs}</TableCell>
                    <TableCell>
                      {st && <StatusBadge label={st.label} variant={st.variant} />}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
