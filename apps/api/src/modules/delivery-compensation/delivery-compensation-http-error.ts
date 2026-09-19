import { BadRequestException } from '@nestjs/common';
import type { DeliveryCompensationErrorCode } from '@nbos/shared';

const SAFE_MESSAGES: Record<DeliveryCompensationErrorCode, string> = {
  CONFIGURATION_INCOMPLETE: 'Complete product functions and team setup before Development.',
  ROLE_ASSIGNMENT_REQUIRED: 'Assign every required delivery role before Development.',
  NORMATIVE_NOT_CONFIGURED:
    'Published compensation norms are incomplete. Ask the Owner to finish setup.',
  CONFIGURATION_CONFLICT: 'This configuration changed. Reload and try again.',
  REDISTRIBUTION_REQUIRED: 'Enter share percents for the replacement. Empty fields are required.',
  FINANCIAL_ALLOCATION_LOCKED: 'This planned bonus cannot be reduced below accepted or paid work.',
  FUNCTION_ALREADY_SELECTED: 'This function is already on the product.',
  LEGACY_ADOPTION_REQUIRED: 'This product stays on the previous compensation model.',
  AI_DESIGNER_REVIEW_REQUIRED: 'AI design with a Designer requires an explicit Reviewer role.',
  UNITS_NOT_CONFIGURED: 'Published function units are incomplete. Ask the Owner to finish setup.',
  RATE_NOT_CONFIGURED: 'Published role rates are incomplete. Ask the Owner to finish setup.',
};

export function throwDeliveryCompensationError(code: DeliveryCompensationErrorCode): never {
  throw new BadRequestException({
    statusCode: 400,
    code,
    message: SAFE_MESSAGES[code],
    errors: [{ field: 'deliveryCompensation', message: SAFE_MESSAGES[code], code }],
  });
}

export function firstReadinessError(
  codes: readonly DeliveryCompensationErrorCode[],
): DeliveryCompensationErrorCode | null {
  return codes[0] ?? null;
}
