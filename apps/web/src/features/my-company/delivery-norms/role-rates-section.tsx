'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DeliveryRoleRateFinancialDto } from '@nbos/shared';
import { DeliveryNormsSectionCard } from './delivery-norms-section-card';
import { DeliveryNormsSectionToolbar } from './delivery-norms-section-toolbar';
import { ROLE_MESSAGE_KEYS } from './delivery-norms.constants';
import { itemsMatchingSearch } from './matches-norm-search';
import { RoleRateCreateSheet } from './role-rate-create-sheet';
import { RoleRatesTable } from './role-rates-table';

export function RoleRatesSection({
  rows,
  canAdd,
  canPublish,
  onChanged,
  onError,
  embedded = false,
}: {
  rows: DeliveryRoleRateFinancialDto[];
  canAdd: boolean;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
  embedded?: boolean;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const filtered = useMemo(
    () =>
      itemsMatchingSearch(rows, query, (row) => [
        t(ROLE_MESSAGE_KEYS[row.roleKey]),
        row.rate,
        row.status,
      ]),
    [query, rows, t],
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
        addLabel={t('add')}
        canAdd={canAdd}
        onAdd={() => setOpen(true)}
      />
      {canAdd ? (
        <RoleRateCreateSheet
          open={open}
          rows={rows}
          onOpenChange={setOpen}
          onCreated={onChanged}
          onError={onError}
        />
      ) : null}
      {query.trim() !== '' && filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('search.empty')}</p>
      ) : (
        <RoleRatesTable
          rows={filtered}
          canPublish={canPublish}
          onPublished={onChanged}
          onError={onError}
        />
      )}
    </DeliveryNormsSectionCard>
  );
}
