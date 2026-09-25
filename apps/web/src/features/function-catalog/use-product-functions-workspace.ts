'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DELIVERY_CONFIGURATION_PERMISSION_MODULE,
  type DeliveryFunctionOperationalDto,
} from '@nbos/shared';
import { usePermission } from '@/lib/permissions';
import { canAddFunctionsToConfiguration } from './function-catalog-select';
import {
  loadProductFunctionsWorkspace,
  type FunctionsWorkspaceTarget,
} from './product-functions-workspace-data';
import type { ProductFunctionsV2Config } from './product-functions-volume';

export type ProductFunctionsConfig = { mode: 'LEGACY' } | ProductFunctionsV2Config;

export function useProductFunctionsWorkspace(target: FunctionsWorkspaceTarget) {
  const { can } = usePermission();
  const [config, setConfig] = useState<ProductFunctionsConfig | null>(null);
  const [catalog, setCatalog] = useState<DeliveryFunctionOperationalDto[]>([]);
  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const canEdit = can('EDIT', DELIVERY_CONFIGURATION_PERMISSION_MODULE);
  const { kind, id } = target;

  const reload = useCallback(() => {
    void loadProductFunctionsWorkspace({ kind, id }).then((loaded) => {
      setConfig(normalizeProductFunctionsConfig(loaded.config));
      setCatalog(loaded.catalog);
      setDeliveryStatus(loaded.deliveryStatus);
    });
  }, [kind, id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const v2 = config?.mode === 'V2' ? config : null;
  return {
    config,
    catalog,
    catalogOpen,
    setCatalogOpen,
    reload,
    canEdit,
    canReplace: Boolean(v2?.enrolled && canEdit),
    canAdd: canAddFunctionsToConfiguration({
      enrolled: Boolean(v2?.enrolled),
      canEdit,
      deliveryStatus,
    }),
  };
}

export function normalizeProductFunctionsConfig(input: { mode: string }): ProductFunctionsConfig {
  if (input.mode !== 'V2') return { mode: 'LEGACY' };
  return input as ProductFunctionsV2Config;
}
