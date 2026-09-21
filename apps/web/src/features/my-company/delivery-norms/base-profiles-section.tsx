'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DeliveryBaseProfileFinancialDto, DeliveryFunctionOperationalDto } from '@nbos/shared';
import { BaseProfileCreateSheet } from './base-profile-create-sheet';
import { BaseProfilesList } from './base-profiles-list';
import {
  dictionariesForProfileLabel,
  formatBaseProfileLabel,
  parseProfileKey,
} from './base-profile-label';
import { DeliveryNormsSectionCard } from './delivery-norms-section-card';
import { DeliveryNormsSectionToolbar } from './delivery-norms-section-toolbar';
import { itemsMatchingSearch } from './matches-norm-search';

export function BaseProfilesSection({
  rows,
  catalog,
  canAdd,
  canPublish,
  onChanged,
  onError,
  embedded = false,
}: {
  rows: DeliveryBaseProfileFinancialDto[];
  catalog: DeliveryFunctionOperationalDto[];
  canAdd: boolean;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
  embedded?: boolean;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const dictionaries = dictionariesForProfileLabel(t);
  const filtered = useMemo(
    () =>
      itemsMatchingSearch(
        rows.filter((row) => parseProfileKey(row.profileKey).productType !== 'MOBILE_APP'),
        query,
        (row) => [
          formatBaseProfileLabel(row.profileKey, row.version, dictionaries),
          row.profileKey,
          row.status,
        ],
      ),
    [dictionaries, query, rows],
  );

  return (
    <DeliveryNormsSectionCard
      title={embedded ? undefined : t('profiles.title')}
      description={embedded ? undefined : t('profiles.subtitle')}
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
        <BaseProfileCreateSheet
          open={open}
          catalog={catalog}
          onOpenChange={setOpen}
          onCreated={onChanged}
          onError={onError}
        />
      ) : null}
      {query.trim() !== '' && filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('search.empty')}</p>
      ) : (
        <BaseProfilesList
          rows={filtered}
          canPublish={canPublish}
          onPublished={onChanged}
          onError={onError}
        />
      )}
    </DeliveryNormsSectionCard>
  );
}
