import { describe, expect, it } from 'vitest';
import {
  domainHeaderNeedsAction,
  domainHeaderStatusForRow,
  isDomainConnectionSatisfied,
  resolveDomainConnectionMode,
  summarizeDomainHeaderStatus,
  type DomainHeaderStatusInput,
} from './domain-connection';

function row(overrides: Partial<DomainHeaderStatusInput> = {}): DomainHeaderStatusInput {
  return {
    domainName: 'example.am',
    connectionMode: 'PURCHASE',
    status: 'PENDING',
    hasOpenInvoice: false,
    hasCredential: false,
    registrationConfirmed: false,
    connectionVerified: false,
    hasDnsInstructions: false,
    ...overrides,
  };
}

describe('domain connection status', () => {
  it('does not treat DNS as requiring credential or connection verification', () => {
    const dns = row({
      connectionMode: 'CLIENT_DNS',
      hasDnsInstructions: true,
      hasCredential: false,
      connectionVerified: false,
    });
    expect(isDomainConnectionSatisfied(dns)).toBe(true);
    expect(domainHeaderStatusForRow(dns)).toBe('client_dns');
  });

  it('keeps purchase distinct from connected until verification', () => {
    const purchased = row({
      hasCredential: true,
      registrationConfirmed: true,
      connectionVerified: false,
    });
    expect(isDomainConnectionSatisfied(purchased)).toBe(false);
    expect(domainHeaderStatusForRow(purchased)).toBe('purchased');
  });

  it('summarizes empty and multiple products', () => {
    expect(summarizeDomainHeaderStatus([])).toBe('empty');
    expect(summarizeDomainHeaderStatus([row(), row({ domainName: 'other.am' })])).toBe('multiple');
  });

  it('defaults empty connection mode to purchase', () => {
    expect(resolveDomainConnectionMode(null)).toBe('PURCHASE');
    expect(resolveDomainConnectionMode('')).toBe('PURCHASE');
    expect(resolveDomainConnectionMode('CLIENT_DNS')).toBe('CLIENT_DNS');
  });

  it('flags multiple domains that still need payment or prep', () => {
    expect(domainHeaderNeedsAction([row(), row({ domainName: 'other.am' })])).toBe(true);
    expect(
      domainHeaderNeedsAction([
        row({
          connectionMode: 'CLIENT_DNS',
          hasDnsInstructions: true,
        }),
      ]),
    ).toBe(false);
  });
});
