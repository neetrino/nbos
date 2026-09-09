import { describe, expect, it } from 'vitest';
import {
  clientServiceRegistryBadge,
  clientServiceRegistryToast,
  isClientServiceDomain,
} from './client-service-registry';

describe('client-service-registry helpers', () => {
  it('is only for DOMAIN cards', () => {
    expect(isClientServiceDomain({ type: 'DOMAIN' })).toBe(true);
    expect(isClientServiceDomain({ type: 'HOSTING' })).toBe(false);
  });

  it('shows Dead / No data badges', () => {
    expect(clientServiceRegistryBadge('NOT_FOUND')?.label).toBe('Dead');
    expect(clientServiceRegistryBadge('FAILED')?.label).toBe('No data');
    expect(clientServiceRegistryBadge('NO_EXPIRY')?.label).toBe('No data');
    expect(clientServiceRegistryBadge('OBSERVED')).toBeNull();
  });

  it('maps check outcomes to toast copy', () => {
    expect(clientServiceRegistryToast('updated').kind).toBe('success');
    expect(clientServiceRegistryToast('not_found').kind).toBe('warning');
    expect(clientServiceRegistryToast('failed').kind).toBe('error');
  });
});
