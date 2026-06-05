'use client';

import { CalendarClock, FolderKanban } from 'lucide-react';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  CLIENT_SERVICE_BILLING_MODELS,
  clientServiceOptionLabel,
} from '@/features/finance/constants/client-services';
import type { ClientServiceRecord } from '@/lib/api/client-services';
import { KanbanCardShell } from '@/components/shared';
import { cn } from '@/lib/utils';
import { ClientServiceStageBadge } from './ClientServiceStageBadge';

interface ClientServiceCardProps {
  service: ClientServiceRecord;
  onOpen: (service: ClientServiceRecord) => void;
}

function formatShortDate(value: string | null): string {
  if (!value) return 'No renewal date';
  return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: '2-digit' }).format(
    new Date(value),
  );
}

export function ClientServiceCard({ service, onOpen }: ClientServiceCardProps) {
  const billingLabel = clientServiceOptionLabel(
    CLIENT_SERVICE_BILLING_MODELS,
    service.billingModel,
  );

  return (
    <KanbanCardShell
      padding="none"
      className={cn('relative', service.overdue && 'border-red-300 dark:border-red-900/50')}
    >
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'focus-visible:ring-ring block cursor-pointer space-y-2 rounded-xl p-3 transition-shadow hover:shadow-sm focus-visible:ring-2 focus-visible:outline-none',
          service.overdue && 'bg-red-50/60 dark:bg-red-950/20',
        )}
        onClick={() => onOpen(service)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpen(service);
          }
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-muted-foreground text-xs font-medium">{billingLabel}</span>
          <ClientServiceStageBadge service={service} />
        </div>

        <p className="line-clamp-2 text-sm font-medium">{service.name}</p>

        <p className="text-sm font-bold tabular-nums">
          {service.ourCost ? formatAmount(Number(service.ourCost)) : '—'}
        </p>

        <div className="text-muted-foreground flex items-center gap-1 text-xs">
          <FolderKanban size={10} aria-hidden />
          <span className="truncate">{service.project.name}</span>
        </div>

        <div className="text-muted-foreground flex items-center gap-1 text-xs">
          <CalendarClock size={10} aria-hidden />
          {formatShortDate(service.renewalDate)}
        </div>
      </div>
    </KanbanCardShell>
  );
}
