'use client';

import type { DomainHeaderStatusKind, DomainHeaderTone } from '@nbos/shared';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClientServicesT } from '@/features/finance/components/client-services/client-service-message-keys';
import { cn } from '@/lib/utils';
import type { ClientServiceRecord } from '@/lib/api/client-services';
import {
  primaryDomainName,
  productDomainHeaderKind,
  productDomainHeaderNeedsAction,
  productDomainHeaderTone,
} from './map-domain-header-status';

const TONE_CLASS: Record<DomainHeaderTone, string> = {
  idle: 'border-sky-300 bg-sky-100 text-sky-800 hover:bg-sky-200/80 dark:border-sky-700 dark:bg-sky-950/50 dark:text-sky-200 dark:hover:bg-sky-950/70',
  progress:
    'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/55',
  done: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/55',
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
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn('max-w-[240px] px-2.5 font-medium', TONE_CLASS[productDomainHeaderTone(rows)])}
    >
      <Globe aria-hidden />
      <span className="truncate">
        {label}
        {suffix}
      </span>
    </Button>
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
