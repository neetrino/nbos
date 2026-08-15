import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  PARTNER_SERVICE_SUBSCRIPTION_NAME_SEPARATOR,
  parseOptionalSubscriptionName,
  parseRequiredSubscriptionName,
  resolveDealSubscriptionName,
  resolvePartnerServiceSubscriptionName,
} from './subscription-commercial-name';

describe('subscription-commercial-name', () => {
  it('resolves deal name with trim and code fallback', () => {
    expect(resolveDealSubscriptionName({ name: '  Care  ', code: 'D-1' })).toBe('Care');
    expect(resolveDealSubscriptionName({ name: null, code: 'D-1' })).toBe('D-1');
    expect(resolveDealSubscriptionName({ name: '   ', code: 'D-1' })).toBe('D-1');
  });

  it('builds partner service name with separator', () => {
    expect(resolvePartnerServiceSubscriptionName('SEO', 'nike.com')).toBe(
      `SEO${PARTNER_SERVICE_SUBSCRIPTION_NAME_SEPARATOR}nike.com`,
    );
  });

  it('rejects blank required names and trims', () => {
    expect(parseRequiredSubscriptionName('  Alpha  ')).toBe('Alpha');
    expect(() => parseRequiredSubscriptionName('')).toThrow(BadRequestException);
    expect(() => parseRequiredSubscriptionName(undefined)).toThrow(BadRequestException);
    expect(parseOptionalSubscriptionName(undefined)).toBeUndefined();
    expect(parseOptionalSubscriptionName(' Beta ')).toBe('Beta');
  });
});
