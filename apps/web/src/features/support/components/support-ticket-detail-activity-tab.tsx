'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import type { AuditLogEntry } from '@/lib/api/audit';
import { formatSupportAuditLine } from './support-ticket-detail-helpers';

export interface SupportTicketDetailActivityTabProps {
  loading: boolean;
  items: AuditLogEntry[];
}

export function SupportTicketDetailActivityTab({
  loading,
  items,
}: SupportTicketDetailActivityTabProps) {
  return (
    <ScrollArea className="h-[min(70vh,32rem)] px-6 py-4">
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading activity…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No audit entries yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((entry) => (
            <li key={entry.id} className="text-sm">
              <p className="text-muted-foreground text-xs">
                {new Date(entry.createdAt).toLocaleString()}
                {entry.actor ? ` · ${entry.actor.firstName} ${entry.actor.lastName}` : ''}
              </p>
              <p className="font-medium">{formatSupportAuditLine(entry)}</p>
            </li>
          ))}
        </ul>
      )}
    </ScrollArea>
  );
}
