import type { AiModelView, AiProviderConnectionView } from '@/lib/api/ai-admin';

export function groupModelsForAdmin(models: AiModelView[]): {
  discovered: AiModelView[];
  active: AiModelView[];
  other: AiModelView[];
} {
  return {
    discovered: models.filter((model) => model.status === 'DISCOVERED'),
    active: models.filter((model) => model.status === 'ACTIVE'),
    other: models.filter((model) => model.status !== 'DISCOVERED' && model.status !== 'ACTIVE'),
  };
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
