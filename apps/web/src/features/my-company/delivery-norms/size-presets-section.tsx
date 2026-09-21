'use client';

import { useTranslations } from 'next-intl';
import type { DeliveryBaseProfileFinancialDto, DeliveryFunctionOperationalDto } from '@nbos/shared';
import { dictionariesForProfileLabel } from './base-profile-label';
import { WORKSPACE_SPLIT_CLASS } from './delivery-norms.constants';
import { DeliveryNormsKindRail } from './delivery-norms-kind-rail';
import { DeliveryNormsSectionCard } from './delivery-norms-section-card';
import { SizePresetKindEditor } from './size-preset-kind-editor';
import { useProfileKindSelection } from './use-profile-kind-selection';

export function SizePresetsSection({
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
      title={embedded ? undefined : t('sizePresets.title')}
      description={embedded ? undefined : t('sizePresets.subtitle')}
    >
      <p className="text-muted-foreground text-xs">{t('sizePresets.hint')}</p>
      {selection.groups.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('sizePresets.emptyProfiles')}</p>
      ) : (
        <SizePresetsWorkspace
          selection={selection}
          catalog={catalog}
          canEdit={canEdit}
          onError={onError}
        />
      )}
    </DeliveryNormsSectionCard>
  );
}

function SizePresetsWorkspace({
  selection,
  catalog,
  canEdit,
  onError,
}: {
  selection: ReturnType<typeof useProfileKindSelection>;
  catalog: DeliveryFunctionOperationalDto[];
  canEdit: boolean;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <div className={WORKSPACE_SPLIT_CLASS}>
      <DeliveryNormsKindRail
        options={selection.visibleGroups.map((group) => ({
          id: group.kindId,
          title: group.title,
          subtitle: t('sizePresets.sizeCount', { count: group.rows.length }),
        }))}
        selectedId={selection.resolvedKindId}
        query={selection.query}
        emptySearch={selection.query.trim() !== '' && selection.visibleGroups.length === 0}
        emptySearchLabel={t('sizePresets.emptySearch')}
        searchLabel={t('search.label')}
        searchPlaceholder={t('search.placeholder')}
        onQueryChange={selection.setQuery}
        onSelect={selection.setKindId}
      />
      {selection.selectedGroup ? (
        <SizePresetKindEditor
          group={selection.selectedGroup}
          catalog={catalog}
          selectedSize={selection.resolvedSize}
          selectedRow={selection.selectedRow}
          canEdit={canEdit}
          onSelectSize={selection.setSelectedSize}
          onError={onError}
        />
      ) : null}
    </div>
  );
}
