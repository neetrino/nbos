'use client';

import { useTranslations } from 'next-intl';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { StatusBadge } from '@/components/shared';
import { UNIT_SUM_EMPTY } from '@/features/my-company/delivery-norms/format-unit-sum';
import { NormsCatalogCard } from '@/features/my-company/delivery-norms/norms-catalog-card';
import { CatalogFunctionIcon } from './catalog-icon';
import { CATALOG_ICON_SIZE_PX } from './function-catalog.constants';

const ICON_SHELL_CLASS =
  'bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg';

export function BrowseFunctionCard({
  item,
  unitsLabel,
  salePriceLabel,
  showStatus,
  statusLabel,
  onOpen,
}: {
  item: DeliveryFunctionOperationalDto;
  unitsLabel?: string;
  salePriceLabel?: string;
  showStatus: boolean;
  statusLabel: string;
  onOpen: (id: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <NormsCatalogCard
      title={item.title}
      icon={
        <span className={ICON_SHELL_CLASS}>
          <CatalogFunctionIcon iconKey={item.iconKey} size={CATALOG_ICON_SIZE_PX} />
        </span>
      }
      unitsLabel={unitsLabel ?? UNIT_SUM_EMPTY}
      salePriceLabel={salePriceLabel ?? null}
      includedLabel={null}
      salesCaption={t('cards.sales')}
      unitsCaption={t('cards.units')}
      includedCaption={t('cards.included')}
      status={null}
      statusLabel={null}
      badge={showStatus ? <StatusBadge label={statusLabel} /> : null}
      canOpen
      onOpen={() => onOpen(item.id)}
    />
  );
}
