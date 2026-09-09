import { describe, expect, it } from 'vitest';
import { normalizeDomainName, resolveLookupDomainName, tldOfDomain } from './domain-name';

describe('normalizeDomainName', () => {
  it('lowercases and strips a trailing dot', () => {
    expect(normalizeDomainName('Example.AM.')).toBe('example.am');
  });

  it('rejects paths and empty values', () => {
    expect(normalizeDomainName('https://example.com')).toBeNull();
    expect(normalizeDomainName('')).toBeNull();
  });
});

describe('tldOfDomain', () => {
  it('keeps de.com as a second-level TLD', () => {
    expect(tldOfDomain('demark.de.com')).toBe('de.com');
  });

  it('returns the last label otherwise', () => {
    expect(tldOfDomain('jivsmart.com')).toBe('com');
    expect(tldOfDomain('autochehol.am')).toBe('am');
  });
});

describe('resolveLookupDomainName', () => {
  it('prefers the linked Domain row', () => {
    expect(resolveLookupDomainName({ linkedDomainName: 'acme.am', serviceName: 'Acme site' })).toBe(
      'acme.am',
    );
  });

  it('falls back to the service name', () => {
    expect(resolveLookupDomainName({ serviceName: 'numetrix.am' })).toBe('numetrix.am');
  });
});
