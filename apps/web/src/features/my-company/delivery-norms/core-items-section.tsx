'use client';

import { useTranslations } from 'next-intl';
import type { DeliveryBaseProfileFinancialDto } from '@nbos/shared';
import { dictionariesForProfileLabel } from './base-profile-label';
import { CoreItemsEditor } from './core-items-editor';
import { PROFILE_VERSION_PREFIX, WORKSPACE_SPLIT_CLASS } from './delivery-norms.constants';
import { DeliveryNormsKindRail } from './delivery-norms-kind-rail';
import { DeliveryNormsSectionCard } from './delivery-norms-section-card';
import { liveProfileRow } from './group-profile-rows';
import { normativeStatusLabelKey } from './normative-status-badge';
import { useProfileKindSelection } from './use-profile-kind-selection';

export function CoreItemsSection({
  rows,
  canEdit,
  onError,
  onChanged,
  embedded = false,
}: {
  rows: DeliveryBaseProfileFinancialDto[];
  canEdit: boolean;
  onError: (message: string) => void;
  onChanged: () => void;
  embedded?: boolean;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const dictionaries = dictionariesForProfileLabel(t);
  const selection = useProfileKindSelection(rows, dictionaries);
  const selectedRow = liveProfileRow(selection.selectedGroup);

  return (
    <DeliveryNormsSectionCard
      title={embedded ? undefined : t('coreItems.title')}
      description={embedded ? undefined : t('coreItems.subtitle')}
    >
      <p className="text-muted-foreground text-xs">{t('coreItems.hint')}</p>
      {selection.groups.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('coreItems.emptyVersions')}</p>
      ) : (
        <CoreItemsWorkspace
          selection={selection}
          selectedRow={selectedRow}
          canEdit={canEdit}
          onError={onError}
          onChanged={onChanged}
        />
      )}
    </DeliveryNormsSectionCard>
  );
}

function CoreItemsWorkspace({
  selection,
  selectedRow,
  canEdit,
  onError,
  onChanged,
}: {
  selection: ReturnType<typeof useProfileKindSelection>;
  selectedRow: DeliveryBaseProfileFinancialDto | null;
  canEdit: boolean;
  onError: (message: string) => void;
  onChanged: () => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <div className={WORKSPACE_SPLIT_CLASS}>
      <DeliveryNormsKindRail
        options={selection.visibleGroups.map((group) => ({
          id: group.kindId,
          title: group.title,
          subtitle: versionSubtitle(liveProfileRow(group), t),
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
      {selectedRow ? (
        <CoreItemsEditor
          versionId={selectedRow.id}
          status={selectedRow.status}
          roleUnits={selectedRow.roleUnits}
          editable={canReviseCore(canEdit, selectedRow.status)}
          onError={onError}
          onChanged={onChanged}
        />
      ) : (
        <p className="text-muted-foreground text-sm">{t('coreItems.pickKind')}</p>
      )}
    </div>
  );
}

function versionSubtitle(
  row: DeliveryBaseProfileFinancialDto | null,
  t: ReturnType<typeof useTranslations<'hr.deliveryNorms'>>,
): string | undefined {
  if (!row) return undefined;
  return t('coreItems.versionStatus', {
    version: `${PROFILE_VERSION_PREFIX}${row.version}`,
    status: t(normativeStatusLabelKey(row.status)),
  });
}

function canReviseCore(canEdit: boolean, status: string): boolean {
  return canEdit && (status === 'DRAFT' || status === 'PUBLISHED');
}
