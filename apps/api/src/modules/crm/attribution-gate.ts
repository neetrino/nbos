import { BadRequestException } from '@nestjs/common';
import { getAttributionValidationErrors, type AttributionForValidation } from '@nbos/shared';

export type { AttributionForValidation };
export { getAttributionValidationErrors };

export function mergeAttributionFields(
  before: AttributionForValidation,
  patch: Partial<AttributionForValidation>,
): AttributionForValidation {
  const keys: (keyof AttributionForValidation)[] = [
    'source',
    'sourceDetail',
    'sourcePartnerId',
    'sourceContactId',
    'marketingAccountId',
    'marketingActivityId',
  ];
  const next = { ...before };
  for (const key of keys) {
    if (patch[key] !== undefined) {
      next[key] = patch[key] as never;
    }
  }
  return next;
}

/**
 * When attribution is locked for the entity stage, PATCH must leave attribution valid.
 */
export function assertAttributionUpdateAllowed(args: {
  context: 'Lead' | 'Deal';
  before: AttributionForValidation;
  patch: Partial<AttributionForValidation>;
  locked: boolean;
}): void {
  if (!args.locked) return;
  const merged = mergeAttributionFields(args.before, args.patch);
  const errors = getAttributionValidationErrors(merged);
  if (errors.length === 0) return;

  throw new BadRequestException({
    statusCode: 400,
    code: 'ATTRIBUTION_IMMUTABLE',
    message: `${args.context} update would leave required attribution incomplete`,
    errors,
  });
}

export function validateAttributionGate(
  data: AttributionForValidation,
  context: 'Lead' | 'Deal',
  targetStatus: string,
): void {
  const errors = getAttributionValidationErrors(data);
  if (errors.length === 0) return;

  throw new BadRequestException({
    statusCode: 400,
    code: 'ATTRIBUTION_GATE_VALIDATION',
    message: `${context} cannot move to ${targetStatus}: missing attribution fields`,
    errors,
  });
}
