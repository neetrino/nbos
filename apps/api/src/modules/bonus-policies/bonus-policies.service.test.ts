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

  it('creates policy with validated template code', async () => {
    const prisma = {
      bonusPolicy: {
        create: vi.fn().mockResolvedValue({
          id: 'bp2',
          name: 'Delivery team',
          templateCode: 'DELIVERY_PROPORTIONAL_FUNDING',
          status: 'ACTIVE',
          scope: 'DELIVERY',
          notes: null,
          createdAt: new Date('2026-05-01'),
          updatedAt: new Date('2026-05-01'),
        }),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      compensationProfile: { groupBy: vi.fn(), count: vi.fn() },
    };
    const service = new BonusPoliciesService(prisma as never);
    const created = await service.create({
      name: 'Delivery team',
      templateCode: 'DELIVERY_PROPORTIONAL_FUNDING',
      scope: 'DELIVERY',
    });
    expect(created.templateCode).toBe('DELIVERY_PROPORTIONAL_FUNDING');
    expect(created.linkedProfileCount).toBe(0);
  });

  it('updates policy metadata and status', async () => {
    const prisma = {
      bonusPolicy: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'bp1',
          name: 'Old',
          templateCode: 'MANUAL_ONLY',
          status: 'ACTIVE',
          scope: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        update: vi.fn().mockResolvedValue({
          id: 'bp1',
          name: 'Renamed',
          templateCode: 'MANUAL_ONLY',
          status: 'ARCHIVED',
          scope: 'COMPANY',
          notes: 'Retired',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        findMany: vi.fn(),
        create: vi.fn(),
      },
      compensationProfile: {
        count: vi.fn().mockResolvedValue(1),
        groupBy: vi.fn(),
      },
    };
    const service = new BonusPoliciesService(prisma as never);
    const updated = await service.update('bp1', {
      name: 'Renamed',
      status: 'ARCHIVED',
      notes: 'Retired',
      scope: 'COMPANY',
    });
    expect(updated.status).toBe('ARCHIVED');
    expect(updated.linkedProfileCount).toBe(1);
  });
});
