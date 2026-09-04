import { describe, expect, it } from 'vitest';
import {
  buildClientServiceExpensePayload,
  clientServiceExpenseCategory,
} from './client-service-create-defaults';
import type { ClientServiceRecord } from '@/lib/api/client-services';

describe('clientServiceExpenseCategory', () => {
  it('maps service types onto canonical expense categories', () => {
    expect(clientServiceExpenseCategory('DOMAIN')).toBe('DOMAIN');
    expect(clientServiceExpenseCategory('HOSTING')).toBe('DOMAIN');
    expect(clientServiceExpenseCategory('SERVICE')).toBe('TOOLS');
  });
});

describe('buildClientServiceExpensePayload', () => {
  it('sends a canonical category for hosting services', () => {
    const service = {
      id: 'svc-1',
      type: 'HOSTING',
      name: 'VPS',
      projectId: 'proj-1',
      billingModel: 'WE_PAY',
      taxStatus: 'TAX',
    } as ClientServiceRecord;

    const payload = buildClientServiceExpensePayload(
      { name: 'VPS', amount: '99', dueDate: '2026-09-04' },
      service,
    );

    expect(payload?.category).toBe('DOMAIN');
  });
});
