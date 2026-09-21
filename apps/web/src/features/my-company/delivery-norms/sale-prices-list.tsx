'use client';

import { useTranslations } from 'next-intl';
import type { SalePriceVersionDto } from '@/lib/api/delivery-catalog-structure';
import { EntityListAmount } from '@/components/shared';
import { deliveryCatalogStructureApi } from '@/lib/api/delivery-catalog-structure';
import { DeliveryNormsRecordRow } from './delivery-norms-record-row';
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
    <ul className="space-y-3">
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
    <DeliveryNormsRecordRow>
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
      <SalePriceSummary row={row} />
    </DeliveryNormsRecordRow>
  );
}

function SalePriceSummary({ row }: { row: SalePriceVersionDto }) {
  const t = useTranslations('hr.deliveryNorms');
  if (row.fixedAmount !== null) {
    return (
      <p className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs leading-relaxed">
        <span>{t('salePrices.sourceFixed')}:</span>
        <EntityListAmount amount={row.fixedAmount} currency={row.currency} className="text-xs" />
      </p>
    );
  }
  if (row.multiplier !== null) {
    return (
      <p className="text-muted-foreground text-xs leading-relaxed">
        {t('salePrices.sourceMultiplier')}: {row.multiplier}
      </p>
    );
  }
  return (
    <p className="text-muted-foreground text-xs leading-relaxed">{t('salePrices.sourceDefault')}</p>
  );
}
