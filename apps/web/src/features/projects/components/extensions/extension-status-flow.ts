import type { DeliveryLifecycleProjection } from '@/lib/api/projects';

export const EXTENSION_LIFECYCLE_FILTERS = [
  { value: 'STARTING', label: 'Starting' },
  { value: 'DEVELOPMENT', label: 'Development' },
  { value: 'QA', label: 'QA' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'DONE', label: 'Done' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

const NEXT_TARGET: Record<NonNullable<DeliveryLifecycleProjection['stage']>, string> = {
  STARTING: 'DEVELOPMENT',
  DEVELOPMENT: 'QA',
  QA: 'TRANSFER',
  TRANSFER: 'DONE',
};

const LEGACY_STATUS_TO_FILTER: Record<string, string> = {
  NEW: 'STARTING',
  LOST: 'CANCELLED',
};

export function getNextExtensionTarget(lifecycle: DeliveryLifecycleProjection | undefined) {
  if (!lifecycle || lifecycle.isTerminal || lifecycle.workStatus === 'ON_HOLD') return null;
  return lifecycle.stage ? NEXT_TARGET[lifecycle.stage] : null;
}

export function getExtensionLifecycleFilterValue(extension: {
  status: string;
  deliveryLifecycle?: DeliveryLifecycleProjection;
}) {
  const lifecycle = extension.deliveryLifecycle;
  if (!lifecycle) return LEGACY_STATUS_TO_FILTER[extension.status] ?? extension.status;
  if (lifecycle.resolution) return lifecycle.resolution;
  if (lifecycle.workStatus === 'ON_HOLD') return 'ON_HOLD';
  return lifecycle.stage ?? extension.status;
}
