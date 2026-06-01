'use client';

import { useState } from 'react';
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
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import { cn } from '@/lib/utils';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  CLIENT_SERVICE_BILLING_MODELS,
  CLIENT_SERVICE_TYPES,
  clientServiceOptionLabel,
} from '@/features/finance/constants/client-services';
import type { ClientServiceRecord, ClientServiceRecordListParams } from '@/lib/api/client-services';
import { InfiniteScrollSentinel } from './InfiniteScrollSentinel';
import { ClientServiceRowActions, type ClientServiceActionKind } from './ClientServiceRowActions';
import { ClientServiceStageBadge } from './ClientServiceStageBadge';
import { useClientServiceList } from './use-client-service-list';

interface ClientServiceListViewProps {
  baseParams: ClientServiceRecordListParams;
  reloadToken: number;
  onOpen: (id: string) => void;
  onAction: (service: ClientServiceRecord, kind: ClientServiceActionKind) => void;
  actionId: string | null;
  canCreateTask: boolean;
  onRequestDelete: (target: { id: string; name: string }) => void;
  onCreate: () => void;
}

function formatShortDate(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: '2-digit' }).format(
    new Date(value),
  );
}

export function ClientServiceListView({
  baseParams,
  reloadToken,
  onOpen,
  onAction,
  actionId,
  canCreateTask,
  onRequestDelete,
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
            <TableHead>Service</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Renewal</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead className="w-[52px] text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((service) => (
            <TableRow
              key={service.id}
              className={cn(
                'hover:bg-muted/40',
                service.overdue && 'bg-red-50/40 dark:bg-red-950/10',
              )}
            >
              <TableCell>
                <button
                  type="button"
                  onClick={() => onOpen(service.id)}
                  className={cn(
                    'text-primary text-left font-medium hover:underline',
                    'focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none',
                  )}
                >
                  {service.name}
                </button>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <StatusBadge
                    label={clientServiceOptionLabel(CLIENT_SERVICE_TYPES, service.type)}
                    variant="gray"
                  />
                  <StatusBadge
                    label={clientServiceOptionLabel(
                      CLIENT_SERVICE_BILLING_MODELS,
                      service.billingModel,
                    )}
                    variant={service.billingModel === 'CLIENT_PAID' ? 'blue' : 'zinc'}
                  />
                </div>
                {service.provider ? (
                  <p className="text-muted-foreground mt-1 max-w-[220px] truncate text-xs">
                    {service.provider}
                  </p>
                ) : null}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                <span className="text-foreground font-medium">{service.project.code}</span>
                <p className="max-w-[160px] truncate">{service.project.name}</p>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock size={12} className="shrink-0 opacity-70" aria-hidden />
                  {formatShortDate(service.renewalDate)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className="inline-flex items-center justify-end gap-1 font-semibold tabular-nums">
                  <DollarSign size={12} className="text-accent shrink-0" aria-hidden />
                  {service.ourCost ? formatAmount(Number(service.ourCost)) : '—'}
                </span>
                {service.clientCharge ? (
                  <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                    Charge {formatAmount(Number(service.clientCharge))}
                  </p>
                ) : null}
              </TableCell>
              <TableCell>
                <ClientServiceStageBadge service={service} emptyLabel="—" />
              </TableCell>
              <TableCell className="text-right">
                <ClientServiceRowActions
                  service={service}
                  actionId={actionId}
                  canCreateTask={canCreateTask}
                  onAction={onAction}
                  onRequestDelete={onRequestDelete}
                />
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
