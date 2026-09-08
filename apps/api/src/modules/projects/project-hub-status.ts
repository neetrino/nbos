export const TERMINAL_LEGACY_STATUSES = ['DONE', 'LOST'] as const;
export const LIVE_MAINTENANCE_TYPES = ['MAINTENANCE_ONLY', 'DEV_AND_MAINTENANCE'] as const;
export const LIVE_MAINTENANCE_STATUSES = ['PENDING', 'ACTIVE'] as const;

export type ProjectHubStatus = 'incoming' | 'active' | 'closed' | 'trash';

export function openDeliveryWhere() {
  return {
    deliveryResolution: null,
    status: { notIn: [...TERMINAL_LEGACY_STATUSES] },
  };
}

export function liveMaintenanceWhere() {
  return {
    type: { in: [...LIVE_MAINTENANCE_TYPES] },
    status: { in: [...LIVE_MAINTENANCE_STATUSES] },
  };
}

export function classifyProjectHubStatus(input: {
  trashedAt: Date | string | null;
  productCount: number;
  extensionCount: number;
  hasOpenDelivery: boolean;
  hasLiveMaintenance: boolean;
}): ProjectHubStatus {
  if (input.trashedAt != null) return 'trash';
  if (input.productCount === 0 && input.extensionCount === 0) return 'incoming';
  if (input.hasOpenDelivery || input.hasLiveMaintenance) return 'active';
  return 'closed';
}
