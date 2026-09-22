'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DeliveryRoleRateFinancialDto } from '@nbos/shared';
import { DeliveryNormsSectionCard } from './delivery-norms-section-card';
import { DeliveryNormsSectionToolbar } from './delivery-norms-section-toolbar';
import { ROLE_MESSAGE_KEYS } from './delivery-norms.constants';
import { displayedRoleRate, liveRoleRates } from './live-role-rates';
import { itemsMatchingSearch } from './matches-norm-search';
import { RoleRatesTable } from './role-rates-table';

type RoleRatesSectionProps = {
  rows: DeliveryRoleRateFinancialDto[];
  canAdd: boolean;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
  embedded?: boolean;
};

export function RoleRatesSection({
  rows,
  canAdd,
  canPublish,
  onChanged,
  onError,
  embedded = false,
}: RoleRatesSectionProps) {
  const t = useTranslations('hr.deliveryNorms');
  const [query, setQuery] = useState('');
  const pairs = useMemo(() => liveRoleRates(rows), [rows]);
  const filtered = useMemo(
    () =>
      itemsMatchingSearch(pairs, query, (pair) => [
        t(ROLE_MESSAGE_KEYS[pair.roleKey]),
        displayedRoleRate(pair) ?? '',
        pair.draft?.status ?? pair.published?.status ?? '',
      ]),
    [pairs, query, t],
  );

  return (
    <DeliveryNormsSectionCard
      title={embedded ? undefined : t('rates.title')}
      description={embedded ? undefined : t('rates.subtitle')}
    >
      <DeliveryNormsSectionToolbar
        query={query}
        onQueryChange={setQuery}
        searchLabel={t('search.label')}
        searchPlaceholder={t('search.placeholder')}
      />
      {query.trim() !== '' && filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('search.empty')}</p>
      ) : (
        <RoleRatesTable
          pairs={filtered}
          canAdd={canAdd}
          canPublish={canPublish}
          onChanged={onChanged}
          onError={onError}
        />
      )}
    </DeliveryNormsSectionCard>
  );
}
