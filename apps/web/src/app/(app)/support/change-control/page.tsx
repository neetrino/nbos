'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FilePlus2, FolderKanban, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from '@/components/shared';
import {
  getTicketCoverage,
  getTicketPriority,
  getTicketStatus,
} from '@/features/support/constants/support';
import { supportApi, type SupportTicket } from '@/lib/api/support';
import { usePermission } from '@/lib/permissions';
import { getApiErrorMessage } from '@/lib/api-errors';

export default function SupportChangeControlPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
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

  useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  async function handleCreateExtensionDeal(ticket: SupportTicket) {
    if (!me?.id) return;
    setActionId(ticket.id);
    try {
      await supportApi.createExtensionDeal(ticket.id, { sellerId: me.id });
      await fetchTickets();
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Extension Deal could not be created.'));
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader
        title="Support Change Control"
        description="Dedicated queue for CHANGE_REQUEST tickets and Extension Deal conversion."
      >
        <Button variant="outline" size="icon" onClick={() => void fetchTickets()}>
          <RefreshCcw size={16} />
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/support">Back to Support</Link>
        </Button>
      </PageHeader>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={() => void fetchTickets()} />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No change requests"
          description="CHANGE_REQUEST tickets will appear here."
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
                  <TableRow key={ticket.id}>
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
                    <TableCell>
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
    </div>
  );
}
