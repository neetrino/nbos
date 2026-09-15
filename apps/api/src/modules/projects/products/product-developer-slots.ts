import { BadRequestException } from '@nestjs/common';

export const FRONTEND_REQUIRES_BACKEND_MESSAGE = 'Frontend developer requires a Backend developer';

export type ProductDeveloperSlotIds = {
  developerId: string | null;
  frontendDeveloperId: string | null;
};

export type ProductDeveloperSlotPatch = {
  developerId?: string | null;
  frontendDeveloperId?: string | null;
};

/**
 * Frontend may match Backend (same person = 100% developer pool).
 * Frontend without Backend is invalid.
 * Caller must pass merged patch+previous ids — a partial PUT that clears
 * Backend while Frontend stays set must fail here.
 */
export function assertFrontendRequiresBackend(
  developerId: string | null | undefined,
  frontendDeveloperId: string | null | undefined,
): void {
  if (frontendDeveloperId && !developerId) {
    throw new BadRequestException(FRONTEND_REQUIRES_BACKEND_MESSAGE);
  }
}

export function mergeProductDeveloperSlotIds(
  current: ProductDeveloperSlotIds,
  patch: ProductDeveloperSlotPatch,
): ProductDeveloperSlotIds {
  return {
    developerId: patch.developerId !== undefined ? patch.developerId : current.developerId,
    frontendDeveloperId:
      patch.frontendDeveloperId !== undefined
        ? patch.frontendDeveloperId
        : current.frontendDeveloperId,
  };
}

export function assertProductDeveloperSlotsForUpdate(
  current: ProductDeveloperSlotIds,
  patch: ProductDeveloperSlotPatch,
): void {
  const merged = mergeProductDeveloperSlotIds(current, patch);
  assertFrontendRequiresBackend(merged.developerId, merged.frontendDeveloperId);
}
