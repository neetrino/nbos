import { describe, it, expect } from 'vitest';
import { Decimal } from '@nbos/database';
import {
  buildClientServicePayloadFromDomain,
  mapDomainStatusToClientServiceStatus,
} from './domain-client-service-sync';

describe('domain-client-service-sync', () => {
  it('maps domain statuses to client service statuses', () => {
    expect(mapDomainStatusToClientServiceStatus('ACTIVE')).toBe('ACTIVE');
    expect(mapDomainStatusToClientServiceStatus('EXPIRING_SOON')).toBe('EXPIRING_SOON');
    expect(mapDomainStatusToClientServiceStatus('TRANSFERRED')).toBe('CANCELLED');
  });

  it('builds DOMAIN client service payload from domain row', () => {
    const payload = buildClientServicePayloadFromDomain({
      id: 'dom-1',
      projectId: 'proj-1',
      domainName: 'example.com',
      provider: 'Reg.ru',
      purchaseDate: new Date('2025-01-01'),
      expiryDate: new Date('2026-01-01'),
      renewalCost: new Decimal(5000),
      clientCharge: new Decimal(7000),
      status: 'ACTIVE',
      clientServiceRecordId: null,
    });

    expect(payload.type).toBe('DOMAIN');
    expect(payload.name).toBe('example.com');
    expect(payload.billingModel).toBe('CLIENT_PAID');
    expect(payload.status).toBe('ACTIVE');
  });
});
