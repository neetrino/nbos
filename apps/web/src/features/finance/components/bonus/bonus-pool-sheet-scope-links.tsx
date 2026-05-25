'use client';

import Link from 'next/link';
import { ChevronRight, FolderKanban, Hash, Package } from 'lucide-react';
import { bonusPoolKindLabel } from '@/features/finance/utils/bonus-pool-display';
import {
  bonusPoolScopeEntityHref,
  parseBonusPoolKey,
} from '@/features/finance/utils/bonus-pool-key';
import type { BonusProductPoolRow } from '@/lib/api/bonus';
import { cn } from '@/lib/utils';

function ScopeLinkRow({
  icon: Icon,
  label,
  title,
  href,
}: {
  icon: typeof Package;
  label: string;
  title: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'border-border bg-muted/20 hover:bg-muted/40 group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors',
      )}
    >
      <div className="bg-muted text-muted-foreground group-hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
        <Icon size={14} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
          {label}
        </p>
        <p className="text-foreground truncate text-sm font-medium">{title}</p>
      </div>
      <ChevronRight
        size={14}
        className="text-muted-foreground shrink-0 opacity-60 group-hover:opacity-100"
        aria-hidden
      />
    </Link>
  );
}

export function BonusPoolSheetScopeLinks({
  pool,
  orderCodes,
}: {
  pool: BonusProductPoolRow;
  orderCodes: string[];
}) {
  const parsed = parseBonusPoolKey(pool.poolKey);
  const codes =
    orderCodes.length > 0
      ? orderCodes
      : pool.orderCodes.length > 0
        ? pool.orderCodes
        : [pool.orderCode];
  const orderIds = pool.orderIds.length > 0 ? pool.orderIds : [pool.anchorOrderId];

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Scope</p>
      <div className="space-y-2">
        {parsed ? (
          <ScopeLinkRow
            icon={Package}
            label={bonusPoolKindLabel(pool.poolKind)}
            title={pool.poolName}
            href={bonusPoolScopeEntityHref(pool, parsed)}
          />
        ) : null}
        <ScopeLinkRow
          icon={FolderKanban}
          label="Project"
          title={`${pool.projectCode} · ${pool.projectName}`}
          href={`/projects/${pool.projectId}`}
        />
        {codes.map((code, index) => (
          <ScopeLinkRow
            key={`${orderIds[index] ?? code}-${code}`}
            icon={Hash}
            label={codes.length === 1 ? 'Order' : `Order ${index + 1}`}
            title={code}
            href="/finance/orders"
          />
        ))}
      </div>
    </div>
  );
}
