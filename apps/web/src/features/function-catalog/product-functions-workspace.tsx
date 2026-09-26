'use client';

import { useTranslations } from 'next-intl';
import {
  extrasFromConfig,
  includedFromConfig,
  ProductFunctionsComposition,
} from './product-functions-composition';
import { ReplaceAssigneeTrigger } from './replace-assignee-trigger';
import type { FunctionsWorkspaceTarget } from './product-functions-workspace-data';
import { useProductFunctionsWorkspace } from './use-product-functions-workspace';

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
  const workspace = useProductFunctionsWorkspace(target);
  const { config } = workspace;

  if (!config) {
    return <p className="text-muted-foreground text-sm">{t('loadFailed')}</p>;
  }
  if (config.mode === 'LEGACY') {
    return <p className="text-muted-foreground text-sm">{t('legacySkip')}</p>;
  }

  const extras = extrasFromConfig(config, workspace.catalog);
  const included = includedFromConfig(config, workspace.catalog);
  const blockers = (config.readiness?.errors ?? []).filter(isReadinessMessageCode);

  return (
    <div className="space-y-4">
      {blockers.map((code) => (
        <p key={code} className="text-sm text-amber-700">
          {t(READINESS_MESSAGE_KEYS[code])}
        </p>
      ))}
      {workspace.canReplace ? (
        <ReplaceAssigneeTrigger configurationId={config.id} onReplaced={workspace.reload} />
      ) : null}
      <ProductFunctionsComposition
        config={config}
        extras={extras}
        included={included}
        canAdd={workspace.canAdd}
        catalogOpen={workspace.catalogOpen}
        setCatalogOpen={workspace.setCatalogOpen}
        onReload={workspace.reload}
      />
    </div>
  );
}
