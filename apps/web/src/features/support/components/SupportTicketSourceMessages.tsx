'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { DetailSheetSection } from '@/components/shared';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import { CLIENT_OPEN_CONVERSATION_QUERY } from '@/features/messenger-client/client-messenger.constants';

type TicketSourceRow = Awaited<ReturnType<typeof messengerCoreApi.listTicketSources>>[number];

export function SupportTicketSourceMessages({ ticketId }: { ticketId: string }) {
  const [items, setItems] = useState<TicketSourceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void messengerCoreApi
      .listTicketSources(ticketId)
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  return (
    <DetailSheetSection title="Client source messages" icon={<MessageSquare size={12} />}>
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading source references…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No Client messages referenced. Ticket chat does not copy client history.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((row) => (
            <TicketSourceRowItem key={row.referenceId} row={row} />
          ))}
        </ul>
      )}
    </DetailSheetSection>
  );
}

function TicketSourceRowItem({ row }: { row: TicketSourceRow }) {
  const href = `/client-messenger?${CLIENT_OPEN_CONVERSATION_QUERY}=${encodeURIComponent(row.sourceConversationId)}`;
  return (
    <li className="border-border rounded-lg border px-3 py-2">
      <p className="text-sm">
        {row.canOpen ? row.preview || 'Empty message' : 'No Client access to this source'}
      </p>
      {row.canOpen ? (
        <Link href={href} className="text-primary mt-1 inline-block text-xs font-medium">
          Open original
        </Link>
      ) : null}
    </li>
  );
}
