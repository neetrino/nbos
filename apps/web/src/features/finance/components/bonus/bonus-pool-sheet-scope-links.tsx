'use client';

import { FolderKanban, Hash, Package } from 'lucide-react';
import { DETAIL_SHEET_SECTION_TITLE_CLASS, DetailSheetEntityLinkCard } from '@/components/shared';
import { bonusPoolKindLabel } from '@/features/finance/utils/bonus-pool-display';
import {
  bonusPoolScopeEntityHref,
  parseBonusPoolKey,
} from '@/features/finance/utils/bonus-pool-key';
import type { BonusProductPoolRow } from '@/lib/api/bonus';
import { cn } from '@/lib/utils';

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
      <p className={cn(DETAIL_SHEET_SECTION_TITLE_CLASS, 'mb-0')}>Scope</p>
      <div className="space-y-2">
        {parsed ? (
          <DetailSheetEntityLinkCard
            icon={Package}
            label={bonusPoolKindLabel(pool.poolKind)}
            title={pool.poolName}
            href={bonusPoolScopeEntityHref(pool, parsed)}
          />
        ) : null}
        <DetailSheetEntityLinkCard
          icon={FolderKanban}
          label="Project"
          title={`${pool.projectCode} · ${pool.projectName}`}
          href={`/projects/${pool.projectId}`}
        />
        {codes.map((code, index) => (
          <DetailSheetEntityLinkCard
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
