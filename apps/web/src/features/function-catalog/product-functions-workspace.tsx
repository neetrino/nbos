'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  DELIVERY_COMPENSATION_RULES_MODULE,
  DELIVERY_CONFIGURATION_PERMISSION_MODULE,
  type DeliveryFunctionOperationalDto,
} from '@nbos/shared';
import { formatMoneyDram } from '@/lib/format/money';
import { usePermission } from '@/lib/permissions';
import { AddFunctionTrigger } from './add-function-trigger';
import { FunctionCatalogCard } from './function-catalog-card';
import { FunctionCatalogDetailSheet } from './function-catalog-detail-sheet';
import { canAddFunctionsToConfiguration, isPlanMaterialized } from './function-catalog-select';
import { salePriceCardLabels, type VisibleSalePrice } from './function-catalog-sale-price';
import { loadProductFunctionsWorkspace } from './product-functions-workspace-data';
import { ReplaceAssigneeTrigger } from './replace-assignee-trigger';

type V2Config = {
  id: string;
  mode: 'V2';
  enrolled: boolean;
  expectedRevision: number;
  features: { functionId: string; origin: string }[];
  readiness?: { planState: string; errors: string[] };
};

type LegacyOrConfig = { mode: 'LEGACY' } | V2Config;

const READINESS_MESSAGE_KEYS = {
  CONFIGURATION_INCOMPLETE: 'readiness.CONFIGURATION_INCOMPLETE',
  ROLE_ASSIGNMENT_REQUIRED: 'readiness.ROLE_ASSIGNMENT_REQUIRED',
  NORMATIVE_NOT_CONFIGURED: 'readiness.NORMATIVE_NOT_CONFIGURED',
  UNITS_NOT_CONFIGURED: 'readiness.UNITS_NOT_CONFIGURED',
  RATE_NOT_CONFIGURED: 'readiness.RATE_NOT_CONFIGURED',
  AI_DESIGNER_REVIEW_REQUIRED: 'readiness.AI_DESIGNER_REVIEW_REQUIRED',
} as const;

type ReadinessMessageCode = keyof typeof READINESS_MESSAGE_KEYS;

function isReadinessMessageCode(code: string): code is ReadinessMessageCode {
  return code in READINESS_MESSAGE_KEYS;
}

export function ProductFunctionsWorkspace({ productId }: { productId: string }) {
  const t = useTranslations('hr.functionCatalog');
  const { can } = usePermission();
  const [config, setConfig] = useState<LegacyOrConfig | null>(null);
  const [catalog, setCatalog] = useState<DeliveryFunctionOperationalDto[]>([]);
  const [salePriceByFunctionId, setSalePriceByFunctionId] = useState<Map<string, VisibleSalePrice>>(
    () => new Map(),
  );
  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const canEdit = can('EDIT', DELIVERY_CONFIGURATION_PERMISSION_MODULE);
  const canSeeRules = can('VIEW', DELIVERY_COMPENSATION_RULES_MODULE);
  const reload = useCallback(() => {
    void loadProductFunctionsWorkspace(productId, canSeeRules).then((loaded) => {
      setConfig(normalizeConfig(loaded.config));
      setCatalog(loaded.catalog);
      setDeliveryStatus(loaded.deliveryStatus);
      setSalePriceByFunctionId(loaded.salePriceByFunctionId);
    });
  }, [canSeeRules, productId]);

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
      salePriceByFunctionId={salePriceByFunctionId}
      openId={openId}
      setOpenId={setOpenId}
      onReload={reload}
      canReplace={config.enrolled && canEdit}
      canAdd={canAddFunctionsToConfiguration({
        enrolled: config.enrolled,
        canEdit,
        deliveryStatus,
      })}
      expectedRevision={config.expectedRevision}
      requireReason={isPlanMaterialized(config.readiness?.planState)}
    />
  );
}

function EnrolledFunctionsWorkspace({
  config,
  catalog,
  salePriceByFunctionId,
  openId,
  setOpenId,
  onReload,
  canReplace,
  canAdd,
  expectedRevision,
  requireReason,
}: {
  config: V2Config;
  catalog: DeliveryFunctionOperationalDto[];
  salePriceByFunctionId: Map<string, VisibleSalePrice>;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  onReload: () => void;
  canReplace: boolean;
  canAdd: boolean;
  expectedRevision: number;
  requireReason: boolean;
}) {
  const t = useTranslations('hr.functionCatalog');
  const selectedIds = new Set(config.features.map((feature) => feature.functionId));
  const selected = catalog.filter((item) => selectedIds.has(item.id));
  const openItem = catalog.find((item) => item.id === openId) ?? null;
  const included = new Set(
    config.features
      .filter((feature) => feature.origin === 'INCLUDED')
      .map((feature) => feature.functionId),
  );
  const blockers = (config.readiness?.errors ?? []).filter(isReadinessMessageCode);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        <WorkspaceActions
          configurationId={config.id}
          selectedIds={selectedIds}
          onReload={onReload}
          canAdd={canAdd}
          canReplace={canReplace}
          expectedRevision={expectedRevision}
          requireReason={requireReason}
        />
      </div>
      {blockers.map((code) => (
        <p key={code} className="text-sm text-amber-700">
          {t(READINESS_MESSAGE_KEYS[code])}
        </p>
      ))}
      <SelectedFunctionCards
        selected={selected}
        included={included}
        salePriceByFunctionId={salePriceByFunctionId}
        onOpen={setOpenId}
      />
      <FunctionCatalogDetailSheet
        item={openItem}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
      />
    </div>
  );
}

function WorkspaceActions({
  configurationId,
  selectedIds,
  onReload,
  canAdd,
  canReplace,
  expectedRevision,
  requireReason,
}: {
  configurationId: string;
  selectedIds: Set<string>;
  onReload: () => void;
  canAdd: boolean;
  canReplace: boolean;
  expectedRevision: number;
  requireReason: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {canAdd ? (
        <AddFunctionTrigger
          configurationId={configurationId}
          alreadyAddedIds={selectedIds}
          onAdded={onReload}
          expectedRevision={expectedRevision}
          requireReason={requireReason}
        />
      ) : null}
      {canReplace ? (
        <ReplaceAssigneeTrigger configurationId={configurationId} onReplaced={onReload} />
      ) : null}
    </div>
  );
}

function SelectedFunctionCards({
  selected,
  included,
  salePriceByFunctionId,
  onOpen,
}: {
  selected: DeliveryFunctionOperationalDto[];
  included: Set<string>;
  salePriceByFunctionId: Map<string, VisibleSalePrice>;
  onOpen: (id: string | null) => void;
}) {
  const t = useTranslations('hr.functionCatalog');
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {selected.map((item) => (
        <div key={item.id} className="space-y-1">
          {included.has(item.id) ? (
            <p className="text-muted-foreground text-xs">{t('includedBadge')}</p>
          ) : null}
          <FunctionCatalogCard
            item={item}
            showStatus={false}
            statusLabel=""
            onOpen={onOpen}
            {...salePriceCardLabels(
              salePriceByFunctionId.get(item.id),
              (amount) => formatMoneyDram(Number(amount)),
              t('unpublishedPrice'),
            )}
          />
        </div>
      ))}
    </div>
  );
}

function normalizeConfig(input: { mode: string }): LegacyOrConfig {
  if (input.mode !== 'V2') {
    return { mode: 'LEGACY' };
  }
  return input as V2Config;
}
