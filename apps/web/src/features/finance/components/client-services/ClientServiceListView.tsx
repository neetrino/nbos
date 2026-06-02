'use client';

import { useState, type ReactNode } from 'react';
import { CalendarClock, DollarSign, Loader2, ServerCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { cn } from '@/lib/utils';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  CLIENT_SERVICE_BILLING_MODELS,
  CLIENT_SERVICE_TYPES,
  clientServiceOptionLabel,
} from '@/features/finance/constants/client-services';
import type { ClientServiceRecordListParams } from '@/lib/api/client-services';
import { InfiniteScrollSentinel } from '@/components/shared/InfiniteScrollSentinel';
import { ClientServiceStageBadge } from './ClientServiceStageBadge';
import { useClientServiceList } from './use-client-service-list';

interface ClientServiceListViewProps {
  baseParams: ClientServiceRecordListParams;
  reloadToken: number;
  onOpen: (id: string) => void;
  onCreate: () => void;
}

function formatShortDate(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: '2-digit' }).format(
    new Date(value),
  );
}

function ListCellPrimary({ children }: { children: ReactNode }) {
  return <p className="text-foreground truncate text-sm leading-tight font-medium">{children}</p>;
}

function ListCellSecondary({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground mt-0.5 truncate text-xs leading-tight">{children}</p>;
}

export function ClientServiceListView({
  baseParams,
  reloadToken,
  onOpen,
  onCreate,
}: ClientServiceListViewProps) {
  const { items, loading, loadingMore, error, hasMore, loadMore } = useClientServiceList(
    baseParams,
    30,
    reloadToken,
  );
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState title="Client services unavailable" description={error} />;
  if (items.length === 0) {
    return (
      <EmptyState
        icon={ServerCog}
        title="No client services match"
        description="Adjust search or filters, or create a new domain, hosting, SaaS, account or license record."
        action={<Button onClick={onCreate}>Create service</Button>}
      />
    );
  }

  return (
    <div ref={setScrollEl} className="border-border min-h-0 flex-1 overflow-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[180px]">Service</TableHead>
            <TableHead className="min-w-[100px]">Kind</TableHead>
            <TableHead className="min-w-[120px]">Project</TableHead>
            <TableHead className="min-w-[100px]">Renewal</TableHead>
            <TableHead className="min-w-[100px] text-right">Cost</TableHead>
            <TableHead className="min-w-[88px]">Stage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((service) => (
            <TableRow
              key={service.id}
              className={cn(
                'hover:bg-muted/40 cursor-pointer',
                service.overdue && 'bg-red-50/40 dark:bg-red-950/10',
              )}
              onClick={() => onOpen(service.id)}
            >
              <TableCell className="max-w-[240px] py-2.5">
                <ListCellPrimary>{service.name}</ListCellPrimary>
                <ListCellSecondary>{service.provider ?? '—'}</ListCellSecondary>
              </TableCell>

              <TableCell className="max-w-[140px] py-2.5">
                <ListCellPrimary>
                  {clientServiceOptionLabel(CLIENT_SERVICE_TYPES, service.type)}
                </ListCellPrimary>
                <ListCellSecondary>
                  {clientServiceOptionLabel(CLIENT_SERVICE_BILLING_MODELS, service.billingModel)}
                </ListCellSecondary>
              </TableCell>

              <TableCell className="max-w-[160px] py-2.5">
                <ListCellPrimary>{service.project.code}</ListCellPrimary>
                <ListCellSecondary>{service.project.name}</ListCellSecondary>
              </TableCell>

              <TableCell className="py-2.5">
                <span className="text-muted-foreground inline-flex items-center gap-1 text-xs leading-tight whitespace-nowrap">
                  <CalendarClock size={12} className="shrink-0 opacity-70" aria-hidden />
                  {formatShortDate(service.renewalDate)}
                </span>
              </TableCell>

              <TableCell className="py-2.5 text-right">
                <ListCellPrimary>
                  <span className="inline-flex items-center justify-end gap-1 tabular-nums">
                    <DollarSign size={12} className="text-accent shrink-0" aria-hidden />
                    {service.ourCost ? formatAmount(Number(service.ourCost)) : '—'}
                  </span>
                </ListCellPrimary>
                {service.clientCharge ? (
                  <ListCellSecondary>
                    <span className="block truncate text-right tabular-nums">
                      {formatAmount(Number(service.clientCharge))}
                    </span>
                  </ListCellSecondary>
                ) : null}
              </TableCell>

              <TableCell className="py-2.5">
                <ClientServiceStageBadge service={service} emptyLabel="—" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {loadingMore ? (
        <div className="text-muted-foreground flex items-center justify-center py-3">
          <Loader2 className="size-4 animate-spin" aria-hidden />
        </div>
      ) : null}

      <InfiniteScrollSentinel
        onReach={loadMore}
        disabled={loading || loadingMore || !hasMore}
        root={scrollEl}
      />
    </div>
  );
}
