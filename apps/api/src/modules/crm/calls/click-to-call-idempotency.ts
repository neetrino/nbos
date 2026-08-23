import { BadRequestException } from '@nestjs/common';

export const CLICK_TO_CALL_IDEMPOTENCY_KEY_HEADER = 'idempotency-key';
export const CLICK_TO_CALL_IDEMPOTENCY_KEY_MAX_LENGTH = 128;
export const CLICK_TO_CALL_IDEMPOTENCY_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const CLICK_TO_CALL_IDEMPOTENCY_KEY_REQUIRED_MESSAGE = 'Idempotency-Key header is required';
export const CLICK_TO_CALL_IDEMPOTENCY_KEY_INVALID_MESSAGE =
  'Idempotency-Key must be a UUID of at most 128 characters';
export const CLICK_TO_CALL_IDEMPOTENCY_CONFLICT_MESSAGE =
  'Idempotency-Key was already used with a different click-to-call target';
export const CLICK_TO_CALL_IN_PROGRESS_MESSAGE = 'This click-to-call is already in progress';
export const CLICK_TO_CALL_IN_PROGRESS_CODE = 'CLICK_TO_CALL_IN_PROGRESS';
export const CLICK_TO_CALL_IDEMPOTENCY_CONFLICT_CODE = 'CLICK_TO_CALL_IDEMPOTENCY_CONFLICT';

export const ATS_CALL_INTENT_ERROR_ATS_REJECTED = 'ATS_REJECTED';
export const ATS_CALL_INTENT_ERROR_ATS_NOT_CONFIGURED = 'ATS_NOT_CONFIGURED';
export const CLICK_TO_CALL_ATS_NOT_CONFIGURED_MESSAGE = 'ATS integration is not configured';

export function requireClickToCallIdempotencyKey(raw: string | undefined): string {
  const key = raw?.trim() ?? '';
  if (!key) {
    throw new BadRequestException(CLICK_TO_CALL_IDEMPOTENCY_KEY_REQUIRED_MESSAGE);
  }
  if (
    key.length > CLICK_TO_CALL_IDEMPOTENCY_KEY_MAX_LENGTH ||
    !CLICK_TO_CALL_IDEMPOTENCY_KEY_PATTERN.test(key)
  ) {
    throw new BadRequestException(CLICK_TO_CALL_IDEMPOTENCY_KEY_INVALID_MESSAGE);
  }
  return key;
}

export function clickToCallFingerprint(input: {
  employeeId: string;
  targetType: string;
  targetId: string;
}): string {
  return `${input.employeeId}:${input.targetType}:${input.targetId}`;
}
