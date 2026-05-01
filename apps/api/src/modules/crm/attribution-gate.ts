import { BadRequestException } from '@nestjs/common';
import { requiresMarketingWhichOneSelection } from '@nbos/shared/constants';

export interface AttributionForValidation {
  source: string | null;
  sourceDetail: string | null;
  sourcePartnerId: string | null;
  sourceContactId: string | null;
  marketingAccountId: string | null;
  marketingActivityId: string | null;
}

interface ValidationError {
  field: string;
  message: string;
}

export function getAttributionValidationErrors(data: AttributionForValidation): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!data.source) {
    errors.push({ field: 'source', message: 'From is required' });
    return errors;
  }
  if ((data.source === 'MARKETING' || data.source === 'SALES') && !data.sourceDetail) {
    errors.push({ field: 'sourceDetail', message: 'Where is required for this source' });
  }
  if (data.source === 'PARTNER' && !data.sourcePartnerId) {
    errors.push({ field: 'sourcePartnerId', message: 'Partner must be selected' });
  }
  if (data.source === 'CLIENT' && !data.sourceContactId) {
    errors.push({ field: 'sourceContactId', message: 'Client/referral contact must be selected' });
  }
  if (
    requiresMarketingWhichOneSelection(data.source, data.sourceDetail) &&
    !data.marketingAccountId &&
    !data.marketingActivityId
  ) {
    errors.push({
      field: 'whichOne',
      message: 'Which one is required for this marketing channel',
    });
  }
  return errors;
}

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
