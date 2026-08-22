import type { AiModelStatus } from '@nbos/shared';
import type { DiscoveredProviderModel } from '../providers/ai-provider.types';

export interface CatalogModelState {
  id: string;
  providerModelId: string;
  status: AiModelStatus;
}

export interface ModelSyncPlan {
  create: DiscoveredProviderModel[];
  refresh: Array<{ existing: CatalogModelState; discovered: DiscoveredProviderModel }>;
  disappear: CatalogModelState[];
}

export function planModelSync(
  existing: CatalogModelState[],
  discovered: DiscoveredProviderModel[],
): ModelSyncPlan {
  const byExternalId = new Map(existing.map((row) => [row.providerModelId, row]));
  const seen = new Set<string>();
  const create: DiscoveredProviderModel[] = [];
  const refresh: ModelSyncPlan['refresh'] = [];
  for (const model of discovered) {
    seen.add(model.providerModelId);
    const current = byExternalId.get(model.providerModelId);
    if (!current) {
      create.push(model);
      continue;
    }
    refresh.push({ existing: current, discovered: model });
  }
  return {
    create,
    refresh,
    disappear: existing.filter((row) => !seen.has(row.providerModelId)),
  };
}

/**
 * The only status a sync may write for a model an admin has not reviewed.
 * Production eligibility is an explicit human decision, never a side effect of
 * a provider catalog listing a new model.
 */
export const AI_MODEL_STATUS_ON_DISCOVERY: AiModelStatus = 'DISCOVERED';

/** New and returning models stay DISCOVERED. Never auto-activate. */
export function statusAfterRefresh(current: AiModelStatus): AiModelStatus {
  return current === 'UNAVAILABLE' ? AI_MODEL_STATUS_ON_DISCOVERY : current;
}

/** Disappeared models are marked unavailable unless an admin already retired them. */
export function statusAfterDisappear(current: AiModelStatus): AiModelStatus {
  if (current === 'DISABLED' || current === 'DEPRECATED' || current === 'UNAVAILABLE') {
    return current;
  }
  return 'UNAVAILABLE';
}
