import { describe, expect, it } from 'vitest';
import { clientServiceToFormState, parseOptionalAmount } from './client-service-form-state';
import type { ClientServiceRecord } from '@/lib/api/client-services';

describe('parseOptionalAmount', () => {
  it('returns null for empty values', () => {
    expect(parseOptionalAmount('')).toBeNull();
    expect(parseOptionalAmount('  ')).toBeNull();
  });

  it('parses trimmed numeric values', () => {
    expect(parseOptionalAmount(' 1 200.50 ')).toBe(1200.5);
  });

  it('returns NaN for invalid numbers', () => {
    expect(Number.isNaN(parseOptionalAmount('abc'))).toBe(true);
  });
});

describe('clientServiceToFormState', () => {
  it('maps API row to edit form state', () => {
    const row = {
      projectId: 'project-1',
      type: 'DOMAIN',
      name: 'example.com',
      provider: null,
      status: 'ACTIVE',
      billingModel: 'CLIENT_PAID',
      pricingModel: 'FIXED',
      frequency: 'YEARLY',
      ourCost: '12.00',
      clientCharge: null,
      taxStatus: 'TAX',
      notificationsEnabled: true,
      startDate: '2026-01-02T00:00:00.000Z',
      renewalDate: null,
      notes: null,
    } as ClientServiceRecord;

    expect(clientServiceToFormState(row)).toMatchObject({
      name: 'example.com',
      provider: '',
      startDate: '2026-01-02',
      renewalDate: '',
      clientCharge: '',
    });
  });
});
