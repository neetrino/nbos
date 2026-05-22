'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { EntityDetailSheetContent, StatusBadge } from '@/components/shared';
import { Sheet, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DetailSheetSection } from '@/components/shared/DetailSheetSection';
import { BonusPoolEmployeeBreakdown } from '@/features/finance/components/bonus/bonus-pool-employee-breakdown';
import { BonusPoolFillBar } from '@/features/finance/components/bonus/bonus-pool-fill-bar';
import { bonusBoardHref } from '@/features/finance/constants/bonus-board-url';
import {
  bonusPoolFundingHealthUi,
  resolveRowFundingHealth,
} from '@/features/finance/constants/bonus-pool-funding-health-ui';
import {
  bonusPoolHasOverFunding,
  bonusPoolSheetStatusUi,
} from '@/features/finance/constants/bonus-pool-status-ui';
import {
  bonusPoolKindLabel,
  bonusPoolOrderCodesLabel,
  bonusPoolScopeTitle,
} from '@/features/finance/utils/bonus-pool-display';
import { formatBonusPoolMoney } from '@/features/finance/utils/bonus-pool-amount';
import { getApiErrorMessage } from '@/lib/api-errors';
import { bonusesApi, type BonusPoolEmployeeLine, type BonusProductPoolRow } from '@/lib/api/bonus';

function PoolMoneyGrid({ pool }: { pool: BonusProductPoolRow }) {
  const items = [
    { label: 'Received', value: pool.ledgerReceivedAmount },
    { label: 'Planned bonuses', value: pool.ledgerPlannedAmount },
    { label: 'Released', value: pool.ledgerReleasedAmount },
    { label: 'Paid', value: pool.sumPaidAmount },
    { label: 'Remaining', value: pool.ledgerRemainingAmount },
    { label: 'Available', value: pool.ledgerAvailableFunding },
    { label: 'Over funding', value: pool.ledgerOverFundingAmount },
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      {items.map((item) => (
        <div key={item.label} className="contents">
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd className="text-right font-medium tabular-nums">
            {formatBonusPoolMoney(item.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ProductBonusPoolSheet({
  pool,
  open,
  onOpenChange,
}: {
  pool: BonusProductPoolRow | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const [lines, setLines] = useState<BonusPoolEmployeeLine[]>([]);
  const [orderCodes, setOrderCodes] = useState<string[]>([]);
  const [linesLoading, setLinesLoading] = useState(false);
  const [linesError, setLinesError] = useState<string | null>(null);

  const loadLines = useCallback(async (poolKey: string) => {
    setLinesLoading(true);
    setLinesError(null);
    try {
      const data = await bonusesApi.getProductPoolEmployeeLines(poolKey);
      setLines(data.lines);
      setOrderCodes(data.orderCodes);
    } catch (caught) {
      setLines([]);
      setOrderCodes([]);
      setLinesError(getApiErrorMessage(caught, 'Employee breakdown could not be loaded.'));
    } finally {
      setLinesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !pool) {
      setLines([]);
      setOrderCodes([]);
      setLinesError(null);
      return;
    }
    void loadLines(pool.poolKey);
  }, [loadLines, open, pool]);

  const ledgerUi = pool ? bonusPoolSheetStatusUi(pool) : null;
  const fundingUi = pool ? bonusPoolFundingHealthUi(resolveRowFundingHealth(pool)) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent open={open} layout="auxiliary" className="gap-0">
        <SheetHeader>
          <SheetTitle>{pool ? bonusPoolScopeTitle(pool) : 'Product bonus pool'}</SheetTitle>
          <SheetDescription>
            {pool
              ? `${bonusPoolKindLabel(pool.poolKind)} · ${pool.projectCode} · ${bonusPoolOrderCodesLabel(pool)}`
              : 'Select a pool to inspect funding and employee bonuses.'}
          </SheetDescription>
        </SheetHeader>

        {pool ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6">
            <DetailSheetSection title="Pool funding">
              <div className="flex flex-wrap items-center gap-2">
                {fundingUi ? (
                  <StatusBadge label={fundingUi.label} variant={fundingUi.variant} />
                ) : null}
                {ledgerUi ? (
                  <StatusBadge label={ledgerUi.label} variant={ledgerUi.variant} />
                ) : null}
                <span className="text-muted-foreground text-xs tabular-nums">
                  {pool.employeeCount} people · {pool.entryCount} entries
                </span>
              </div>
              <div className="mt-3">
                <BonusPoolFillBar row={pool} />
              </div>
              <div className="mt-4">
                <PoolMoneyGrid pool={pool} />
              </div>
              {bonusPoolHasOverFunding(pool) ? (
                <p className="text-destructive mt-3 text-xs">
                  Released bonuses exceed client money received — review before payroll attach.
                </p>
              ) : null}
            </DetailSheetSection>

            <DetailSheetSection title="Scope">
              <p className="text-muted-foreground font-mono text-xs">{pool.poolKey}</p>
              <p className="text-muted-foreground mt-2 text-xs">
                Orders:{' '}
                <span className="text-foreground font-mono font-medium">
                  {(orderCodes.length > 0 ? orderCodes : pool.orderCodes).join(', ') ||
                    pool.orderCode}
                </span>
              </p>
              <Link
                href={`/projects/${pool.projectId}`}
                className="text-primary mt-3 inline-block text-sm font-medium hover:underline"
              >
                {pool.projectCode} · {pool.projectName}
              </Link>
              <Link
                href={bonusBoardHref(pool.projectId)}
                className="text-primary mt-2 block text-sm font-medium hover:underline"
              >
                Open bonus board (this project)
              </Link>
            </DetailSheetSection>

            <DetailSheetSection title="By employee">
              <p className="text-muted-foreground mb-3 text-xs">
                Planned vs released vs paid per person. Suggested release uses available pool
                funding proportionally (policy engine will refine KPI / cap / carry-over).
              </p>
              <BonusPoolEmployeeBreakdown lines={lines} loading={linesLoading} error={linesError} />
            </DetailSheetSection>
          </div>
        ) : null}
      </EntityDetailSheetContent>
    </Sheet>
  );
}
