'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import { deliveryConfigurationsApi } from '@/lib/api/delivery-configurations';
import { AddFunctionTrigger } from './add-function-trigger';
import { isPlanMaterialized } from './function-catalog-select';
import { MoneyHiddenComposition, type ProductFunctionsV2Config } from './product-functions-volume';
import { RemoveExtraDialog } from './remove-extra-dialog';

export function ProductFunctionsComposition({
  config,
  extras,
  included,
  canAdd,
  catalogOpen,
  setCatalogOpen,
  onReload,
  title,
  coreTitle,
}: {
  config: ProductFunctionsV2Config;
  extras: DeliveryFunctionOperationalDto[];
  included: Array<{ id: string; title: string; iconKey?: string }>;
  canAdd: boolean;
  catalogOpen: boolean;
  setCatalogOpen: (open: boolean) => void;
  onReload: () => void;
  title?: string;
  coreTitle?: string | null;
}) {
  const t = useTranslations('hr.functionCatalog');
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const requireReason = isPlanMaterialized(config.readiness?.planState);
  return (
    <>
      <MoneyHiddenComposition
        title={title}
        coreTitle={coreTitle}
        config={config}
        extras={extras}
        included={included}
        canAdd={canAdd}
        confirmRemove={!requireReason}
        hideCoreVolume={config.extensionId != null}
        onReload={onReload}
        onAdd={() => setCatalogOpen(true)}
        onRemoveExtra={(functionId) => {
          if (requireReason) {
            setPendingRemoveId(functionId);
            return;
          }
          void removeExtra(config, functionId, onReload, t('removeFailed'));
        }}
      />
      <RemoveExtraDialog
        open={pendingRemoveId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoveId(null);
        }}
        onConfirm={(reason) =>
          pendingRemoveId
            ? removeExtra(config, pendingRemoveId, onReload, t('removeFailed'), reason)
            : Promise.resolve(false)
        }
      />
      {canAdd ? (
        <AddFunctionTrigger
          open={catalogOpen}
          onOpenChange={setCatalogOpen}
          configurationId={config.id}
          alreadyAddedIds={new Set(config.features.map((feature) => feature.functionId))}
          onAdded={onReload}
          expectedRevision={config.expectedRevision}
          requireReason={requireReason}
        />
      ) : null}
    </>
  );
}

export function includedFromConfig(
  config: ProductFunctionsV2Config,
  catalog: DeliveryFunctionOperationalDto[],
) {
  const ids = new Set(
    config.features
      .filter((feature) => feature.origin === 'INCLUDED')
      .map((feature) => feature.functionId),
  );
  return catalog
    .filter((item) => ids.has(item.id))
    .map((item) => ({ id: item.id, title: item.title, iconKey: item.iconKey }));
}

export function extrasFromConfig(
  config: ProductFunctionsV2Config,
  catalog: DeliveryFunctionOperationalDto[],
) {
  const extraIds = new Set(
    config.features
      .filter((feature) => feature.origin === 'EXTRA')
      .map((feature) => feature.functionId),
  );
  return catalog.filter((item) => extraIds.has(item.id));
}

async function removeExtra(
  config: ProductFunctionsV2Config,
  functionId: string,
  onReload: () => void,
  fallback: string,
  reason?: string,
): Promise<boolean> {
  const feature = config.features.find(
    (row) => row.functionId === functionId && row.origin === 'EXTRA',
  );
  if (!feature) return false;
  try {
    await deliveryConfigurationsApi.removeFeature(config.id, feature.id, {
      expectedRevision: config.expectedRevision,
      reason,
    });
    onReload();
    return true;
  } catch (error) {
    toast.error(getApiErrorMessage(error, fallback));
    return false;
  }
}
