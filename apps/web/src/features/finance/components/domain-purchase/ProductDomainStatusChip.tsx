'use client';

import type { DomainHeaderStatusKind } from '@nbos/shared';
import { useClientServicesT } from '@/features/finance/components/client-services/client-service-message-keys';
import { cn } from '@/lib/utils';
import type { ClientServiceRecord } from '@/lib/api/client-services';
import {
  primaryDomainName,
  productDomainHeaderKind,
  productDomainHeaderNeedsAction,
} from './map-domain-header-status';

const CHIP_TONE: Record<DomainHeaderStatusKind, string> = {
  empty: 'border-border bg-background text-foreground',
  preparing:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200',
  awaiting_payment:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200',
  purchased:
    'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-200',
  connected:
    'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200',
  client_dns:
    'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900/70 dark:bg-teal-950/30 dark:text-teal-200',
  multiple: 'border-border bg-muted/50 text-foreground',
};

interface ProductDomainStatusChipProps {
  rows: readonly ClientServiceRecord[];
  onClick: () => void;
}

export function ProductDomainStatusChip({ rows, onClick }: ProductDomainStatusChipProps) {
  const t = useClientServicesT();
  const kind = productDomainHeaderKind(rows);
  const domain = primaryDomainName(rows);
  const needsAction = kind === 'multiple' && productDomainHeaderNeedsAction(rows);
  const label = chipLabel(kind, domain, rows.length, t);
  const suffix = needsAction ? ` · ${t('domainPurchase.headerNeedsAction')}` : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex max-w-[240px] shrink-0 truncate rounded-full border px-2.5 py-0.5 text-left text-[11px] font-medium tracking-tight',
        CHIP_TONE[kind],
      )}
    >
      {label}
      {suffix}
    </button>
  );
}

function chipLabel(
  kind: DomainHeaderStatusKind,
  domain: string,
  count: number,
  t: ReturnType<typeof useClientServicesT>,
): string {
  if (kind === 'empty') return t('domainPurchase.headerEmpty');
  if (kind === 'preparing') return t('domainPurchase.headerPreparing');
  if (kind === 'awaiting_payment') return t('domainPurchase.headerAwaiting');
  if (kind === 'purchased') return t('domainPurchase.headerPurchased', { domain });
  if (kind === 'connected') return t('domainPurchase.headerConnected', { domain });
  if (kind === 'client_dns') return t('domainPurchase.headerDns', { domain });
  return t('domainPurchase.headerMultiple', { count });
}
