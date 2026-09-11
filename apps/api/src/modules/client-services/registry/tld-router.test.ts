import { describe, expect, it } from 'vitest';
import { planRegistryLookup } from './tld-router';

describe('planRegistryLookup', () => {
  it('prefers WHOIS for .am .ru .ge .com and .de.com', () => {
    expect(planRegistryLookup('autochehol.am').primary).toBe('WHOIS');
    expect(planRegistryLookup('site.ru').whoisHost).toBe('whois.tcinet.ru');
    expect(planRegistryLookup('autoking.ge').primary).toBe('WHOIS');
    expect(planRegistryLookup('jivsmart.com').primary).toBe('WHOIS');
    expect(planRegistryLookup('demark.de.com').whoisHost).toBe('whois.centralnic.com');
  });

  it('uses RDAP only for .center', () => {
    expect(planRegistryLookup('ilona.center')).toEqual({
      primary: 'RDAP',
      fallback: null,
      whoisHost: null,
    });
  });

  it('starts with RDAP for unknown gTLDs', () => {
    const plan = planRegistryLookup('example.xyz');
    expect(plan.primary).toBe('RDAP');
    expect(plan.fallback).toBe('WHOIS');
  });
});
