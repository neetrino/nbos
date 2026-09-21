'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  DELIVERY_CONFIG_SIZES,
  type DeliveryBaseProfileFinancialDto,
  type DeliveryConfigSize,
  type DeliveryFunctionOperationalDto,
} from '@nbos/shared';
import { DataView, InlineField, LoadingState } from '@/components/shared';
import { deliveryCatalogStructureApi } from '@/lib/api/delivery-catalog-structure';
import { LOADING_LIST_COUNT, OPTIONAL_SELECT_NONE } from './delivery-norms.constants';
import { DeliveryNormsSectionCard } from './delivery-norms-section-card';
import { messageFromCaught } from './message-from-caught';
import { NormsLoadError } from './norms-load-error';
import { dictionariesForProfileLabel, formatBaseProfileLabel } from './base-profile-label';
import { selectOptionsFromRecord } from './select-options-from-record';
import { SizePresetCreateForm } from './size-preset-create-form';
import { SizePresetsList } from './size-presets-list';
import {
  firstDeliveryConfigSize,
  replaceSizePresetInList,
  sizePresetMap,
  uniqueProfileKeys,
} from './size-preset-draft';
import { useSizePresets } from './use-catalog-structure-lists';

const FIRST_CONFIG_SIZE = firstDeliveryConfigSize();

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
  const profileKeys = useMemo(() => uniqueProfileKeys(rows), [rows]);
  const [profileKey, setProfileKey] = useState(OPTIONAL_SELECT_NONE);
  const selectedKey = profileKey === OPTIONAL_SELECT_NONE ? null : profileKey;
  const { presets, setPresets, loading, error, load } = useSizePresets(selectedKey);
  const dictionaries = dictionariesForProfileLabel(t);
  const labels = Object.fromEntries([
    [OPTIONAL_SELECT_NONE, t('none')],
    ...profileKeys.map((key) => [key, formatBaseProfileLabel(key, null, dictionaries)]),
  ]);

  return (
    <DeliveryNormsSectionCard
      title={embedded ? undefined : t('sizePresets.title')}
      description={embedded ? undefined : t('sizePresets.subtitle')}
    >
      {/* A preset pre-selects extras; it is not the included-in-base list that makes work free. */}
      <p className="text-muted-foreground text-xs">{t('sizePresets.hint')}</p>
      {profileKeys.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('sizePresets.emptyProfiles')}</p>
      ) : (
        <InlineField
          variant="controlled"
          type="select"
          label={t('sizePresets.pickProfile')}
          value={profileKey}
          options={selectOptionsFromRecord([OPTIONAL_SELECT_NONE, ...profileKeys], labels)}
          onValueChange={setProfileKey}
        />
      )}
      {selectedKey ? (
        <SizePresetEditor
          profileKey={selectedKey}
          catalog={catalog}
          presets={presets}
          loading={loading}
          error={error}
          canEdit={canEdit}
          onPresetsChange={setPresets}
          onReload={() => void load()}
          onError={onError}
        />
      ) : null}
    </DeliveryNormsSectionCard>
  );
}

function SizePresetEditor({
  profileKey,
  catalog,
  presets,
  loading,
  error,
  canEdit,
  onPresetsChange,
  onReload,
  onError,
}: {
  profileKey: string;
  catalog: DeliveryFunctionOperationalDto[];
  presets: ReturnType<typeof useSizePresets>['presets'];
  loading: boolean;
  error: string | null;
  canEdit: boolean;
  onPresetsChange: ReturnType<typeof useSizePresets>['setPresets'];
  onReload: () => void;
  onError: (message: string) => void;
}) {
  const [selectedSize, setSelectedSize] = useState<DeliveryConfigSize>(FIRST_CONFIG_SIZE);
  const [saving, setSaving] = useState(false);
  const mapped = sizePresetMap(presets);
  const hasData = presets.length > 0 || (error === null && !loading);

  return (
    <DataView
      loading={loading}
      error={error}
      hasData={hasData}
      loadingFallback={<LoadingState variant="list" count={LOADING_LIST_COUNT} />}
      errorFallback={<NormsLoadError message={error ?? ''} onRetry={onReload} />}
    >
      <SizePresetEditorBody
        profileKey={profileKey}
        catalog={catalog}
        presets={presets}
        mapped={mapped}
        selectedSize={selectedSize}
        canEdit={canEdit}
        saving={saving}
        onSelectSize={setSelectedSize}
        onPresetsChange={onPresetsChange}
        onError={onError}
        onSaved={onReload}
        setSaving={setSaving}
      />
    </DataView>
  );
}

type SizePresetEditorBodyProps = {
  profileKey: string;
  catalog: DeliveryFunctionOperationalDto[];
  presets: ReturnType<typeof useSizePresets>['presets'];
  mapped: Record<DeliveryConfigSize, string[]>;
  selectedSize: DeliveryConfigSize;
  canEdit: boolean;
  saving: boolean;
  onSelectSize: (size: DeliveryConfigSize) => void;
  onPresetsChange: ReturnType<typeof useSizePresets>['setPresets'];
  onError: (message: string) => void;
  onSaved: () => void;
  setSaving: (value: boolean) => void;
};

function SizePresetEditorBody({
  profileKey,
  catalog,
  presets,
  mapped,
  selectedSize,
  canEdit,
  saving,
  onSelectSize,
  onPresetsChange,
  onError,
  onSaved,
  setSaving,
}: SizePresetEditorBodyProps) {
  const t = useTranslations('hr.deliveryNorms');
  const selectedIds = mapped[selectedSize] ?? [];
  const counts = Object.fromEntries(
    DELIVERY_CONFIG_SIZES.map((size) => [size, mapped[size]?.length ?? 0]),
  ) as Record<DeliveryConfigSize, number>;

  return (
    <div className="space-y-4">
      <SizePresetsList counts={counts} selectedSize={selectedSize} onSelect={onSelectSize} />
      <SizePresetCreateForm
        options={catalog}
        selectedIds={selectedIds}
        disabled={!canEdit}
        saving={saving}
        onChange={(functionIds) =>
          onPresetsChange(
            replaceSizePresetInList(presets, {
              profileKey,
              configSize: selectedSize,
              functionIds,
            }),
          )
        }
        onSave={() => {
          void submitSizePreset({
            profileKey,
            configSize: selectedSize,
            functionIds: selectedIds,
            fallback: t('errors.sizePresets'),
            onError,
            onSaved,
            setSaving,
          });
        }}
      />
    </div>
  );
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
