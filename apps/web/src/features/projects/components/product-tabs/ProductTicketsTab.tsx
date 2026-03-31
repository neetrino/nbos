'use client';

import { Ticket } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import type { ProductTicketRef } from '@/lib/api/products';

interface ProductTicketsTabProps {
  tickets: ProductTicketRef[];
}

const PRIORITY_VARIANTS: Record<string, 'red' | 'orange' | 'amber' | 'blue' | 'gray'> = {
  P1: 'red',
  P2: 'orange',
  P3: 'amber',
  P4: 'blue',
};

const STATUS_VARIANTS: Record<string, 'blue' | 'purple' | 'amber' | 'green' | 'gray'> = {
  OPEN: 'blue',
  IN_PROGRESS: 'purple',
  WAITING: 'amber',
  RESOLVED: 'green',
  CLOSED: 'gray',
};

export function ProductTicketsTab({ tickets }: ProductTicketsTabProps) {
  if (tickets.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        <Ticket size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">No support tickets for this product.</p>
      </div>
    );
  }

  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Ticket</th>
            <th className="px-4 py-2.5 text-left font-medium">Category</th>
            <th className="px-4 py-2.5 text-left font-medium">Priority</th>
            <th className="px-4 py-2.5 text-left font-medium">Status</th>
            <th className="px-4 py-2.5 text-left font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="border-border border-t">
              <td className="px-4 py-2.5">
                <p className="font-medium">{ticket.title}</p>
                <p className="text-muted-foreground text-xs">{ticket.code}</p>
              </td>
              <td className="text-muted-foreground px-4 py-2.5 text-xs">{ticket.category}</td>
              <td className="px-4 py-2.5">
                <StatusBadge
                  label={ticket.priority}
                  variant={PRIORITY_VARIANTS[ticket.priority] ?? 'gray'}
                />
              </td>
              <td className="px-4 py-2.5">
                <StatusBadge
                  label={ticket.status.replace('_', ' ')}
                  variant={STATUS_VARIANTS[ticket.status] ?? 'gray'}
                />
              </td>
              <td className="text-muted-foreground px-4 py-2.5 text-xs">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
