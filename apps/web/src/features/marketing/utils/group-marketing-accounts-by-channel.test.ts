import { describe, expect, it } from 'vitest';
import type { MarketingAccount, MarketingCrmWhereOption } from '@/lib/api/marketing';
import {
  groupMarketingAccountsByChannel,
  resolveMarketingChannelOrder,
} from './group-marketing-accounts-by-channel';

function account(id: string, channel: string): MarketingAccount {
  return {
    id,
    channel,
    name: id,
    identifier: null,
    phone: null,
    status: 'ACTIVE',
    financeExpensePlanId: null,
    defaultCost: null,
    ownerId: null,
    notes: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('groupMarketingAccountsByChannel', () => {
  it('follows CRM Where sort order and hides empty channels', () => {
    const whereRows: MarketingCrmWhereOption[] = [
      { channel: 'SEO', label: 'SEO', sortOrder: 2, isActive: true },
      { channel: 'LIST_AM', label: 'List.am', sortOrder: 0, isActive: true },
      { channel: 'WEBSITE', label: 'Website', sortOrder: 1, isActive: false },
    ];
    const groups = groupMarketingAccountsByChannel(
      [account('b', 'WEBSITE'), account('a', 'LIST_AM')],
      resolveMarketingChannelOrder(whereRows),
    );
    expect(groups.map((group) => group.channel)).toEqual(['LIST_AM', 'WEBSITE']);
    expect(groups[0]?.accounts.map((row) => row.id)).toEqual(['a']);
  });

  it('appends accounts whose channel is missing from Where order', () => {
    const groups = groupMarketingAccountsByChannel([account('x', 'OFFLINE')], ['LIST_AM']);
    expect(groups.map((group) => group.channel)).toEqual(['OFFLINE']);
  });
});
