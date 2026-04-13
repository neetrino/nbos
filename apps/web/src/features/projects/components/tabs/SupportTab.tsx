'use client';

import { StatusBadge } from '@/components/shared';
import type { ProjectTicket } from '@/lib/api/projects';

interface SupportTabProps {
  tickets: ProjectTicket[];
}

const TICKET_STATUS_MAP: Record<
  string,
  {
    label: string;
    variant: 'blue' | 'purple' | 'amber' | 'green' | 'red' | 'gray' | 'indigo' | 'teal';
  }
> = {
  NEW: { label: 'New', variant: 'blue' },
  TRIAGED: { label: 'Triaged', variant: 'indigo' },
  ASSIGNED: { label: 'Assigned', variant: 'teal' },
  IN_PROGRESS: { label: 'In Progress', variant: 'purple' },
  RESOLVED: { label: 'Resolved', variant: 'green' },
  CLOSED: { label: 'Closed', variant: 'gray' },
  REOPENED: { label: 'Reopened', variant: 'red' },
};

const PRIORITY_COLORS: Record<string, string> = {
  P1: 'bg-red-500',
  P2: 'bg-amber-500',
  P3: 'bg-blue-500',
};

const CATEGORY_MAP: Record<
  string,
  { label: string; variant: 'red' | 'blue' | 'amber' | 'purple' }
> = {
  INCIDENT: { label: 'Incident', variant: 'red' },
  SERVICE_REQUEST: { label: 'Service Request', variant: 'blue' },
  CHANGE_REQUEST: { label: 'Change Request', variant: 'amber' },
  PROBLEM: { label: 'Problem', variant: 'purple' },
};

export function SupportTab({ tickets }: SupportTabProps) {
  const openCount = tickets.filter((t) => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="bg-card border-border rounded-lg border px-4 py-2">
          <span className="text-lg font-bold">{openCount}</span>
          <span className="text-muted-foreground ml-1 text-xs">open</span>
        </div>
        <div className="bg-card border-border rounded-lg border px-4 py-2">
          <span className="text-lg font-bold">{tickets.length}</span>
          <span className="text-muted-foreground ml-1 text-xs">total</span>
        </div>
      </div>

      {tickets.length === 0 ? (
        <p className="text-muted-foreground text-sm">No support tickets</p>
      ) : (
        <div className="border-border overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Ticket</th>
                <th className="px-4 py-2 text-left font-medium">Category</th>
                <th className="px-4 py-2 text-left font-medium">Priority</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Assignee</th>
                <th className="px-4 py-2 text-left font-medium">Billable</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => {
                const st = TICKET_STATUS_MAP[ticket.status];
                const cat = CATEGORY_MAP[ticket.category];
                return (
                  <tr key={ticket.id} className="border-border border-t">
                    <td className="px-4 py-2">
                      <p className="font-medium">{ticket.title}</p>
                      <p className="text-muted-foreground text-xs">{ticket.code}</p>
                    </td>
                    <td className="px-4 py-2">
                      {cat && <StatusBadge label={cat.label} variant={cat.variant} />}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`h-2 w-2 rounded-full ${PRIORITY_COLORS[ticket.priority] ?? 'bg-gray-400'}`}
                        />
                        <span>{ticket.priority}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {st && <StatusBadge label={st.label} variant={st.variant} />}
                    </td>
                    <td className="text-muted-foreground px-4 py-2">
                      {ticket.assignee
                        ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}`
                        : '—'}
                    </td>
                    <td className="px-4 py-2">
                      {ticket.billable ? (
                        <StatusBadge label="Billable" variant="amber" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
