import { describe, expect, it } from 'vitest';
import { ApiError, isStageGateApiError, toApiError } from './api-errors';

describe('api error helpers', () => {
  it('preserves structured stage gate errors', () => {
    const error = toApiError(
      {
        statusCode: 400,
        code: 'STAGE_GATE_VALIDATION',
        message: 'Cannot move to SEND_OFFER: missing required fields',
        errors: [{ field: 'amount', message: 'Amount is required at SEND_OFFER' }],
      },
      'Request failed',
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('Cannot move to SEND_OFFER: missing required fields');
    expect(error.errors).toEqual([
      { field: 'amount', message: 'Amount is required at SEND_OFFER' },
    ]);
    expect(isStageGateApiError(error)).toBe(true);
  });

  it('keeps generic API errors outside the stage gate flow', () => {
    const error = toApiError({ message: 'Unauthorized' }, 'Request failed');

    expect(error.message).toBe('Unauthorized');
    expect(error.errors).toEqual([]);
    expect(isStageGateApiError(error)).toBe(false);
  });
});
