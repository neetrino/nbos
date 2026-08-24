import type { AiModelView, AiProviderConnectionView } from '@/lib/api/ai-admin';
import type { AiAdminModelSort } from './constants';

function sortModelsForAdmin(models: readonly AiModelView[], sort: AiAdminModelSort): AiModelView[] {
  const next = [...models];
  next.sort((left, right) => compareModels(left, right, sort));
  return next;
}

export function groupModelsForAdmin(
  models: AiModelView[],
  sort: AiAdminModelSort = 'newest',
): {
  discovered: AiModelView[];
  active: AiModelView[];
  other: AiModelView[];
} {
  const ordered = sortModelsForAdmin(models, sort);
  return {
    discovered: ordered.filter((model) => model.status === 'DISCOVERED'),
    active: ordered.filter((model) => model.status === 'ACTIVE'),
    other: ordered.filter((model) => model.status !== 'DISCOVERED' && model.status !== 'ACTIVE'),
  };
}

function compareModels(left: AiModelView, right: AiModelView, sort: AiAdminModelSort): number {
  if (sort === 'name') {
    return left.displayName.localeCompare(right.displayName) || left.id.localeCompare(right.id);
  }
  const leftTime = Date.parse(left.discoveredAt) || 0;
  const rightTime = Date.parse(right.discoveredAt) || 0;
  if (leftTime !== rightTime) {
    return sort === 'newest' ? rightTime - leftTime : leftTime - rightTime;
  }
  return left.displayName.localeCompare(right.displayName);
}

export function productionEligibleModels(
  models: AiModelView[],
  connections: AiProviderConnectionView[],
): AiModelView[] {
  const activeConnectionIds = new Set(
    connections.filter((item) => item.status === 'ACTIVE').map((item) => item.id),
  );
  return models.filter(
    (model) => model.status === 'ACTIVE' && activeConnectionIds.has(model.connectionId),
  );
}
