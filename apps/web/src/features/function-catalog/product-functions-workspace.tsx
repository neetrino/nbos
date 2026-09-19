'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { deliveryConfigurationsApi } from '@/lib/api/delivery-configurations';
import { deliveryFunctionsApi } from '@/lib/api/delivery-functions';
import { FunctionCatalogCard } from './function-catalog-card';
import { FunctionInstructionSheet } from './function-instruction-sheet';

type V2Config = {
  id: string;
  mode: 'V2';
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
  const [config, setConfig] = useState<LegacyOrConfig | null>(null);
  const [catalog, setCatalog] = useState<DeliveryFunctionOperationalDto[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      deliveryConfigurationsApi.getByProduct(productId),
      deliveryFunctionsApi.listAll(),
    ]).then(([nextConfig, catalog]) => {
      setConfig(normalizeConfig(nextConfig));
      setCatalog(catalog);
    });
  }, [productId]);

  if (!config) {
    return <p className="text-muted-foreground text-sm">{t('loadFailed')}</p>;
  }
  if (config.mode === 'LEGACY') {
    return <p className="text-muted-foreground text-sm">{t('legacySkip')}</p>;
  }

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
      <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      {blockers.map((code) => (
        <p key={code} className="text-sm text-amber-700">
          {t(READINESS_MESSAGE_KEYS[code])}
        </p>
      ))}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {selected.map((item) => (
          <div key={item.id} className="space-y-1">
            {included.has(item.id) ? (
              <p className="text-muted-foreground text-xs">{t('includedBadge')}</p>
            ) : null}
            <FunctionCatalogCard item={item} showStatus={false} statusLabel="" onOpen={setOpenId} />
          </div>
        ))}
      </div>
      {openItem ? <FunctionInstructionSheet item={openItem} /> : null}
    </div>
  );
}

function normalizeConfig(input: { mode: string }): LegacyOrConfig {
  if (input.mode !== 'V2') {
    return { mode: 'LEGACY' };
  }
  return input as V2Config;
}
