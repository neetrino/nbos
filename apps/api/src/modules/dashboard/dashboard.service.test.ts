import { describe, expect, it } from 'vitest';
import { PrismaClient } from '@nbos/database';
import { createMockPrisma } from '../../test-utils/mock-prisma';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  it('creates role-based finance defaults and includes personal links', async () => {
    const prisma = createMockPrisma();
    prisma.employee.findUnique.mockResolvedValueOnce({
      id: 'employee-1',
      role: { slug: 'finance', name: 'Finance' },
    });
    prisma.personalLink.findMany.mockResolvedValueOnce([
      {
        id: 'link-1',
        ownerId: 'employee-1',
        label: 'Bank portal',
        url: 'https://bank.example.com',
        placement: ['DASHBOARD_PINNED_ACTIONS'],
        openInNewTab: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const service = new DashboardService(prisma as unknown as InstanceType<typeof PrismaClient>);
    const projection = await service.getControlCenterProjection('employee-1');

    expect(projection.preference.pinnedActionOrder).toEqual([
      'open-invoices',
      'open-expenses',
      'open-payroll',
      'open-calendar',
    ]);
    expect(projection.personalLinks).toEqual([
      expect.objectContaining({
        label: 'Bank portal',
        isExternal: true,
      }),
    ]);
  });

  it('creates personal dashboard links with safe defaults', async () => {
    const prisma = createMockPrisma();
    const service = new DashboardService(prisma as unknown as InstanceType<typeof PrismaClient>);

    await service.createPersonalLink('employee-1', {
      label: 'Reports',
      url: '/reports',
    });

    expect(prisma.personalLink.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ownerId: 'employee-1',
          label: 'Reports',
          url: '/reports',
          placement: ['SIDEBAR', 'DASHBOARD_PINNED_ACTIONS'],
          openInNewTab: false,
        }),
      }),
    );
  });

  it('deletes only current owner personal links', async () => {
    const prisma = createMockPrisma();
    const service = new DashboardService(prisma as unknown as InstanceType<typeof PrismaClient>);

    await service.deletePersonalLink('employee-1', 'link-1');

    expect(prisma.personalLink.deleteMany).toHaveBeenCalledWith({
      where: { id: 'link-1', ownerId: 'employee-1' },
    });
  });
});
