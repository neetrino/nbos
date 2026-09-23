'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  DELIVERY_CONFIGURATION_PERMISSION_MODULE,
  type DeliveryFunctionOperationalDto,
} from '@nbos/shared';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import { usePermission } from '@/lib/permissions';
import { deliveryConfigurationsApi } from '@/lib/api/delivery-configurations';
import { AddFunctionTrigger } from './add-function-trigger';
import { canAddFunctionsToConfiguration, isPlanMaterialized } from './function-catalog-select';
import { RemoveExtraDialog } from './remove-extra-dialog';
import {
  loadProductFunctionsWorkspace,
  type FunctionsWorkspaceTarget,
} from './product-functions-workspace-data';
import { ReplaceAssigneeTrigger } from './replace-assignee-trigger';
import { MoneyHiddenComposition, type ProductFunctionsV2Config } from './product-functions-volume';

type V2Config = ProductFunctionsV2Config;

type LegacyOrConfig = { mode: 'LEGACY' } | V2Config;

const READINESS_MESSAGE_KEYS = {
  CONFIGURATION_INCOMPLETE: 'readiness.CONFIGURATION_INCOMPLETE',
  ROLE_ASSIGNMENT_REQUIRED: 'readiness.ROLE_ASSIGNMENT_REQUIRED',
  NORMATIVE_NOT_CONFIGURED: 'readiness.NORMATIVE_NOT_CONFIGURED',
  UNITS_NOT_CONFIGURED: 'readiness.UNITS_NOT_CONFIGURED',
  RATE_NOT_CONFIGURED: 'readiness.RATE_NOT_CONFIGURED',
} as const;

type ReadinessMessageCode = keyof typeof READINESS_MESSAGE_KEYS;

function isReadinessMessageCode(code: string): code is ReadinessMessageCode {
  return code in READINESS_MESSAGE_KEYS;
}

export function ProductFunctionsWorkspace({ target }: { target: FunctionsWorkspaceTarget }) {
  const t = useTranslations('hr.functionCatalog');
  const { can } = usePermission();
  const [config, setConfig] = useState<LegacyOrConfig | null>(null);
  const [catalog, setCatalog] = useState<DeliveryFunctionOperationalDto[]>([]);
  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const canEdit = can('EDIT', DELIVERY_CONFIGURATION_PERMISSION_MODULE);
  const { kind, id } = target;
  const reload = useCallback(() => {
    void loadProductFunctionsWorkspace({ kind, id }).then((loaded) => {
      setConfig(normalizeConfig(loaded.config));
      setCatalog(loaded.catalog);
      setDeliveryStatus(loaded.deliveryStatus);
    });
  }, [kind, id]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!config) {
    return <p className="text-muted-foreground text-sm">{t('loadFailed')}</p>;
  }
  if (config.mode === 'LEGACY') {
    return <p className="text-muted-foreground text-sm">{t('legacySkip')}</p>;
  }
  return (
    <EnrolledFunctionsWorkspace
      config={config}
      catalog={catalog}
      catalogOpen={catalogOpen}
      setCatalogOpen={setCatalogOpen}
      onReload={reload}
      canReplace={config.enrolled && canEdit}
      canAdd={canAddFunctionsToConfiguration({
        enrolled: config.enrolled,
        canEdit,
        deliveryStatus,
      })}
    />
  );
}

function EnrolledFunctionsWorkspace({
  config,
  catalog,
  catalogOpen,
  setCatalogOpen,
  onReload,
  canReplace,
  canAdd,
}: {
  config: V2Config;
  catalog: DeliveryFunctionOperationalDto[];
  catalogOpen: boolean;
  setCatalogOpen: (open: boolean) => void;
  onReload: () => void;
  canReplace: boolean;
  canAdd: boolean;
}) {
  const t = useTranslations('hr.functionCatalog');
  const extras = extrasFromConfig(config, catalog);
  const included = includedFromConfig(config, catalog);
  const blockers = (config.readiness?.errors ?? []).filter(isReadinessMessageCode);
  const requireReason = isPlanMaterialized(config.readiness?.planState);
  return (
    <div className="space-y-4">
      {blockers.map((code) => (
        <p key={code} className="text-sm text-amber-700">
          {t(READINESS_MESSAGE_KEYS[code])}
        </p>
      ))}
      {canReplace ? (
        <ReplaceAssigneeTrigger configurationId={config.id} onReplaced={onReload} />
      ) : null}
      <WorkspaceComposition
        config={config}
        extras={extras}
        included={included}
        canAdd={canAdd}
        requireReason={requireReason}
        catalogOpen={catalogOpen}
        setCatalogOpen={setCatalogOpen}
        onReload={onReload}
        removeFailed={t('removeFailed')}
      />
    </div>
  );
}

function WorkspaceComposition(props: WorkspaceCompositionProps) {
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const { config, requireReason, onReload, removeFailed } = props;
  return (
    <>
      <MoneyHiddenComposition
        config={config}
        extras={props.extras}
        included={props.included}
        canAdd={props.canAdd}
        confirmRemove={!requireReason}
        hideCoreVolume={config.extensionId != null}
        onReload={onReload}
        onAdd={() => props.setCatalogOpen(true)}
        onRemoveExtra={(functionId) => {
          if (requireReason) {
            setPendingRemoveId(functionId);
            return;
          }
          void removeExtra(config, functionId, onReload, removeFailed);
        }}
      />
      <RemoveExtraDialog
        open={pendingRemoveId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoveId(null);
        }}
        onConfirm={(reason) =>
          pendingRemoveId
            ? removeExtra(config, pendingRemoveId, onReload, removeFailed, reason)
            : Promise.resolve(false)
        }
      />
      {props.canAdd ? (
        <AddFunctionTrigger
          open={props.catalogOpen}
          onOpenChange={props.setCatalogOpen}
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

type WorkspaceCompositionProps = {
  config: V2Config;
  extras: DeliveryFunctionOperationalDto[];
  included: Array<{ id: string; title: string; iconKey?: string }>;
  canAdd: boolean;
  requireReason: boolean;
  catalogOpen: boolean;
  setCatalogOpen: (open: boolean) => void;
  onReload: () => void;
  removeFailed: string;
};

function includedFromConfig(config: V2Config, catalog: DeliveryFunctionOperationalDto[]) {
  const ids = new Set(
    config.features
      .filter((feature) => feature.origin === 'INCLUDED')
      .map((feature) => feature.functionId),
  );
  return catalog
    .filter((item) => ids.has(item.id))
    .map((item) => ({ id: item.id, title: item.title, iconKey: item.iconKey }));
}

function extrasFromConfig(config: V2Config, catalog: DeliveryFunctionOperationalDto[]) {
  const extraIds = new Set(
    config.features
      .filter((feature) => feature.origin === 'EXTRA')
      .map((feature) => feature.functionId),
  );
  return catalog.filter((item) => extraIds.has(item.id));
}

async function removeExtra(
  config: V2Config,
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

function normalizeConfig(input: { mode: string }): LegacyOrConfig {
  if (input.mode !== 'V2') {
    return { mode: 'LEGACY' };
  }
  return input as V2Config;
}
