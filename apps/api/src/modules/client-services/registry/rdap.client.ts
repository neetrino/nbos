import { RDAP_BOOTSTRAP_URL, REGISTRY_LOOKUP_TIMEOUT_MS } from './domain-registry.constants';
import { parseRdapExpiry, type RdapEventLike } from './expiry-parse';
import type { RegistryLookupRaw } from './domain-registry.types';

interface RdapDomainBody {
  errorCode?: number;
  title?: string;
  events?: RdapEventLike[];
  status?: string[];
}

export async function queryRdap(
  domain: string,
  timeoutMs: number = REGISTRY_LOOKUP_TIMEOUT_MS,
): Promise<RegistryLookupRaw> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${RDAP_BOOTSTRAP_URL}/${encodeURIComponent(domain)}`, {
      headers: { Accept: 'application/rdap+json, application/json' },
      signal: controller.signal,
    });
    const body = (await response.json()) as RdapDomainBody;
    if (response.status === 404 || body.errorCode === 404) {
      return classifyRdapMiss(body);
    }
    if (!response.ok) return { status: 'FAILED', expiryDate: null, source: 'RDAP' };
    const expiryDate = parseRdapExpiry(body.events);
    if (expiryDate) return { status: 'OBSERVED', expiryDate, source: 'RDAP' };
    return { status: 'NO_EXPIRY', expiryDate: null, source: 'RDAP' };
  } catch {
    return { status: 'FAILED', expiryDate: null, source: 'RDAP' };
  } finally {
    clearTimeout(timer);
  }
}

function classifyRdapMiss(body: RdapDomainBody): RegistryLookupRaw {
  const title = (body.title ?? '').toLowerCase();
  if (title.includes('no rdap service')) {
    return { status: 'FAILED', expiryDate: null, source: 'RDAP' };
  }
  return { status: 'NOT_FOUND', expiryDate: null, source: 'RDAP' };
}
