export type DeliveryEntityKind = 'PRODUCT' | 'EXTENSION';
export type DeliveryStage = 'STARTING' | 'DEVELOPMENT' | 'QA' | 'TRANSFER' | null;
export type DeliveryWorkStatus = 'ACTIVE' | 'ON_HOLD';
export type DeliveryResolution = 'DONE' | 'CANCELLED' | null;

export interface DeliveryLifecycleProjection {
  entityKind: DeliveryEntityKind;
  legacyStatus: string | null;
  stage: DeliveryStage;
  workStatus: DeliveryWorkStatus;
  resolution: DeliveryResolution;
  isActive: boolean;
  isTerminal: boolean;
}

interface DeliveryStatusCarrier {
  status?: string | null;
}

export function buildProductDeliveryLifecycle(
  product: DeliveryStatusCarrier,
): DeliveryLifecycleProjection {
  return buildDeliveryLifecycle('PRODUCT', product.status ?? null);
}

export function buildExtensionDeliveryLifecycle(
  extension: DeliveryStatusCarrier,
): DeliveryLifecycleProjection {
  return buildDeliveryLifecycle('EXTENSION', extension.status ?? null);
}

export function attachProductDeliveryLifecycle<T extends DeliveryStatusCarrier>(product: T) {
  return { ...product, deliveryLifecycle: buildProductDeliveryLifecycle(product) };
}

export function attachExtensionDeliveryLifecycle<T extends DeliveryStatusCarrier>(extension: T) {
  return { ...extension, deliveryLifecycle: buildExtensionDeliveryLifecycle(extension) };
}

function buildDeliveryLifecycle(
  entityKind: DeliveryEntityKind,
  legacyStatus: string | null,
): DeliveryLifecycleProjection {
  const resolution = mapDeliveryResolution(legacyStatus);
  const workStatus = legacyStatus === 'ON_HOLD' ? 'ON_HOLD' : 'ACTIVE';
  return {
    entityKind,
    legacyStatus,
    stage: resolution ? null : mapDeliveryStage(legacyStatus),
    workStatus,
    resolution,
    isActive: !resolution,
    isTerminal: Boolean(resolution),
  };
}

function mapDeliveryStage(legacyStatus: string | null): DeliveryStage {
  if (legacyStatus === 'DEVELOPMENT' || legacyStatus === 'QA' || legacyStatus === 'TRANSFER') {
    return legacyStatus;
  }
  if (legacyStatus === 'NEW' || legacyStatus === 'CREATING') return 'STARTING';
  return null;
}

function mapDeliveryResolution(legacyStatus: string | null): DeliveryResolution {
  if (legacyStatus === 'DONE') return 'DONE';
  if (legacyStatus === 'LOST') return 'CANCELLED';
  return null;
}
