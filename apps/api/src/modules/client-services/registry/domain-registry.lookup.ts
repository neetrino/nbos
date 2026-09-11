import { planRegistryLookup } from './tld-router';
import { queryRdap } from './rdap.client';
import { queryWhois } from './whois.client';
import type { RegistryLookupRaw } from './domain-registry.types';

export async function lookupDomainRegistry(domain: string): Promise<RegistryLookupRaw> {
  const plan = planRegistryLookup(domain);
  const primary = await runChannel(plan.primary, domain, plan.whoisHost);
  if (isTerminalLookup(primary)) return primary;
  if (!plan.fallback) return primary;
  const fallback = await runChannel(plan.fallback, domain, plan.whoisHost);
  if (isTerminalLookup(fallback)) return fallback;
  return preferRicher(primary, fallback);
}

function isTerminalLookup(result: RegistryLookupRaw): boolean {
  return result.status === 'OBSERVED' || result.status === 'NOT_FOUND';
}

async function runChannel(
  channel: 'WHOIS' | 'RDAP',
  domain: string,
  whoisHost: string | null,
): Promise<RegistryLookupRaw> {
  if (channel === 'RDAP') return queryRdap(domain);
  if (!whoisHost) return { status: 'FAILED', expiryDate: null, source: 'WHOIS' };
  try {
    return await queryWhois(domain, whoisHost);
  } catch {
    return { status: 'FAILED', expiryDate: null, source: 'WHOIS' };
  }
}

function preferRicher(first: RegistryLookupRaw, second: RegistryLookupRaw): RegistryLookupRaw {
  if (first.status === 'NO_EXPIRY') return first;
  if (second.status === 'NO_EXPIRY') return second;
  return first.status === 'FAILED' ? second : first;
}
