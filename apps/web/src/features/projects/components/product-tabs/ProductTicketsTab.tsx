'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Ticket } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/shared';
import { ProductTabViewHero } from '@/features/projects/components/product-tabs/ProductTabViewHero';
import { ProductTicketsSummary } from '@/features/projects/components/product-tabs/ProductTicketsSummary';
import { useProjectDetailViewMode } from '@/features/projects/constants/project-detail-view-storage';
import { productTicketToSupportTicket } from '@/features/projects/utils/product-ticket-support-adapter';
import { SupportTicketCard } from '@/features/support/components/SupportTicketCard';
import { SupportTicketsListView } from '@/features/support/components/SupportTicketsListView';
import { SUPPORT_TICKET_OPEN_QUERY } from '@/features/support/constants/support-ticket-open-query';
import { PROJECT_PRODUCTS_CARD_GRID_CLASS } from '@/features/projects/components/project-detail-layout.constants';
import type { ProductTicketRef } from '@/lib/api/products';
import { cn } from '@/lib/utils';

interface ProductTicketsTabProps {
  tickets: ProductTicketRef[];
  project: { id: string; code: string; name: string };
  product: { id: string; name: string; status: string };
}

export function ProductTicketsTab({ tickets, project, product }: ProductTicketsTabProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useProjectDetailViewMode();

  const supportTickets = useMemo(
    () => tickets.map((ticket) => productTicketToSupportTicket(ticket, project, product)),
    [tickets, project, product],
  );

  const handleOpenDetail = useCallback(
    (ticketId: string) => {
      router.push(`/support?${SUPPORT_TICKET_OPEN_QUERY}=${encodeURIComponent(ticketId)}`);
    },
    [router],
  );

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={Ticket}
        title="No support tickets"
        description="No support tickets for this product."
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <ProductTabViewHero
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        trailing={
          <Link
            href="/support"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
          >
            Open Support
            <ExternalLink size={12} className="opacity-70" aria-hidden />
          </Link>
        }
      />
      <ProductTicketsSummary tickets={tickets} />
      {viewMode === 'list' ? (
        <SupportTicketsListView
          tickets={supportTickets}
          actionId={null}
          onOpenDetail={handleOpenDetail}
          onStatusSelect={() => undefined}
          onReopen={() => undefined}
        />
      ) : (
        <div className={PROJECT_PRODUCTS_CARD_GRID_CLASS}>
          {supportTickets.map((ticket) => (
            <SupportTicketCard
              key={ticket.id}
              ticket={ticket}
              onOpenDetail={handleOpenDetail}
              showProject={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
