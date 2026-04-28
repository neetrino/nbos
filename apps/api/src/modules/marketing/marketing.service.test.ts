import { beforeEach, describe, expect, it } from 'vitest';
import { MarketingService } from './marketing.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('MarketingService', () => {
  let service: MarketingService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new MarketingService(prisma as never);
  });

  it('returns account and activity attribution options for a channel', async () => {
    prisma.marketingAccount.findMany.mockResolvedValue([
      { id: 'account-1', name: 'List.am 1', channel: 'LIST_AM', phone: '+374' },
    ]);
    prisma.marketingActivity.findMany.mockResolvedValue([
      { id: 'activity-1', title: 'List.am push', channel: 'LIST_AM', status: 'LAUNCHED' },
    ]);

    const result = await service.getAttributionOptions('list_am');

    expect(result).toEqual([
      {
        id: 'account-1',
        label: 'List.am 1',
        type: 'ACCOUNT',
        channel: 'LIST_AM',
        subtitle: '+374',
      },
      {
        id: 'activity-1',
        label: 'List.am push',
        type: 'ACTIVITY',
        channel: 'LIST_AM',
        subtitle: 'LAUNCHED',
      },
    ]);
  });

  it('adds organic option for social channels', async () => {
    prisma.marketingAccount.findMany.mockResolvedValue([]);
    prisma.marketingActivity.findMany.mockResolvedValue([]);

    const result = await service.getAttributionOptions('META_ADS');

    expect(result).toContainEqual({
      id: 'organic:META_ADS',
      label: 'Organic / Not from ad',
      type: 'ORGANIC',
      channel: 'META_ADS',
    });
  });
});
