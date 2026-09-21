'use client';

import { useTranslations } from 'next-intl';
import type { DeliveryBaseProfileFinancialDto, DeliveryFunctionOperationalDto } from '@nbos/shared';
import { dictionariesForProfileLabel } from './base-profile-label';
import { WORKSPACE_SPLIT_CLASS } from './delivery-norms.constants';
import { DeliveryNormsKindRail } from './delivery-norms-kind-rail';
import { DeliveryNormsSectionCard } from './delivery-norms-section-card';
import { FunctionCollectionKindEditor } from './function-collection-kind-editor';
import { useProfileKindSelection } from './use-profile-kind-selection';

export function FunctionCollectionsSection({
  rows,
  catalog,
  canEdit,
  onError,
  embedded = false,
}: {
  rows: DeliveryBaseProfileFinancialDto[];
  catalog: DeliveryFunctionOperationalDto[];
  canEdit: boolean;
  onError: (message: string) => void;
  embedded?: boolean;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const dictionaries = dictionariesForProfileLabel(t);
  const selection = useProfileKindSelection(rows, dictionaries);

  return (
    <DeliveryNormsSectionCard
      title={embedded ? undefined : t('collections.title')}
      description={embedded ? undefined : t('collections.subtitle')}
    >
      <p className="text-muted-foreground text-xs">{t('collections.hint')}</p>
      {selection.groups.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('collections.emptyProfiles')}</p>
      ) : (
        <div className={WORKSPACE_SPLIT_CLASS}>
          <DeliveryNormsKindRail
            options={selection.visibleGroups.map((group) => ({
              id: group.kindId,
              title: group.title,
            }))}
            selectedId={selection.resolvedKindId}
            query={selection.query}
            emptySearch={selection.query.trim() !== '' && selection.visibleGroups.length === 0}
            emptySearchLabel={t('collections.emptySearch')}
            searchLabel={t('search.label')}
            searchPlaceholder={t('search.placeholder')}
            onQueryChange={selection.setQuery}
            onSelect={selection.setKindId}
          />
          {selection.selectedGroup?.productType ? (
            <FunctionCollectionKindEditor
              key={selection.selectedGroup.productType}
              productType={selection.selectedGroup.productType}
              catalog={catalog}
              canEdit={canEdit}
              onError={onError}
            />
          ) : (
            <p className="text-muted-foreground text-sm">{t('collections.unknownKind')}</p>
          )}
        </div>
      )}
    </DeliveryNormsSectionCard>
  );
}
