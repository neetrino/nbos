import {
  assertNoFinancialLeak,
  normalizeStoredVolumeFactor,
  VOLUME_FACTOR_STANDARD,
  type DeliveryCompensationErrorCode,
} from '@nbos/shared';

export type OperationalConfigurationDto = {
  id: string;
  productId: string | null;
  extensionId: string | null;
  mode: string;
  enrolled: boolean;
  designMode: string | null;
  aiDesignerReview: boolean;
  implementationBase: string | null;
  checkedAt: string | null;
  /** Frozen core of this card. Null until the parameters are confirmed. */
  baseProfileVersionId: string | null;
  coreVolumeFactor: string;
  coreVolumeReason: string | null;
  draftVersion: number;
  /**
   * Revision a scope change must send back as `expectedRevision`. Once the plan is materialized the
   * server refuses a change without it, so the client cannot compute this from `draftVersion` alone.
   */
  expectedRevision: number;
  features: Array<{
    id: string;
    functionId: string;
    origin: string;
    volumeFactor: string;
    volumeReason: string | null;
    localNote: string | null;
    workState: string;
  }>;
  readiness: {
    planState: 'LEGACY' | 'DRAFT' | 'READY' | 'MATERIALIZED';
    errors: DeliveryCompensationErrorCode[];
  };
};

export function serializeOperationalConfiguration(input: {
  id: string;
  productId: string | null;
  extensionId: string | null;
  mode: string;
  designMode: string | null;
  aiDesignerReview: boolean;
  implementationBase: string | null;
  checkedAt: Date | null;
  baseProfileVersionId?: string | null;
  coreVolumeFactor?: { toString(): string } | string | null;
  coreVolumeReason?: string | null;
  draftVersion: number;
  currentRevision?: { sequence: number } | null;
  features: Array<{
    id: string;
    functionId: string;
    origin: string;
    volumeFactor?: { toString(): string } | string | null;
    volumeReason?: string | null;
    localNote: string | null;
    workState: string;
    archivedAt: Date | null;
  }>;
  readiness?: OperationalConfigurationDto['readiness'];
}): OperationalConfigurationDto {
  const dto: OperationalConfigurationDto = {
    id: input.id,
    productId: input.productId,
    extensionId: input.extensionId,
    mode: input.mode,
    enrolled: input.mode === 'V2',
    designMode: input.designMode,
    aiDesignerReview: input.aiDesignerReview,
    implementationBase: input.implementationBase,
    checkedAt: input.checkedAt?.toISOString() ?? null,
    baseProfileVersionId: input.baseProfileVersionId ?? null,
    coreVolumeFactor: displayFactor(input.coreVolumeFactor),
    coreVolumeReason: input.coreVolumeReason ?? null,
    draftVersion: input.draftVersion,
    expectedRevision: input.currentRevision?.sequence ?? input.draftVersion,
    features: input.features
      .filter((feature) => feature.archivedAt === null)
      .map((feature) => ({
        id: feature.id,
        functionId: feature.functionId,
        origin: feature.origin,
        volumeFactor: displayFactor(feature.volumeFactor),
        volumeReason: feature.volumeReason ?? null,
        localNote: feature.localNote,
        workState: feature.workState,
      })),
    readiness: input.readiness ?? {
      planState: input.mode === 'V2' ? 'DRAFT' : 'LEGACY',
      errors: [],
    },
  };
  const leaks = assertNoFinancialLeak(dto);
  if (leaks.length > 0) {
    throw new Error(`Operational configuration leaked financial keys: ${leaks.join(', ')}`);
  }
  return dto;
}

function displayFactor(value: { toString(): string } | string | null | undefined): string {
  if (value === null || value === undefined) return VOLUME_FACTOR_STANDARD;
  const text = typeof value === 'string' ? value : value.toString();
  return normalizeStoredVolumeFactor(text);
}
