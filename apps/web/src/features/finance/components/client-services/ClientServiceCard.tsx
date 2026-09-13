'use client';

import type { KeyboardEvent, ReactNode } from 'react';
import { Calendar, FolderKanban } from 'lucide-react';
import { KanbanCardShell, StatusBadge } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  CLIENT_SERVICE_BILLING_MODELS,
  clientServiceOptionLabel,
} from '@/features/finance/constants/client-services';
import { parseMoneyAmount } from '@/lib/format/money';
import type { ClientServiceRecord } from '@/lib/api/client-services';
import { cn } from '@/lib/utils';
import { isClientServiceDomain } from '@/features/finance/constants/client-service-registry';
import { ClientServiceRegistryBadge } from './ClientServiceRegistryBadge';
import { ClientServiceRegistryCheckButton } from './ClientServiceRegistryCheckButton';
import { ClientServiceStageBadge } from './ClientServiceStageBadge';
import { translateClientServiceBilling, useClientServicesT } from './client-service-message-keys';
import { useLocale } from 'next-intl';

interface ClientServiceCardProps {
  service: ClientServiceRecord;
  onOpen: (service: ClientServiceRecord) => void;
}

function formatShortDate(value: string | null, locale: string, emptyLabel: string): string {
  if (!value) return emptyLabel;
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: '2-digit' }).format(
    new Date(value),
  );
}

/** Kanban card — invoice/orders shell; original client-service fields preserved. */
export function ClientServiceCard({ service, onOpen }: ClientServiceCardProps) {
  const t = useClientServicesT();
  const locale = useLocale();
  const billingLabel = translateClientServiceBilling(
    t,
    service.billingModel,
    clientServiceOptionLabel(CLIENT_SERVICE_BILLING_MODELS, service.billingModel),
  );
  const amountLabel = service.ourCost ? formatAmount(parseMoneyAmount(service.ourCost)) : '—';

  return (
    <KanbanCardShell
      as="article"
      radius="xl"
      padding="none"
      baseShadow="sm"
      hoverShadow="md"
      className={cn(service.overdue && 'border-red-300 dark:border-red-900/50')}
    >
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'cursor-pointer space-y-3 rounded-xl p-4',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
          service.overdue && 'bg-red-50/60 dark:bg-red-950/20',
        )}
        onClick={() => onOpen(service)}
        onKeyDown={(event) => handleCardKeyDown(event, service, onOpen)}
      >
        <div className="flex min-w-0 items-start justify-between gap-2">
          <p className="text-foreground min-w-0 truncate text-sm leading-snug font-bold">
            {service.name}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            {isClientServiceDomain(service) ? (
              <ClientServiceRegistryBadge status={service.registryLookupStatus} />
            ) : null}
            {service.overdue ? (
              <ClientServiceStageBadge service={service} className="shrink-0" />
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-foreground min-w-0 truncate text-xl leading-none font-bold tabular-nums">
            {amountLabel}
          </p>
          <StatusBadge
            label={billingLabel}
            variant="blue"
            className="shrink-0 rounded-full px-2.5 text-[10px] font-semibold tracking-wide"
          />
        </div>

        <div className="border-border flex flex-col gap-2.5 border-t pt-3">
          <MetaRow
            icon={<Calendar size={14} aria-hidden />}
            iconClassName="bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400"
            labelClassName={
              service.renewalDate ? 'font-bold text-orange-500 dark:text-orange-400' : undefined
            }
            label={formatShortDate(service.renewalDate, locale, t('card.noRenewal'))}
            trailing={
              isClientServiceDomain(service) ? (
                <ClientServiceRegistryCheckButton serviceId={service.id} compact />
              ) : null
            }
          />
          <MetaRow
            icon={<FolderKanban size={14} aria-hidden />}
            iconClassName="bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
            label={service.project.name}
          />
        </div>
      </div>
    </KanbanCardShell>
  );
}

function MetaRow({
  icon,
  iconClassName,
  label,
  labelClassName,
  trailing,
}: {
  icon: ReactNode;
  iconClassName: string;
  label: string;
  labelClassName?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-x-2.5">
      <span
        className={cn(
          'flex size-7 items-center justify-center justify-self-start rounded-lg',
          iconClassName,
        )}
      >
        {icon}
      </span>
      <p className={cn('text-foreground/80 truncate text-xs', labelClassName)}>{label}</p>
      {trailing}
    </div>
  );
}

function handleCardKeyDown(
  event: KeyboardEvent<HTMLDivElement>,
  service: ClientServiceRecord,
  onOpen: (service: ClientServiceRecord) => void,
): void {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  onOpen(service);
}
