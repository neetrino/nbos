import { describe, expect, it } from 'vitest';
import { decideRegistryApply, shouldSkipRenewalInvoiceForRegistry } from './domain-registry.apply';

const SOURCE = 'WHOIS' as const;

describe('decideRegistryApply', () => {
  it('updates when registry expiry is a later calendar day', () => {
    const next = new Date('2027-09-21T00:00:00Z');
    const decision = decideRegistryApply({
      storedRenewalDate: new Date('2026-09-21T00:00:00Z'),
      lookup: { status: 'OBSERVED', expiryDate: next, source: SOURCE },
    });
    expect(decision.outcome).toBe('updated');
    expect(decision.nextRenewalDate).toEqual(next);
  });

  it('does not move the stored date earlier', () => {
    const decision = decideRegistryApply({
      storedRenewalDate: new Date('2027-09-21T00:00:00Z'),
      lookup: { status: 'OBSERVED', expiryDate: new Date('2026-09-21T00:00:00Z'), source: SOURCE },
    });
    expect(decision.outcome).toBe('unchanged');
    expect(decision.nextRenewalDate?.toISOString()).toBe('2027-09-21T00:00:00.000Z');
  });

  it('marks not found without changing the renewal date', () => {
    const stored = new Date('2026-09-21T00:00:00Z');
    const decision = decideRegistryApply({
      storedRenewalDate: stored,
      lookup: { status: 'NOT_FOUND', expiryDate: null, source: SOURCE },
    });
    expect(decision.outcome).toBe('not_found');
    expect(decision.nextRenewalDate).toEqual(stored);
  });

  it('keeps payment flow open on failed and no-expiry lookups', () => {
    expect(
      decideRegistryApply({
        storedRenewalDate: new Date('2026-09-21T00:00:00Z'),
        lookup: { status: 'FAILED', expiryDate: null, source: 'RDAP' },
      }).outcome,
    ).toBe('failed');
    expect(
      decideRegistryApply({
        storedRenewalDate: new Date('2026-09-21T00:00:00Z'),
        lookup: { status: 'NO_EXPIRY', expiryDate: null, source: SOURCE },
      }).outcome,
    ).toBe('no_expiry');
  });
});

describe('shouldSkipRenewalInvoiceForRegistry', () => {
  it('skips only DOMAIN renewed or not-found outcomes', () => {
    expect(shouldSkipRenewalInvoiceForRegistry({ type: 'DOMAIN', outcome: 'updated' })).toBe(true);
    expect(shouldSkipRenewalInvoiceForRegistry({ type: 'DOMAIN', outcome: 'not_found' })).toBe(
      true,
    );
    expect(shouldSkipRenewalInvoiceForRegistry({ type: 'DOMAIN', outcome: 'failed' })).toBe(false);
    expect(shouldSkipRenewalInvoiceForRegistry({ type: 'HOSTING', outcome: 'updated' })).toBe(
      false,
    );
  });
});
