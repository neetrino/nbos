'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type {
  DeliveryBaseProfileFinancialDto,
  DeliveryConfigSize,
  DeliveryFunctionOperationalDto,
} from '@nbos/shared';
import { DataView, LoadingState } from '@/components/shared';
import { deliveryCatalogStructureApi } from '@/lib/api/delivery-catalog-structure';
import { LOADING_LIST_COUNT, PROFILE_VERSION_PREFIX } from './delivery-norms.constants';
import {
  availableSizesForGroup,
  profileRowMatchingSize,
  type ProfileKindGroup,
} from './group-profile-rows';
import { messageFromCaught } from './message-from-caught';
import { NormsLoadError } from './norms-load-error';
import { normativeStatusLabelKey } from './normative-status-badge';
import { SizePresetCreateForm } from './size-preset-create-form';
import { SizePresetsList } from './size-presets-list';
import { replaceSizePresetInList, sizePresetMap } from './size-preset-draft';
import { useSizePresets } from './use-catalog-structure-lists';

export function SizePresetKindEditor({
  group,
  catalog,
  selectedSize,
  selectedRow,
  canEdit,
  onSelectSize,
  onError,
}: {
  group: ProfileKindGroup;
  catalog: DeliveryFunctionOperationalDto[];
  selectedSize: DeliveryConfigSize;
  selectedRow: DeliveryBaseProfileFinancialDto | null;
  canEdit: boolean;
  onSelectSize: (size: DeliveryConfigSize) => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const listState = useSizePresets(selectedRow?.profileKey ?? null);
  const [saving, setSaving] = useState(false);
  const ladder = (
    <SizePresetsList
      selectedSize={selectedSize}
      available={availableSizesForGroup(group)}
      onSelect={onSelectSize}
      detail={(size, enabled) => sizeLadderDetail(group, size, enabled, t)}
    />
  );
  if (selectedRow === null) {
    return (
      <div className="space-y-4">
        {ladder}
        <p className="text-muted-foreground text-sm">{t('sizePresets.noProfileForSize')}</p>
      </div>
    );
  }
  return (
    <LoadedSizePresetEditor
      row={selectedRow}
      catalog={catalog}
      selectedSize={selectedSize}
      canEdit={canEdit}
      ladder={ladder}
      saving={saving}
      setSaving={setSaving}
      onError={onError}
      presets={listState.presets}
      setPresets={listState.setPresets}
      loading={listState.loading}
      error={listState.error}
      load={listState.load}
    />
  );
}

function LoadedSizePresetEditor({
  row,
  catalog,
  selectedSize,
  canEdit,
  ladder,
  saving,
  setSaving,
  onError,
  presets,
  setPresets,
  loading,
  error,
  load,
}: {
  row: DeliveryBaseProfileFinancialDto;
  catalog: DeliveryFunctionOperationalDto[];
  selectedSize: DeliveryConfigSize;
  canEdit: boolean;
  ladder: ReactNode;
  saving: boolean;
  setSaving: (value: boolean) => void;
  onError: (message: string) => void;
  presets: ReturnType<typeof useSizePresets>['presets'];
  setPresets: ReturnType<typeof useSizePresets>['setPresets'];
  loading: boolean;
  error: string | null;
  load: ReturnType<typeof useSizePresets>['load'];
}) {
  const t = useTranslations('hr.deliveryNorms');
  const selectedIds = sizePresetMap(presets)[selectedSize] ?? [];
  return (
    <DataView
      loading={loading}
      error={error}
      hasData
      loadingFallback={<LoadingState variant="list" count={LOADING_LIST_COUNT} />}
      errorFallback={<NormsLoadError message={error ?? ''} onRetry={() => void load()} />}
    >
      <div className="space-y-4">
        {ladder}
        <SizePresetCreateForm
          options={catalog}
          selectedIds={selectedIds}
          disabled={!canEdit}
          saving={saving}
          onChange={(functionIds) =>
            setPresets(
              replaceSizePresetInList(presets, {
                profileKey: row.profileKey,
                configSize: selectedSize,
                functionIds,
              }),
            )
          }
          onSave={() => {
            void submitSizePreset({
              profileKey: row.profileKey,
              configSize: selectedSize,
              functionIds: selectedIds,
              fallback: t('errors.sizePresets'),
              onError,
              onSaved: () => void load(),
              setSaving,
            });
          }}
        />
      </div>
    </DataView>
  );
}

function sizeLadderDetail(
  group: ProfileKindGroup,
  size: DeliveryConfigSize,
  enabled: boolean,
  t: ReturnType<typeof useTranslations<'hr.deliveryNorms'>>,
): string {
  if (!enabled) {
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

async function submitSizePreset(input: {
  profileKey: string;
  configSize: DeliveryConfigSize;
  functionIds: string[];
  fallback: string;
  onError: (message: string) => void;
  onSaved: () => void;
  setSaving: (value: boolean) => void;
}): Promise<void> {
  input.setSaving(true);
  try {
    await deliveryCatalogStructureApi.replaceSizePreset({
      profileKey: input.profileKey,
      configSize: input.configSize,
      functionIds: input.functionIds,
    });
    input.onSaved();
  } catch (caught) {
    input.onError(messageFromCaught(caught, input.fallback));
  } finally {
    input.setSaving(false);
  }
}
