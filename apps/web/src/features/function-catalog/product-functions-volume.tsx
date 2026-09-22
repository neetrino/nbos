'use client';

import { useTranslations } from 'next-intl';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { ProductCompositionPanel } from '@/features/crm/deal-constructor/product-composition-panel';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import { deliveryConfigurationsApi } from '@/lib/api/delivery-configurations';

export type ProductFunctionsV2Config = {
  id: string;
  mode: 'V2';
  enrolled: boolean;
  expectedRevision: number;
  extensionId: string | null;
  baseProfileVersionId: string | null;
  coreVolumeFactor: string;
  features: { id: string; functionId: string; origin: string; volumeFactor: string }[];
  readiness?: { planState: string; errors: string[] };
};

type VolumeBody = Parameters<typeof deliveryConfigurationsApi.setVolume>[1];

export function MoneyHiddenComposition({
  config,
  extras,
  included,
  canAdd,
  confirmRemove,
  hideCoreVolume,
  onReload,
  onAdd,
  onRemoveExtra,
}: {
  config: ProductFunctionsV2Config;
  extras: DeliveryFunctionOperationalDto[];
  included: Array<{ id: string; title: string }>;
  canAdd: boolean;
  confirmRemove: boolean;
  hideCoreVolume: boolean;
  onReload: () => void;
  onAdd: () => void;
  onRemoveExtra: (functionId: string) => void;
}) {
  const t = useTranslations('hr.functionCatalog');
  const save = (body: VolumeBody) =>
    saveConfigurationVolume(config, body, t('removeFailed'), onReload);
  return (
    <ProductCompositionPanel
      coreProfileVersionId={config.baseProfileVersionId}
      coreTitle={null}
      included={included}
      extras={extras}
      saleTotal={null}
      unitsTotal={undefined}
      canSeeUnits={false}
      showSalePrice={false}
      salePriceByFunctionId={new Map()}
      unitsByFunctionId={undefined}
      disabled={!canAdd}
      canAdd={canAdd}
      confirmRemove={confirmRemove}
      onAdd={onAdd}
      onRemoveExtra={onRemoveExtra}
      coreVolumeFactor={config.coreVolumeFactor}
      volumeByFunctionId={volumeByFunction(config)}
      onCoreVolume={coreVolumeChange(hideCoreVolume, canAdd, save)}
      onFunctionVolume={functionVolumeChange(config, canAdd, save)}
      onExtrasVolume={extrasVolumeChange(canAdd, save)}
    />
  );
}

function volumeByFunction(config: ProductFunctionsV2Config): Map<string, string> {
  return new Map(config.features.map((feature) => [feature.functionId, feature.volumeFactor]));
}

function coreVolumeChange(
  hideCore: boolean,
  canAdd: boolean,
  save: (body: VolumeBody) => Promise<void>,
) {
  if (hideCore || !canAdd) return undefined;
  return (factor: string, reason: string | null) => {
    void save({ target: 'core', volumeFactor: factor, volumeReason: reason });
  };
}

function functionVolumeChange(
  config: ProductFunctionsV2Config,
  canAdd: boolean,
  save: (body: VolumeBody) => Promise<void>,
) {
  if (!canAdd) return undefined;
  return (functionId: string, factor: string, reason: string | null) => {
    const feature = config.features.find((row) => row.functionId === functionId);
    if (!feature) return;
    void save({
      target: 'feature',
      featureId: feature.id,
      volumeFactor: factor,
      volumeReason: reason,
    });
  };
}

function extrasVolumeChange(canAdd: boolean, save: (body: VolumeBody) => Promise<void>) {
  if (!canAdd) return undefined;
  return (factor: string, reason: string | null) => {
    void save({ target: 'extras', volumeFactor: factor, volumeReason: reason });
  };
}

async function saveConfigurationVolume(
  config: ProductFunctionsV2Config,
  body: Omit<VolumeBody, 'expectedRevision'>,
  fallback: string,
  onReload: () => void,
): Promise<void> {
  try {
    await deliveryConfigurationsApi.setVolume(config.id, {
      ...body,
      expectedRevision: config.expectedRevision,
    });
    onReload();
  } catch (error) {
    toast.error(getApiErrorMessage(error, fallback));
  }
}
