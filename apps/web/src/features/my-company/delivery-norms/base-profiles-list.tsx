'use client';

import { useTranslations } from 'next-intl';
import type { DeliveryBaseProfileFinancialDto } from '@nbos/shared';
import { BaseProfileCard } from './base-profile-card';
import { dictionariesForProfileLabel } from './base-profile-label';
import { NORMS_CARD_GRID_CLASS } from './delivery-norms.constants';

export function BaseProfilesList({
  rows,
  canPublish,
  onPublished,
  onError,
}: {
  rows: DeliveryBaseProfileFinancialDto[];
  canPublish: boolean;
  onPublished: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const dictionaries = dictionariesForProfileLabel(t);
  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('profiles.empty')}</p>;
  }
  return (
    <ul className={NORMS_CARD_GRID_CLASS}>
      {rows.map((row) => (
        <BaseProfileCard
          key={row.id}
          row={row}
          dictionaries={dictionaries}
          canPublish={canPublish}
          onPublished={onPublished}
          onError={onError}
        />
      ))}
    </ul>
  );
}
