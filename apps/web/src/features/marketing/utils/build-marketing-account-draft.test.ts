import { describe, expect, it } from 'vitest';
import type { MarketingAccount } from '@/lib/api/marketing';
import {
  buildMarketingAccountPatch,
  createMarketingAccountDraft,
  isMarketingAccountDraftDirty,
} from './build-marketing-account-draft';

const ACCOUNT: MarketingAccount = {
  id: 'acc-1',
  channel: 'LIST_AM',
  name: 'List.am 1',
  identifier: ' id ',
  phone: '+374',
  status: 'ACTIVE',
  financeExpensePlanId: 'plan-1',
  defaultCost: null,
  ownerId: null,
  notes: ' note ',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('buildMarketingAccountPatch', () => {
  it('treats whitespace-only optional fields as empty and builds a sparse patch', () => {
    const snap = createMarketingAccountDraft(ACCOUNT);
    const draft = {
      ...snap,
      name: 'List.am 2',
      identifier: '   ',
      financeExpensePlanId: '',
    };
    expect(isMarketingAccountDraftDirty(draft, snap)).toBe(true);
    expect(buildMarketingAccountPatch(snap, draft)).toEqual({
      name: 'List.am 2',
      identifier: null,
      financeExpensePlanId: null,
    });
  });
});
