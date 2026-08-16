import { describe, expect, it } from 'vitest';
import {
  SUBSCRIPTION_STATUS_FILTER_ALL,
  SUBSCRIPTION_STATUS_FILTER_WORKING,
  SUBSCRIPTION_WORKING_STATUS_API,
} from '@/features/finance/constants/subscription-status-filter';
import {
  buildSubscriptionGridQueryParams,
  buildSubscriptionListApiParams,
  buildSubscriptionListQuery,
} from './build-subscription-list-query';

describe('buildSubscriptionListApiParams', () => {
  it('does not include page size', () => {
    const p = buildSubscriptionListApiParams({
      search: '',
      filters: {},
      partnerIdFromUrl: null,
    });
    expect(p).not.toHaveProperty('pageSize');
    expect(p).not.toHaveProperty('page');
  });

  it('defaults missing and working filters to pending and active', () => {
    const empty = buildSubscriptionListApiParams({
      search: '',
      filters: {},
      partnerIdFromUrl: null,
    });
    const working = buildSubscriptionListApiParams({
      search: '',
      filters: { status: SUBSCRIPTION_STATUS_FILTER_WORKING },
      partnerIdFromUrl: null,
    });
    expect(empty.status).toBe(SUBSCRIPTION_WORKING_STATUS_API);
    expect(working.status).toBe(SUBSCRIPTION_WORKING_STATUS_API);
  });

  it('omits status for all statuses', () => {
    const p = buildSubscriptionListApiParams({
      search: '',
      filters: { status: SUBSCRIPTION_STATUS_FILTER_ALL },
      partnerIdFromUrl: null,
    });
    expect(p.status).toBeUndefined();
  });

  it('passes a single status through', () => {
    const p = buildSubscriptionListApiParams({
      search: '',
      filters: { status: 'CANCELLED' },
      partnerIdFromUrl: null,
    });
    expect(p.status).toBe('CANCELLED');
  });
});

describe('buildSubscriptionGridQueryParams', () => {
  it('uses the same status mapping as the list', () => {
    expect(
      buildSubscriptionGridQueryParams({
        year: 2026,
        search: '',
        filters: {},
        partnerIdFromUrl: null,
      }).status,
    ).toBe(SUBSCRIPTION_WORKING_STATUS_API);
    expect(
      buildSubscriptionGridQueryParams({
        year: 2026,
        search: '',
        filters: { status: SUBSCRIPTION_STATUS_FILTER_ALL },
        partnerIdFromUrl: null,
      }).status,
    ).toBeUndefined();
    expect(
      buildSubscriptionGridQueryParams({
        year: 2026,
        search: '',
        filters: { status: 'ON_HOLD' },
        partnerIdFromUrl: null,
      }).status,
    ).toBe('ON_HOLD');
  });
});

describe('buildSubscriptionListQuery', () => {
  it('uses partner filter when set', () => {
    const q = buildSubscriptionListQuery({
      search: '',
      filters: { partner: 'p1' },
      partnerIdFromUrl: 'p2',
    });
    expect(q.partnerId).toBe('p1');
  });

  it('falls back to partnerId from URL when filter is all', () => {
    const q = buildSubscriptionListQuery({
      search: '',
      filters: { partner: 'all' },
      partnerIdFromUrl: 'p-url',
    });
    expect(q.partnerId).toBe('p-url');
  });

  it('uses URL partner when filter absent', () => {
    const q = buildSubscriptionListQuery({
      search: '',
      filters: {},
      partnerIdFromUrl: 'p-url',
    });
    expect(q.partnerId).toBe('p-url');
  });

  it('includes page size 100', () => {
    const q = buildSubscriptionListQuery({
      search: '',
      filters: {},
      partnerIdFromUrl: null,
    });
    expect(q.pageSize).toBe(100);
  });
});
