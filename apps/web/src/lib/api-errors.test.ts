import { describe, expect, it } from 'vitest';
import {
  ApiError,
  getApiErrorMessage,
  isBusinessTransitionApiError,
  isStageGateApiError,
  toApiError,
} from './api-errors';

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

  it('unwraps nested Nest bad request payloads', () => {
    const error = toApiError(
      {
        statusCode: 400,
        message: {
          statusCode: 400,
          code: 'ATTRIBUTION_GATE_VALIDATION',
          message: 'Lead cannot move to SQL: missing attribution fields',
          errors: [{ field: 'sourcePartnerId', message: 'Partner must be selected' }],
        },
        error: 'Bad Request',
      },
      'Request failed',
    );

    expect(error.message).toBe('Lead cannot move to SQL: missing attribution fields');
    expect(error.errors).toEqual([
      { field: 'sourcePartnerId', message: 'Partner must be selected' },
    ]);
    expect(isStageGateApiError(error)).toBe(true);
  });

  it('classifies ATTRIBUTION_IMMUTABLE as stage gate errors for inline forms', () => {
    const error = toApiError(
      {
        statusCode: 400,
        code: 'ATTRIBUTION_IMMUTABLE',
        message: 'Lead update would leave required attribution incomplete',
        errors: [{ field: 'source', message: 'From is required' }],
      },
      'Request failed',
    );
    expect(isStageGateApiError(error)).toBe(true);
  });

  it('keeps generic API errors outside the stage gate flow', () => {
    const error = toApiError({ message: 'Unauthorized' }, 'Request failed');

    expect(error.message).toBe('Unauthorized');
    expect(error.errors).toEqual([]);
    expect(isStageGateApiError(error)).toBe(false);
  });

  it('classifies business transition errors outside stage gate flow', () => {
    const error = toApiError(
      {
        statusCode: 400,
        code: 'BUSINESS_TRANSITION_UNAVAILABLE',
        message: 'Won cannot be moved back.',
        errors: [{ field: 'status', message: 'Closed outcome' }],
      },
      'Request failed',
    );

    expect(isBusinessTransitionApiError(error)).toBe(true);
    expect(isStageGateApiError(error)).toBe(false);
  });

  it('getApiErrorMessage returns ApiError message when present', () => {
    const err = new ApiError('Server said no');
    expect(getApiErrorMessage(err, 'fallback')).toBe('Server said no');
  });

  it('getApiErrorMessage returns fallback for non-ApiError', () => {
    expect(getApiErrorMessage(new Error('x'), 'fallback')).toBe('fallback');
  });
});
