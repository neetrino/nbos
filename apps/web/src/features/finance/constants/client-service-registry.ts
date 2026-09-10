import type {
  ClientServiceRecord,
  ClientServiceRegistryCheckOutcome,
  ClientServiceRegistryLookupStatus,
} from '@/lib/api/client-services';

export function isClientServiceDomain(service: Pick<ClientServiceRecord, 'type'>): boolean {
  return service.type === 'DOMAIN';
}

export function clientServiceRegistryBadge(
  status: ClientServiceRegistryLookupStatus | null | undefined,
): { label: string; variant: 'red' | 'amber' | 'muted' } | null {
  if (status === 'NOT_FOUND') return { label: 'Dead', variant: 'red' };
  if (status === 'NO_EXPIRY' || status === 'FAILED') return { label: 'No data', variant: 'amber' };
  return null;
}

export function clientServiceRegistryToast(outcome: ClientServiceRegistryCheckOutcome): {
  kind: 'success' | 'warning' | 'error';
  message: string;
} {
  if (outcome === 'updated') {
    return { kind: 'success', message: 'Registry expiry found. Renewal date updated.' };
  }
  if (outcome === 'unchanged') {
    return { kind: 'success', message: 'Registry date matches the current renewal date.' };
  }
  if (outcome === 'not_found') {
    return { kind: 'warning', message: 'Domain is not in the registry (dead / not found).' };
  }
  if (outcome === 'no_expiry') {
    return { kind: 'warning', message: 'Domain is registered, but the registry hid the expiry.' };
  }
  return { kind: 'error', message: 'Registry lookup failed. Payment flow is unchanged.' };
}
