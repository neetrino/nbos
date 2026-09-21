'use client';

import { useTranslations } from 'next-intl';
import type { DeliveryBaseProfileFinancialDto } from '@nbos/shared';
import { dictionariesForProfileLabel } from './base-profile-label';
import { CoreItemsEditor } from './core-items-editor';
import { PROFILE_VERSION_PREFIX, WORKSPACE_SPLIT_CLASS } from './delivery-norms.constants';
import { DeliveryNormsKindRail } from './delivery-norms-kind-rail';
import { DeliveryNormsSectionCard } from './delivery-norms-section-card';
import {
  availableSizesForGroup,
  profileRowMatchingSize,
  type ProfileKindGroup,
} from './group-profile-rows';
import { normativeStatusLabelKey } from './normative-status-badge';
import { SizePresetsList } from './size-presets-list';
import { useProfileKindSelection } from './use-profile-kind-selection';

export function CoreItemsSection({
  rows,
  canEdit,
  onError,
  embedded = false,
}: {
  rows: DeliveryBaseProfileFinancialDto[];
  canEdit: boolean;
  onError: (message: string) => void;
  embedded?: boolean;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const dictionaries = dictionariesForProfileLabel(t);
  const selection = useProfileKindSelection(rows, dictionaries);

  return (
    <DeliveryNormsSectionCard
      title={embedded ? undefined : t('coreItems.title')}
      description={embedded ? undefined : t('coreItems.subtitle')}
    >
      <p className="text-muted-foreground text-xs">{t('coreItems.hint')}</p>
      {selection.groups.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('coreItems.emptyVersions')}</p>
      ) : (
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
            emptySearchLabel={t('coreItems.emptySearch')}
            searchLabel={t('search.label')}
            searchPlaceholder={t('search.placeholder')}
            onQueryChange={selection.setQuery}
            onSelect={selection.setKindId}
          />
          <CoreKindEditor selection={selection} canEdit={canEdit} onError={onError} />
        </div>
      )}
    </DeliveryNormsSectionCard>
  );
}

function CoreKindEditor({
  selection,
  canEdit,
  onError,
}: {
  selection: ReturnType<typeof useProfileKindSelection>;
  canEdit: boolean;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  if (selection.selectedGroup === null) {
    return <p className="text-muted-foreground text-sm">{t('coreItems.pickKind')}</p>;
  }
  return (
    <div className="space-y-4">
      <SizePresetsList
        selectedSize={selection.resolvedSize}
        available={availableSizesForGroup(selection.selectedGroup)}
        onSelect={selection.setSelectedSize}
        detail={(size, enabled) => coreSizeDetail(selection.selectedGroup, size, enabled, t)}
      />
      {selection.selectedRow ? (
        <CoreItemsEditor
          versionId={selection.selectedRow.id}
          editable={canEdit && selection.selectedRow.status === 'DRAFT'}
          onError={onError}
        />
      ) : (
        <p className="text-muted-foreground text-sm">{t('sizePresets.noProfileForSize')}</p>
      )}
    </div>
  );
}

function coreSizeDetail(
  group: ProfileKindGroup | null,
  size: Parameters<typeof profileRowMatchingSize>[1],
  enabled: boolean,
  t: ReturnType<typeof useTranslations<'hr.deliveryNorms'>>,
): string {
  if (!enabled || group === null) {
    return t('sizePresets.missingProfile');
  }
  const row = profileRowMatchingSize(group, size);
  if (row === null) {
    return t('sizePresets.missingProfile');
  }
  return t('coreItems.versionStatus', {
    version: `${PROFILE_VERSION_PREFIX}${row.version}`,
    status: t(normativeStatusLabelKey(row.status)),
  });
}
