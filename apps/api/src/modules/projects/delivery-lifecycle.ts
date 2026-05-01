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
  onHoldReason: string | null;
  onHoldUntil: string | null;
  cancellationReason: string | null;
  isActive: boolean;
  isTerminal: boolean;
}

interface DeliveryStatusCarrier {
  status?: string | null;
  deliveryStage?: DeliveryStage;
  deliveryWorkStatus?: DeliveryWorkStatus | null;
  deliveryResolution?: DeliveryResolution;
  onHoldReason?: string | null;
  onHoldUntil?: Date | string | null;
  cancellationReason?: string | null;
}

export interface DeliveryLifecycleWrite {
  deliveryStage: Exclude<DeliveryStage, null> | null;
  deliveryWorkStatus: DeliveryWorkStatus;
  deliveryResolution: Exclude<DeliveryResolution, null> | null;
  onHoldReason?: null;
  onHoldUntil?: null;
}

export interface DeliveryPauseWrite {
  deliveryStage: Exclude<DeliveryStage, null> | null;
  deliveryWorkStatus: 'ON_HOLD';
  deliveryResolution: null;
  onHoldReason: string;
  onHoldUntil: Date;
  cancellationReason: null;
}

export interface DeliveryResumeWrite {
  deliveryStage: Exclude<DeliveryStage, null> | null;
  deliveryWorkStatus: 'ACTIVE';
  deliveryResolution: null;
  onHoldReason: null;
  onHoldUntil: null;
}

export const DELIVERY_STAGES: Array<Exclude<DeliveryStage, null>> = [
  'STARTING',
  'DEVELOPMENT',
  'QA',
  'TRANSFER',
];

export function buildProductDeliveryLifecycle(
  product: DeliveryStatusCarrier,
): DeliveryLifecycleProjection {
  return buildDeliveryLifecycle('PRODUCT', product.status ?? null, product);
}

export function buildExtensionDeliveryLifecycle(
  extension: DeliveryStatusCarrier,
): DeliveryLifecycleProjection {
  return buildDeliveryLifecycle('EXTENSION', extension.status ?? null, extension);
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
  source?: DeliveryStatusCarrier,
): DeliveryLifecycleProjection {
  const resolution = source?.deliveryResolution ?? mapDeliveryResolution(legacyStatus);
  const workStatus = source?.deliveryWorkStatus ?? mapDeliveryWorkStatus(legacyStatus);
  return {
    entityKind,
    legacyStatus,
    stage: resolution ? null : (source?.deliveryStage ?? mapDeliveryStage(legacyStatus)),
    workStatus,
    resolution,
    onHoldReason: source?.onHoldReason ?? null,
    onHoldUntil: toIsoDate(source?.onHoldUntil),
    cancellationReason: source?.cancellationReason ?? null,
    isActive: !resolution,
    isTerminal: Boolean(resolution),
  };
}

export function buildDeliveryLifecycleWrite(
  legacyStatus: string,
  current?: DeliveryStatusCarrier,
): DeliveryLifecycleWrite {
  const resolution = mapDeliveryResolution(legacyStatus);
  if (resolution) {
    return {
      deliveryStage: null,
      deliveryWorkStatus: 'ACTIVE',
      deliveryResolution: resolution,
      onHoldReason: null,
      onHoldUntil: null,
    };
  }
  if (legacyStatus === 'ON_HOLD') {
    return {
      deliveryStage: current?.deliveryStage ?? mapDeliveryStage(current?.status ?? null),
      deliveryWorkStatus: 'ON_HOLD',
      deliveryResolution: null,
    };
  }
  return {
    deliveryStage: mapDeliveryStage(legacyStatus),
    deliveryWorkStatus: 'ACTIVE',
    deliveryResolution: null,
    onHoldReason: null,
    onHoldUntil: null,
  };
}

export function buildDeliveryPauseWrite(
  current: DeliveryStatusCarrier,
  reason: string,
  onHoldUntil: Date,
): DeliveryPauseWrite {
  return {
    deliveryStage: current.deliveryStage ?? mapDeliveryStage(current.status ?? null),
    deliveryWorkStatus: 'ON_HOLD',
    deliveryResolution: null,
    onHoldReason: reason,
    onHoldUntil,
    cancellationReason: null,
  };
}

export function buildDeliveryResumeWrite(current: DeliveryStatusCarrier): DeliveryResumeWrite {
  return {
    deliveryStage: current.deliveryStage ?? mapDeliveryStage(current.status ?? null),
    deliveryWorkStatus: 'ACTIVE',
    deliveryResolution: null,
    onHoldReason: null,
    onHoldUntil: null,
  };
}

export function productLegacyStatusForStage(stage: DeliveryStage): string {
  if (stage === 'DEVELOPMENT' || stage === 'QA' || stage === 'TRANSFER') return stage;
  return 'CREATING';
}

export function extensionLegacyStatusForStage(stage: DeliveryStage): string {
  if (stage === 'DEVELOPMENT' || stage === 'QA' || stage === 'TRANSFER') return stage;
  return 'NEW';
}

export function requireDeliveryStage(stage: string): Exclude<DeliveryStage, null> {
  if (DELIVERY_STAGES.some((item) => item === stage)) return stage as Exclude<DeliveryStage, null>;
  throw new Error(`Invalid delivery stage: ${stage}`);
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

function mapDeliveryWorkStatus(legacyStatus: string | null): DeliveryWorkStatus {
  return legacyStatus === 'ON_HOLD' ? 'ON_HOLD' : 'ACTIVE';
}

function toIsoDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}
