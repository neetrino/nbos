import { describe, expect, it } from 'vitest';
import { ServiceUnavailableException } from '@nestjs/common';
import {
  isRetryableGatewayError,
  isUnknownCreateOutcome,
  isUnreachableWhatsAppGatewayError,
  throwWhatsAppDomainError,
  WhatsAppGatewayHttpError,
} from './whatsapp-gateway.errors';
import { WHATSAPP_ERROR } from './whatsapp-gateway.constants';

describe('isRetryableGatewayError', () => {
  it('treats WAHA / rate-limit / 5xx gateway codes as retryable', () => {
    expect(isRetryableGatewayError('WAHA_UNAVAILABLE')).toBe(true);
    expect(isRetryableGatewayError('RATE_LIMITED')).toBe(true);
    expect(isRetryableGatewayError('HTTP_503')).toBe(true);
    expect(isRetryableGatewayError(WHATSAPP_ERROR.GATEWAY_UNAVAILABLE)).toBe(true);
  });

  it('does not retry auth or validation failures', () => {
    expect(isRetryableGatewayError('UNAUTHORIZED')).toBe(false);
    expect(isRetryableGatewayError('WHATSAPP_NOT_CONNECTED')).toBe(false);
    expect(isRetryableGatewayError('VALIDATION_ERROR')).toBe(false);
  });
});

describe('isUnreachableWhatsAppGatewayError', () => {
  it('treats missing Gateway config and WAHA down as unreachable', () => {
    try {
      throwWhatsAppDomainError(400, WHATSAPP_ERROR.GATEWAY_NOT_CONFIGURED, 'not configured');
    } catch (error) {
      expect(isUnreachableWhatsAppGatewayError(error)).toBe(true);
    }
    expect(isUnreachableWhatsAppGatewayError(new ServiceUnavailableException('down'))).toBe(true);
    expect(
      isUnreachableWhatsAppGatewayError(
        new WhatsAppGatewayHttpError(503, 'WAHA_UNAVAILABLE', 'down'),
      ),
    ).toBe(true);
  });

  it('does not treat an invalid group id as unreachable', () => {
    try {
      throwWhatsAppDomainError(400, WHATSAPP_ERROR.INVALID_GROUP_ID, 'bad id');
    } catch (error) {
      expect(isUnreachableWhatsAppGatewayError(error)).toBe(false);
    }
  });
});

describe('isUnknownCreateOutcome', () => {
  it('recognizes gateway and domain unknown-create codes', () => {
    expect(isUnknownCreateOutcome('GROUP_CREATE_OUTCOME_UNKNOWN')).toBe(true);
    expect(isUnknownCreateOutcome(WHATSAPP_ERROR.PRODUCT_GROUP_OUTCOME_UNKNOWN)).toBe(true);
    expect(isUnknownCreateOutcome('WAHA_UNAVAILABLE')).toBe(false);
  });
});
