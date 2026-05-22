import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';

import { BonusPoliciesService } from './bonus-policies.service';

describe('BonusPoliciesService', () => {
  it('lists policies with profile counts', async () => {
    const prisma = {
      bonusPolicy: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'bp1',
            name: 'Sales',
            templateCode: 'SALES_COMPANY_RATES',
            status: 'ACTIVE',
            scope: 'COMPANY',
            notes: null,
            createdAt: new Date('2026-01-01'),
            updatedAt: new Date('2026-01-01'),
          },
        ]),
      },
      compensationProfile: {
        groupBy: vi.fn().mockResolvedValue([{ bonusPolicyId: 'bp1', _count: { _all: 2 } }]),
        count: vi.fn(),
      },
    };
    const service = new BonusPoliciesService(prisma as never);
    const result = await service.list();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.linkedProfileCount).toBe(2);
  });

  it('throws when policy missing', async () => {
    const prisma = {
      bonusPolicy: { findUnique: vi.fn().mockResolvedValue(null) },
      compensationProfile: { count: vi.fn() },
    };
    const service = new BonusPoliciesService(prisma as never);
    await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
  });
});
