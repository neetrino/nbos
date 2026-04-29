import { AlertTriangle, CheckCircle2, Clock, Ticket } from 'lucide-react';
import type { ProductTicketRef } from '@/lib/api/products';

interface ProductTicketsSummaryProps {
  tickets: ProductTicketRef[];
}

export function ProductTicketsSummary({ tickets }: ProductTicketsSummaryProps) {
  const stats = getTicketStats(tickets);

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <TicketSummaryCard icon={Ticket} label="Open cases" value={String(stats.open)} />
      <TicketSummaryCard icon={Clock} label="Waiting" value={String(stats.waiting)} />
      <TicketSummaryCard icon={AlertTriangle} label="P1/P2" value={String(stats.urgent)} />
      <TicketSummaryCard icon={CheckCircle2} label="Resolved" value={String(stats.resolved)} />
    </div>
  );
}

function TicketSummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Ticket;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-card border-border rounded-xl border p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium">{label}</span>
        <Icon size={14} className="text-muted-foreground" />
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function getTicketStats(tickets: ProductTicketRef[]) {
  return {
    open: tickets.filter((ticket) => ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED')
      .length,
    waiting: tickets.filter((ticket) => ticket.status === 'WAITING').length,
    urgent: tickets.filter((ticket) => ticket.priority === 'P1' || ticket.priority === 'P2').length,
    resolved: tickets.filter((ticket) => ticket.status === 'RESOLVED').length,
  };
}
