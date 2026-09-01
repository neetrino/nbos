import { describe, expect, it } from 'vitest';
import type { Subscription } from '@/lib/api/finance';
import {
  subscriptionCanActivateOrResume,
  subscriptionCanCancel,
  subscriptionCanCreatePeriodInvoice,
  subscriptionCanHold,
} from './subscription-action-eligibility';

function subscriptionWithStatus(status: Subscription['status']): Subscription {
  return {
    id: 'sub-1',
    code: 'SUB-001',
    name: 'Maintenance plan',
    projectId: 'proj-1',
    productId: 'prod-1',
    type: 'MAINTENANCE_ONLY',
    amount: '10000',
    coverageMonthCount: 1,
    monthlyEquivalentAmount: '10000',
    billingFrequency: 'MONTHLY',
    billingDay: 15,
    taxStatus: 'TAX',
    status,
    termMonths: null,
    billingStartDate: '2026-01-15T00:00:00.000Z',
    notificationsEnabled: true,
    reminderLanguage: 'HY',
    endDate: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    project: { id: 'proj-1', code: 'P1', name: 'Project One' },
    invoices: [],
  };
}

describe('subscriptionCanActivateOrResume', () => {
  it('allows PENDING, ON_HOLD, and CANCELLED', () => {
    expect(subscriptionCanActivateOrResume(subscriptionWithStatus('PENDING'))).toBe(true);
    expect(subscriptionCanActivateOrResume(subscriptionWithStatus('ON_HOLD'))).toBe(true);
    expect(subscriptionCanActivateOrResume(subscriptionWithStatus('CANCELLED'))).toBe(true);
    expect(subscriptionCanActivateOrResume(subscriptionWithStatus('ACTIVE'))).toBe(false);
    expect(subscriptionCanActivateOrResume(subscriptionWithStatus('COMPLETED'))).toBe(false);
  });
});

describe('subscriptionCanHold', () => {
  it('allows ACTIVE only', () => {
    expect(subscriptionCanHold(subscriptionWithStatus('ACTIVE'))).toBe(true);
    expect(subscriptionCanHold(subscriptionWithStatus('PENDING'))).toBe(false);
    expect(subscriptionCanHold(subscriptionWithStatus('ON_HOLD'))).toBe(false);
    expect(subscriptionCanHold(subscriptionWithStatus('CANCELLED'))).toBe(false);
    expect(subscriptionCanHold(subscriptionWithStatus('COMPLETED'))).toBe(false);
  });
});

describe('subscriptionCanCancel', () => {
  it('allows PENDING, ACTIVE, and ON_HOLD only', () => {
    expect(subscriptionCanCancel(subscriptionWithStatus('PENDING'))).toBe(true);
    expect(subscriptionCanCancel(subscriptionWithStatus('ACTIVE'))).toBe(true);
    expect(subscriptionCanCancel(subscriptionWithStatus('ON_HOLD'))).toBe(true);
    expect(subscriptionCanCancel(subscriptionWithStatus('CANCELLED'))).toBe(false);
    expect(subscriptionCanCancel(subscriptionWithStatus('COMPLETED'))).toBe(false);
  });
});

describe('subscriptionCanCreatePeriodInvoice', () => {
  it('allows ACTIVE only', () => {
    expect(subscriptionCanCreatePeriodInvoice(subscriptionWithStatus('ACTIVE'))).toBe(true);
    expect(subscriptionCanCreatePeriodInvoice(subscriptionWithStatus('PENDING'))).toBe(false);
    expect(subscriptionCanCreatePeriodInvoice(subscriptionWithStatus('ON_HOLD'))).toBe(false);
    expect(subscriptionCanCreatePeriodInvoice(subscriptionWithStatus('CANCELLED'))).toBe(false);
    expect(subscriptionCanCreatePeriodInvoice(subscriptionWithStatus('COMPLETED'))).toBe(false);
  });
});
