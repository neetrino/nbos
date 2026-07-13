'use client';

import { useState } from 'react';
import { FolderKanban, Loader2, ServerCog } from 'lucide-react';
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
import {
  CLIENT_SERVICE_BILLING_MODELS,
  CLIENT_SERVICE_TYPES,
  clientServiceOptionLabel,
} from '@/features/finance/constants/client-services';
import type { ClientServiceRecord, ClientServiceRecordListParams } from '@/lib/api/client-services';
import { InfiniteScrollSentinel } from '@/components/shared/InfiniteScrollSentinel';
import { formatGroupedNumber, parseMoneyAmount } from '@/lib/format/money';
import {
  FINANCE_LIST_CELL_CLASS,
  FINANCE_LIST_HEAD_CLASS,
  FINANCE_LIST_ROW_HOVER_CLASS,
  FINANCE_LIST_SHELL_CLASS,
  FINANCE_LIST_TYPE_CLASS,
  FinanceListAmount,
  FinanceListDate,
  FinanceListIconLabel,
  FinanceListMutedDash,
  FinanceListPrimaryCell,
} from '@/features/finance/components/shared/finance-list-table';
import { ClientServiceStageBadge } from './ClientServiceStageBadge';
import { useClientServiceList } from './use-client-service-list';

interface ClientServiceListViewProps {
  baseParams: ClientServiceRecordListParams;
  reloadToken: number;
  onOpen: (service: ClientServiceRecord) => void;
  onCreate: () => void;
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
    <div ref={setScrollEl} className={cn(FINANCE_LIST_SHELL_CLASS, 'min-h-0 flex-1 overflow-auto')}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={`${FINANCE_LIST_HEAD_CLASS} min-w-[180px]`}>Service</TableHead>
            <TableHead className={`${FINANCE_LIST_HEAD_CLASS} min-w-[100px]`}>Kind</TableHead>
            <TableHead className={`${FINANCE_LIST_HEAD_CLASS} min-w-[120px]`}>Project</TableHead>
            <TableHead className={`${FINANCE_LIST_HEAD_CLASS} min-w-[100px]`}>Renewal</TableHead>
            <TableHead className={`${FINANCE_LIST_HEAD_CLASS} min-w-[100px]`}>Cost</TableHead>
            <TableHead className={`${FINANCE_LIST_HEAD_CLASS} min-w-[88px]`}>Stage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((service) => (
            <TableRow
              key={service.id}
              className={cn(
                FINANCE_LIST_ROW_HOVER_CLASS,
                'cursor-pointer',
                service.overdue && 'bg-red-50/40 dark:bg-red-950/10',
              )}
              onClick={() => onOpen(service)}
            >
              <TableCell className={`${FINANCE_LIST_CELL_CLASS} max-w-[240px]`}>
                <FinanceListPrimaryCell title={service.name} subtitle={service.provider ?? null} />
              </TableCell>

              <TableCell className={`${FINANCE_LIST_CELL_CLASS} max-w-[140px]`}>
                <p className="truncate text-sm font-bold">
                  {clientServiceOptionLabel(CLIENT_SERVICE_TYPES, service.type)}
                </p>
                <p className={`${FINANCE_LIST_TYPE_CLASS} mt-1 normal-case`}>
                  {clientServiceOptionLabel(CLIENT_SERVICE_BILLING_MODELS, service.billingModel)}
                </p>
              </TableCell>

              <TableCell className={`${FINANCE_LIST_CELL_CLASS} max-w-[160px]`}>
                <FinanceListIconLabel
                  icon={FolderKanban}
                  iconClassName="bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
                  label={service.project.code}
                  labelClassName="font-bold"
                />
                <p className="text-muted-foreground mt-1 truncate pl-8 text-xs">
                  {service.project.name}
                </p>
              </TableCell>

              <TableCell className={FINANCE_LIST_CELL_CLASS}>
                <FinanceListDate value={service.renewalDate} />
              </TableCell>

              <TableCell className={FINANCE_LIST_CELL_CLASS}>
                {service.ourCost ? (
                  <div className="space-y-1">
                    <FinanceListAmount amount={service.ourCost} />
                    {service.clientCharge ? (
                      <p className="text-muted-foreground text-xs tabular-nums">
                        Charge {formatGroupedNumber(parseMoneyAmount(service.clientCharge))}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <FinanceListMutedDash />
                )}
              </TableCell>

              <TableCell className={FINANCE_LIST_CELL_CLASS}>
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
