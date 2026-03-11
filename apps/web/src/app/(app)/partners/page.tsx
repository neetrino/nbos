'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  RefreshCcw,
  Handshake,
  User,
  Mail,
  Phone,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  TrendingUp,
  DollarSign,
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
import { PageHeader, FilterBar, EmptyState, StatusBadge } from '@/components/shared';
import {
  PARTNER_TYPES,
  PARTNER_LEVELS,
  AGREEMENT_STATUSES,
  PARTNER_STATUSES,
  getPartnerType,
  getPartnerLevel,
  getAgreementStatus,
  getPartnerStatus,
} from '@/features/partners/constants/partners';
import { api } from '@/lib/api';

interface Partner {
  id: string;
  companyName: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  telegram: string | null;
  type: string;
  level: string;
  agreementStatus: string;
  defaultPercentage: number;
  startDate: string | null;
  status: string;
  dealsCount: number;
  totalRevenue: number;
  totalPaid: number;
  outstanding: number;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await api.get('/api/partners', {
        params: {
          search: search || undefined,
          type: filters.type && filters.type !== 'all' ? filters.type : undefined,
          level: filters.level && filters.level !== 'all' ? filters.level : undefined,
        },
      });
      setPartners(resp.data.items ?? resp.data ?? []);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const totalRevenue = partners.reduce((s, p) => s + (p.totalRevenue ?? 0), 0);
  const totalOutstanding = partners.reduce((s, p) => s + (p.outstanding ?? 0), 0);

  const filterConfigs = [
    {
      key: 'type',
      label: 'Type',
      options: PARTNER_TYPES.map((t) => ({ value: t.value, label: t.label })),
    },
    {
      key: 'level',
      label: 'Level',
      options: PARTNER_LEVELS.map((l) => ({ value: l.value, label: l.label })),
    },
    {
      key: 'status',
      label: 'Status',
      options: PARTNER_STATUSES.map((s) => ({ value: s.value, label: s.label })),
    },
  ];

  function formatCurrency(n: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AMD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  }

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader title="Partners" description={`${partners.length} partners`}>
        <Button variant="outline" size="icon" onClick={fetchPartners}>
          <RefreshCcw size={16} />
        </Button>
        <Button>
          <Plus size={16} />
          Add Partner
        </Button>
      </PageHeader>

      <div className="grid grid-cols-4 gap-4">
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Total Partners</p>
          <p className="mt-1 text-xl font-bold">{partners.length}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Total Revenue</p>
          <p className="mt-1 text-xl font-bold">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Outstanding</p>
          <p className="mt-1 text-xl font-bold text-amber-500">
            {formatCurrency(totalOutstanding)}
          </p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Premium Partners</p>
          <p className="mt-1 text-xl font-bold">
            {partners.filter((p) => p.level === 'PREMIUM').length}
          </p>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, contact..."
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        onClearFilters={() => setFilters({})}
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
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
                <TableHead>Type</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Agreement</TableHead>
                <TableHead>%</TableHead>
                <TableHead>Deals</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((partner) => {
                const type = getPartnerType(partner.type);
                const level = getPartnerLevel(partner.level);
                const agr = getAgreementStatus(partner.agreementStatus);
                const st = getPartnerStatus(partner.status);
                return (
                  <TableRow key={partner.id} className="cursor-pointer">
                    <TableCell>
                      <div>
                        <p className="font-medium">{partner.companyName}</p>
                        {partner.contactPerson && (
                          <p className="text-muted-foreground text-xs">{partner.contactPerson}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {type && (
                        <div className="flex items-center gap-1">
                          {partner.type === 'INBOUND' ? (
                            <ArrowDownLeft size={12} className="text-green-500" />
                          ) : partner.type === 'OUTBOUND' ? (
                            <ArrowUpRight size={12} className="text-blue-500" />
                          ) : null}
                          <StatusBadge label={type.label} variant={type.variant} />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {level && <StatusBadge label={level.label} variant={level.variant} />}
                    </TableCell>
                    <TableCell>
                      {agr && <StatusBadge label={agr.label} variant={agr.variant} />}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {partner.defaultPercentage}%
                    </TableCell>
                    <TableCell className="text-sm">{partner.dealsCount ?? 0}</TableCell>
                    <TableCell className="text-sm">
                      {formatCurrency(partner.totalRevenue ?? 0)}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-amber-500">
                      {formatCurrency(partner.outstanding ?? 0)}
                    </TableCell>
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
