import { describe, expect, it } from 'vitest';
import { isRetryableGatewayError } from './whatsapp-gateway.errors';

/**
 * Documents the stuck-PROCESSING contract:
 * after a retryable Gateway POST /api/groups failure the worker must leave
 * PROCESSING (release → QUEUED) before rethrowing for BullMQ, otherwise
 * updateMany lock cannot re-acquire and the op sticks forever.
 */
describe('WhatsApp product group create failure contract', () => {
  it('Gateway unavailable after create must be retryable (release PROCESSING)', () => {
    expect(isRetryableGatewayError('WAHA_UNAVAILABLE')).toBe(true);
    expect(isRetryableGatewayError('HTTP_502')).toBe(true);
  });

  it('validation / not-connected must not be retryable (markFailed immediately)', () => {
    expect(isRetryableGatewayError('VALIDATION_ERROR')).toBe(false);
    expect(isRetryableGatewayError('WHATSAPP_NOT_CONNECTED')).toBe(false);
    expect(isRetryableGatewayError('UNAUTHORIZED')).toBe(false);
  });
});
