'use client';

import { useTranslations } from 'next-intl';
import { ENTITY_LIST_HEAD_CLASS, ENTITY_LIST_SHELL_CLASS } from '@/components/shared';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SALE_PRICE_PENDING_COLUMN_CLASS } from './sale-price-pending-cell';
import type { LiveSalePrice } from './live-sale-prices';
import { UNIT_SUM_EMPTY } from './format-unit-sum';
import { SalePriceLiveRow } from './sale-price-row';

export function SalePricesTable({
  pairs,
  labels,
  unitTotals,
  canPublish,
  onChanged,
  onError,
}: {
  pairs: LiveSalePrice[];
  labels: Map<string, string>;
  unitTotals: Map<string, string>;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  if (pairs.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('salePrices.empty')}</p>;
  }
  return (
    <div className={ENTITY_LIST_SHELL_CLASS}>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('salePrices.pickTarget')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('salePrices.units')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>
              {t('salePrices.amountPerUnitShort')}
            </TableHead>
            <TableHead className={`${ENTITY_LIST_HEAD_CLASS} ${SALE_PRICE_PENDING_COLUMN_CLASS}`}>
              {t('salePrices.pending')}
            </TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('columns.version')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('columns.status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pairs.map((pair) => (
            <SalePriceLiveRow
              key={pair.targetKey}
              pair={pair}
              title={labels.get(pair.targetKey) ?? t('salePrices.unknownTarget')}
              unitsLabel={unitTotals.get(pair.targetKey) ?? UNIT_SUM_EMPTY}
              canPublish={canPublish}
              onChanged={onChanged}
              onError={onError}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
