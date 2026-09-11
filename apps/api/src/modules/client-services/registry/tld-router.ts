import {
  RDAP_ONLY_TLDS,
  WHOIS_HOST_BY_TLD,
  WHOIS_PREFERRED_TLDS,
} from './domain-registry.constants';
import { tldOfDomain } from './domain-name';

export type RegistryLookupChannel = 'WHOIS' | 'RDAP';

export interface RegistryLookupPlan {
  primary: RegistryLookupChannel;
  fallback: RegistryLookupChannel | null;
  whoisHost: string | null;
}

export function planRegistryLookup(domain: string): RegistryLookupPlan {
  const tld = tldOfDomain(domain);
  if (RDAP_ONLY_TLDS.has(tld)) {
    return { primary: 'RDAP', fallback: null, whoisHost: null };
  }
  if (WHOIS_PREFERRED_TLDS.has(tld)) {
    return { primary: 'WHOIS', fallback: 'RDAP', whoisHost: WHOIS_HOST_BY_TLD[tld] ?? null };
  }
  return { primary: 'RDAP', fallback: 'WHOIS', whoisHost: WHOIS_HOST_BY_TLD[tld] ?? null };
}
