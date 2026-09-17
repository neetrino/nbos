import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  assertClientDnsHasNoCredential,
  clientServicePatchForConnectionMode,
} from './domain-connection-mode';

describe('assertClientDnsHasNoCredential', () => {
  it('rejects a registrar credential on the client-DNS path', () => {
    expect(() => assertClientDnsHasNoCredential('CLIENT_DNS', 'cred-1')).toThrow(
      BadRequestException,
    );
  });

  it('allows DNS without a credential and purchase with one', () => {
    expect(() => assertClientDnsHasNoCredential('CLIENT_DNS', null)).not.toThrow();
    expect(() => assertClientDnsHasNoCredential('PURCHASE', 'cred-1')).not.toThrow();
  });
});

describe('clientServicePatchForConnectionMode', () => {
  it('does not drop a linked credential when switching to client DNS', () => {
    expect(clientServicePatchForConnectionMode('CLIENT_DNS')).toEqual({
      connectionMode: 'CLIENT_DNS',
      billingModel: 'REMINDER_ONLY',
      connectionVerifiedAt: null,
    });
  });

  it('unlinks the credential only when asked', () => {
    expect(clientServicePatchForConnectionMode('CLIENT_DNS', { unlinkCredential: true })).toEqual({
      connectionMode: 'CLIENT_DNS',
      billingModel: 'REMINDER_ONLY',
      connectionVerifiedAt: null,
      providerAccountId: null,
    });
  });

  it('does not force billing when switching to purchase', () => {
    expect(clientServicePatchForConnectionMode('PURCHASE')).toEqual({
      connectionMode: 'PURCHASE',
    });
  });
});
