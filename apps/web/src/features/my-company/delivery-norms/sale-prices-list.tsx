'use client';

import { useTranslations } from 'next-intl';
import type { SalePriceVersionDto } from '@/lib/api/delivery-catalog-structure';
import { EntityListAmount } from '@/components/shared';
import { deliveryCatalogStructureApi } from '@/lib/api/delivery-catalog-structure';
import { DeliveryNormsRecordRow } from './delivery-norms-record-row';
import {
  GROUP_HEADING_CLASS,
  NORMS_LIST_GRID_CLASS,
  PROFILE_VERSION_PREFIX,
} from './delivery-norms.constants';
import { type SalePriceKindGroup, type SalePriceTargetKind } from './sale-price-draft';
import { NormativeStatusBadge, normativeStatusLabelKey } from './normative-status-badge';
import { PublishDraftButton } from './publish-draft-button';

export function SalePricesList({
  groups,
  labels,
  kindLabels,
  canPublish,
  onPublished,
  onError,
}: {
  groups: SalePriceKindGroup[];
  labels: Map<string, string>;
  kindLabels: Record<SalePriceTargetKind, string>;
  canPublish: boolean;
  onPublished: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  if (groups.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('salePrices.allEmpty')}</p>;
  }
  return (
    <div className="space-y-6">
      {groups.map((kindGroup) => (
        <section key={kindGroup.kind} className="space-y-3">
          <h4 className={GROUP_HEADING_CLASS}>{kindLabels[kindGroup.kind]}</h4>
          <div className={NORMS_LIST_GRID_CLASS}>
            {kindGroup.groups.map((group) => (
              <ul key={group.targetKey} className="space-y-3">
                {group.rows.map((row) => (
                  <SalePriceRow
                    key={row.id}
                    title={targetTitle(group.targetKey, labels, t)}
                    row={row}
                    canPublish={canPublish}
                    onPublished={onPublished}
                    onError={onError}
                  />
                ))}
              </ul>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function targetTitle(
  targetKey: string,
  labels: Map<string, string>,
  t: ReturnType<typeof useTranslations<'hr.deliveryNorms'>>,
): string {
  return labels.get(targetKey) ?? t('salePrices.unknownTarget');
}

function SalePriceRow({
  title,
  row,
  canPublish,
  onPublished,
  onError,
}: {
  title: string;
  row: SalePriceVersionDto;
  canPublish: boolean;
  onPublished: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <DeliveryNormsRecordRow>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-foreground text-sm font-semibold">{title}</p>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground text-xs">
            {PROFILE_VERSION_PREFIX}
            {row.version}
          </p>
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
  if (row.amountPerUnit === null) {
    return null;
  }
  return (
    <p className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs leading-relaxed">
      <span>{t('salePrices.amountPerUnitShort')}:</span>
      <EntityListAmount amount={row.amountPerUnit} currency={row.currency} className="text-xs" />
    </p>
  );
}
