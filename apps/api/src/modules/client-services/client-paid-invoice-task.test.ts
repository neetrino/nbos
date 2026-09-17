import { describe, expect, it } from 'vitest';
import { shouldCreateDomainPrepTask } from './client-paid-invoice-task';

describe('shouldCreateDomainPrepTask', () => {
  it('skips client-DNS and working registrar access', () => {
    expect(
      shouldCreateDomainPrepTask({
        type: 'DOMAIN',
        connectionMode: 'CLIENT_DNS',
        providerAccountId: null,
      }),
    ).toBe(false);
    expect(
      shouldCreateDomainPrepTask({
        type: 'DOMAIN',
        connectionMode: 'PURCHASE',
        providerAccountId: 'cred-1',
      }),
    ).toBe(false);
  });

  it('creates a prep task when a purchase still lacks an account', () => {
    expect(
      shouldCreateDomainPrepTask({
        type: 'DOMAIN',
        connectionMode: 'PURCHASE',
        providerAccountId: null,
      }),
    ).toBe(true);
  });

  it('does not treat an unknown connection mode as a purchase', () => {
    expect(
      shouldCreateDomainPrepTask({
        type: 'DOMAIN',
        connectionMode: null,
        providerAccountId: null,
      }),
    ).toBe(false);
  });
});
