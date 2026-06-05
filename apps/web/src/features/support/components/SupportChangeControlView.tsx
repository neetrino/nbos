'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FilePlus2, FolderKanban } from 'lucide-react';
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
import { SupportTicketActionOverlays } from '@/features/support/components/SupportTicketActionOverlays';
import {
  getTicketCoverage,
  getTicketPriority,
  getTicketStatus,
} from '@/features/support/constants/support';
import { SUPPORT_TICKET_OPEN_QUERY } from '@/features/support/constants/support-ticket-open-query';
import { useSupportTicketActions } from '@/features/support/hooks/use-support-ticket-actions';
import { supportApi, type SupportTicket } from '@/lib/api/support';
import { usePermission } from '@/lib/permissions';
import { getApiErrorMessage } from '@/lib/api-errors';

export function SupportChangeControlView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const openTicketIdFromUrl = searchParams.get(SUPPORT_TICKET_OPEN_QUERY)?.trim() || null;

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);
  const { me } = usePermission();

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await supportApi.getAll({
        pageSize: 100,
        category: 'CHANGE_REQUEST',
      });
      setTickets(items);
      setError(null);
    } catch {
      setError('Change control tickets could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSupportViews = useCallback(async () => {
    await fetchTickets();
    setDetailRefreshKey((key) => key + 1);
  }, [fetchTickets]);

  const actions = useSupportTicketActions({
    tickets,
    refreshSupportViews,
    setError,
  });

  useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  const stripSupportTicketOpenFromUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has(SUPPORT_TICKET_OPEN_QUERY)) {
      return;
    }
    params.delete(SUPPORT_TICKET_OPEN_QUERY);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [router, pathname, searchParams]);

  const openSupportDetail = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(SUPPORT_TICKET_OPEN_QUERY, id);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const handleSupportDetailOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        stripSupportTicketOpenFromUrl();
      }
    },
    [stripSupportTicketOpenFromUrl],
  );

  async function handleCreateExtensionDeal(ticket: SupportTicket) {
    if (!me?.id) return;
    setActionId(ticket.id);
    try {
      await supportApi.createExtensionDeal(ticket.id, { sellerId: me.id });
      await refreshSupportViews();
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Extension Deal could not be created.'));
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="flex h-full flex-col gap-5">
      <p className="text-muted-foreground text-sm">
        Change requests from maintenance clients: classify coverage, create Extension Deals, and
        track delivery until the ticket closes.
      </p>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={() => void fetchTickets()} />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No change requests"
          description="Tickets with category Change Request appear here after triage."
        />
      ) : (
        <div className="border-border overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Coverage</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Deal</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => {
                const priority = getTicketPriority(ticket.priority);
                const status = getTicketStatus(ticket.status);
                const coverage = getTicketCoverage(ticket.coverageDecision);
                return (
                  <TableRow
                    key={ticket.id}
                    className="hover:bg-muted/40 cursor-pointer"
                    onClick={() => openSupportDetail(ticket.id)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{ticket.title}</p>
                        <p className="text-muted-foreground text-xs">{ticket.code}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {priority && (
                        <StatusBadge label={priority.label} variant={priority.variant} />
                      )}
                    </TableCell>
                    <TableCell>
                      {status && <StatusBadge label={status.label} variant={status.variant} />}
                    </TableCell>
                    <TableCell>
                      {coverage ? (
                        <StatusBadge label={coverage.label} variant={coverage.variant} />
                      ) : (
                        <StatusBadge label="Not decided" variant="gray" />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {ticket.project?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {ticket.product?.name ?? '—'}
                    </TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      {ticket.extensionDeal ? (
                        <StatusBadge
                          label={`Deal ${ticket.extensionDeal.code}`}
                          variant={ticket.extensionDeal.status === 'WON' ? 'green' : 'purple'}
                        />
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={
                            !me?.id ||
                            actionId === ticket.id ||
                            !ticket.productId ||
                            ['RESOLVED', 'CLOSED'].includes(ticket.status)
                          }
                          onClick={() => void handleCreateExtensionDeal(ticket)}
                          className="h-7 gap-1 px-2 text-xs"
                          title={
                            ticket.productId
                              ? 'Create Extension Deal'
                              : 'Product context is required'
                          }
                        >
                          <FilePlus2 size={12} />
                          Extension deal
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <SupportTicketActionOverlays
        ticketId={openTicketIdFromUrl}
        open={Boolean(openTicketIdFromUrl)}
        onOpenChange={handleSupportDetailOpenChange}
        detailRefreshKey={detailRefreshKey}
        meId={me?.id ?? null}
        onListInvalidate={() => void refreshSupportViews()}
        actions={actions}
      />
    </div>
  );
}
