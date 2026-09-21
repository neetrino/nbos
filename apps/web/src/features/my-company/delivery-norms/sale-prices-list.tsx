'use client';

import { useTranslations } from 'next-intl';
import type { SalePriceVersionDto } from '@/lib/api/delivery-catalog-structure';
import { deliveryCatalogStructureApi } from '@/lib/api/delivery-catalog-structure';
import { NormativeStatusBadge, normativeStatusLabelKey } from './normative-status-badge';
import { PublishDraftButton } from './publish-draft-button';

export function SalePricesList({
  rows,
  canPublish,
  onPublished,
  onError,
}: {
  rows: SalePriceVersionDto[];
  canPublish: boolean;
  onPublished: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('salePrices.empty')}</p>;
  }
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <SalePriceRow
          key={row.id}
          row={row}
          canPublish={canPublish}
          onPublished={onPublished}
          onError={onError}
        />
      ))}
    </ul>
  );
}

function SalePriceRow({
  row,
  canPublish,
  onPublished,
  onError,
}: {
  row: SalePriceVersionDto;
  canPublish: boolean;
  onPublished: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <li className="border-border space-y-2 rounded-xl border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          {t('columns.version')} {row.version}
        </p>
        <div className="flex items-center gap-2">
          <NormativeStatusBadge
            status={row.status}
            label={t(normativeStatusLabelKey(row.status))}
          />
          {row.status === 'DRAFT' && canPublish ? (
            <PublishDraftButton
              onPublish={async () => {
                await deliveryCatalogStructureApi.publishSalePrice(row.id);
              }}
              onError={onError}
              onPublished={onPublished}
            />
          ) : null}
        </div>
      </div>
      <p className="text-muted-foreground text-xs">{salePriceSummary(row, t)}</p>
    </li>
  );
}

function salePriceSummary(
  row: SalePriceVersionDto,
  t: ReturnType<typeof useTranslations<'hr.deliveryNorms'>>,
): string {
  if (row.fixedAmount !== null) {
    return `${t('salePrices.sourceFixed')}: ${row.fixedAmount} ${row.currency}`;
  }
  if (row.multiplier !== null) {
    return `${t('salePrices.sourceMultiplier')}: ${row.multiplier}`;
  }
  return t('salePrices.sourceDefault');
}
