import { describe, expect, it } from 'vitest';
import {
  clientServiceFormToPayload,
  clientServiceToFormState,
  parseOptionalAmount,
} from './client-service-form-state';
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
      productId: 'product-1',
      type: 'DOMAIN',
      name: 'example.com',
      provider: null,
      status: 'ACTIVE',
      billingModel: 'WE_PAY',
      pricingModel: 'FIXED',
      frequency: 'YEARLY',
      ourCost: '12.00',
      clientCharge: null,
      taxStatus: 'TAX',
      notificationsEnabled: true,
      reminderLanguage: 'HY',
      startDate: '2026-01-02T00:00:00.000Z',
      renewalDate: null,
      notes: null,
    } as ClientServiceRecord;

    expect(clientServiceToFormState(row)).toMatchObject({
      projectId: 'project-1',
      productId: 'product-1',
      name: 'example.com',
      provider: '',
      startDate: '2026-01-02',
      renewalDate: '',
      clientCharge: '',
      reminderLanguage: 'HY',
    });
  });

  it('maps a missing product to an empty form id', () => {
    const row = {
      projectId: 'project-1',
      productId: null,
      name: 'legacy.com',
    } as ClientServiceRecord;
    expect(clientServiceToFormState(row).productId).toBe('');
  });
});

describe('clientServiceFormToPayload', () => {
  it('sends productId and omits a blank product as null', () => {
    const withProduct = clientServiceToFormState({
      projectId: 'project-1',
      productId: 'product-1',
      type: 'DOMAIN',
      name: 'example.com',
      provider: null,
      status: 'PENDING',
      billingModel: 'WE_PAY',
      pricingModel: 'FIXED',
      frequency: 'YEARLY',
      ourCost: '12',
      clientCharge: '20',
      taxStatus: 'TAX',
      notificationsEnabled: true,
      reminderLanguage: 'HY',
      startDate: null,
      renewalDate: null,
      notes: null,
    } as ClientServiceRecord);

    expect(clientServiceFormToPayload(withProduct).productId).toBe('product-1');
    expect(clientServiceFormToPayload({ ...withProduct, productId: '  ' }).productId).toBeNull();
  });
});
