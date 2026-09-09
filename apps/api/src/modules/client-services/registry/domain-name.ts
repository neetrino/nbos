import { DOMAIN_FQDN_PATTERN } from './domain-registry.constants';

export function normalizeDomainName(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase().replace(/\.$/, '');
  if (!trimmed || trimmed.includes('/') || trimmed.includes(' ')) return null;
  const host = trimmed.startsWith('www.') ? trimmed.slice(4) : trimmed;
  if (!DOMAIN_FQDN_PATTERN.test(host)) return null;
  return host;
}

export function tldOfDomain(domain: string): string {
  const parts = domain.toLowerCase().split('.');
  if (parts.length >= 3) {
    const sld = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    if (sld === 'de.com') return sld;
  }
  return parts[parts.length - 1] ?? domain;
}

export function resolveLookupDomainName(input: {
  linkedDomainName?: string | null;
  serviceName: string;
}): string | null {
  return (
    normalizeDomainName(input.linkedDomainName ?? '') ?? normalizeDomainName(input.serviceName)
  );
}
