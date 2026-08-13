import { describe, expect, it } from 'vitest';
import type { Subscription } from '@/lib/api/finance';
import {
  buildSubscriptionGeneralPatch,
  createSubscriptionGeneralDraft,
} from './subscription-general-form-state';

const baseSubscription: Subscription = {
  id: 'sub-1',
  code: 'SUB-001',
  projectId: 'proj-1',
  productId: 'prod-1',
  type: 'MAINTENANCE_ONLY',
  baseMonthlyAmount: '10000',
  billingFrequency: 'MONTHLY',
  billingDay: 15,
  taxStatus: 'TAX',
  status: 'ACTIVE',
  billingStartDate: '2026-01-15T00:00:00.000Z',
  notificationsEnabled: true,
  reminderLanguage: 'HY',
  endDate: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  project: { id: 'proj-1', code: 'P1', name: 'Project One' },
  invoices: [],
};

describe('buildSubscriptionGeneralPatch billing frequency', () => {
  it('sends billingFrequency and prepaidMonthCount when switching to custom', () => {
    const snap = createSubscriptionGeneralDraft(baseSubscription);
    const draft = { ...snap, billingFrequency: 'CUSTOM', prepaidMonthCount: '6' };
    expect(buildSubscriptionGeneralPatch(snap, draft)).toEqual({
      billingFrequency: 'CUSTOM',
      prepaidMonthCount: 6,
    });
  });

  it('sends billingFrequency without prepaidMonthCount when switching to monthly', () => {
    const snap = createSubscriptionGeneralDraft({
      ...baseSubscription,
      billingFrequency: 'CUSTOM',
      prepaidMonthCount: 6,
    });
    const draft = { ...snap, billingFrequency: 'MONTHLY', prepaidMonthCount: '' };
    expect(buildSubscriptionGeneralPatch(snap, draft)).toEqual({
      billingFrequency: 'MONTHLY',
    });
  });

  it('pairs billingFrequency with prepaidMonthCount when only count changes on custom', () => {
    const snap = createSubscriptionGeneralDraft({
      ...baseSubscription,
      billingFrequency: 'CUSTOM',
      prepaidMonthCount: 4,
    });
    const draft = { ...snap, prepaidMonthCount: '8' };
    expect(buildSubscriptionGeneralPatch(snap, draft)).toEqual({
      billingFrequency: 'CUSTOM',
      prepaidMonthCount: 8,
    });
  });

  it('never sends prepaidMonthCount without billingFrequency', () => {
    const snap = createSubscriptionGeneralDraft({
      ...baseSubscription,
      billingFrequency: 'CUSTOM',
      prepaidMonthCount: 4,
    });
    const draft = { ...snap, prepaidMonthCount: '8' };
    const patch = buildSubscriptionGeneralPatch(snap, draft);
    expect(patch).toHaveProperty('billingFrequency', 'CUSTOM');
    expect(patch).toHaveProperty('prepaidMonthCount', 8);
  });
});
