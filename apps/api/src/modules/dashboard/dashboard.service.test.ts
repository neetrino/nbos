import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { PrismaClient } from '@nbos/database';
import { createMockPrisma } from '../../test-utils/mock-prisma';
import { DASHBOARD_NOTE_LIMIT } from './dashboard-note.constants';
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

  it('normalizes bare host URLs to https for personal links', async () => {
    const prisma = createMockPrisma();
    const service = new DashboardService(prisma as unknown as InstanceType<typeof PrismaClient>);

    await service.createPersonalLink('employee-1', {
      label: 'Vendor',
      url: 'vendor.example.com/inbox',
    });

    expect(prisma.personalLink.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          url: 'https://vendor.example.com/inbox',
          openInNewTab: true,
        }),
      }),
    );
  });

  it('normalizes protocol-relative URLs to https for personal links', async () => {
    const prisma = createMockPrisma();
    const service = new DashboardService(prisma as unknown as InstanceType<typeof PrismaClient>);

    await service.createPersonalLink('employee-1', {
      label: 'CDN',
      url: '//cdn.example.com/x',
    });

    expect(prisma.personalLink.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ url: 'https://cdn.example.com/x' }),
      }),
    );
  });

  it('rejects non-http(s) hierarchical URLs for personal links', async () => {
    const prisma = createMockPrisma();
    const service = new DashboardService(prisma as unknown as InstanceType<typeof PrismaClient>);

    await expect(
      service.createPersonalLink('employee-1', { label: 'FTP', url: 'ftp://files.example/' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.personalLink.create).not.toHaveBeenCalled();
  });

  it('deletes only current owner personal links', async () => {
    const prisma = createMockPrisma();
    const service = new DashboardService(prisma as unknown as InstanceType<typeof PrismaClient>);

    await service.deletePersonalLink('employee-1', 'link-1');

    expect(prisma.personalLink.deleteMany).toHaveBeenCalledWith({
      where: { id: 'link-1', ownerId: 'employee-1' },
    });
  });

  it('lists dashboard notes newest first', async () => {
    const prisma = createMockPrisma();
    const createdAt = new Date('2026-05-02T10:00:00.000Z');
    prisma.dashboardNote.findMany.mockResolvedValueOnce([
      {
        id: 'note-1',
        ownerId: 'employee-1',
        content: 'Call finance',
        sortOrder: 0,
        createdAt,
        updatedAt: createdAt,
      },
    ]);
    const service = new DashboardService(prisma as unknown as InstanceType<typeof PrismaClient>);

    const notes = await service.listNotes('employee-1');

    expect(prisma.dashboardNote.findMany).toHaveBeenCalledWith({
      where: { ownerId: 'employee-1' },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: DASHBOARD_NOTE_LIMIT,
    });
    expect(notes).toEqual([
      {
        id: 'note-1',
        content: 'Call finance',
        sortOrder: 0,
        createdAt: '2026-05-02T10:00:00.000Z',
        updatedAt: '2026-05-02T10:00:00.000Z',
      },
    ]);
  });

  it('creates trimmed dashboard notes for the current owner', async () => {
    const prisma = createMockPrisma();
    const createdAt = new Date('2026-05-02T11:00:00.000Z');
    prisma.dashboardNote.create.mockResolvedValueOnce({
      id: 'note-2',
      ownerId: 'employee-1',
      content: 'Review notes',
      sortOrder: 0,
      createdAt,
      updatedAt: createdAt,
    });
    const service = new DashboardService(prisma as unknown as InstanceType<typeof PrismaClient>);

    const note = await service.createNote('employee-1', { content: '  Review notes  ' });

    expect(prisma.dashboardNote.create).toHaveBeenCalledWith({
      data: {
        ownerId: 'employee-1',
        content: 'Review notes',
        sortOrder: 0,
      },
    });
    expect(note.content).toBe('Review notes');
    expect(prisma.dashboardNote.updateMany).toHaveBeenCalledWith({
      where: { ownerId: 'employee-1' },
      data: { sortOrder: { increment: 1 } },
    });
  });

  it('rejects empty dashboard notes', async () => {
    const prisma = createMockPrisma();
    const service = new DashboardService(prisma as unknown as InstanceType<typeof PrismaClient>);

    await expect(service.createNote('employee-1', { content: '   ' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.dashboardNote.create).not.toHaveBeenCalled();
  });

  it('deletes only current owner dashboard notes', async () => {
    const prisma = createMockPrisma();
    const service = new DashboardService(prisma as unknown as InstanceType<typeof PrismaClient>);

    await service.deleteNote('employee-1', 'note-1');

    expect(prisma.dashboardNote.deleteMany).toHaveBeenCalledWith({
      where: { id: 'note-1', ownerId: 'employee-1' },
    });
  });

  it('updates only current owner dashboard notes', async () => {
    const prisma = createMockPrisma();
    const updatedAt = new Date('2026-05-02T12:00:00.000Z');
    prisma.dashboardNote.updateMany.mockResolvedValueOnce({ count: 1 });
    prisma.dashboardNote.findFirst.mockResolvedValueOnce({
      id: 'note-1',
      ownerId: 'employee-1',
      content: 'Updated',
      sortOrder: 2,
      createdAt: updatedAt,
      updatedAt,
    });
    const service = new DashboardService(prisma as unknown as InstanceType<typeof PrismaClient>);

    const note = await service.updateNote('employee-1', 'note-1', { content: ' Updated ' });

    expect(prisma.dashboardNote.updateMany).toHaveBeenCalledWith({
      where: { id: 'note-1', ownerId: 'employee-1' },
      data: { content: 'Updated' },
    });
    expect(note.content).toBe('Updated');
  });

  it('reorders only notes owned by the current user', async () => {
    const prisma = createMockPrisma();
    prisma.dashboardNote.count.mockResolvedValueOnce(2);
    const service = new DashboardService(prisma as unknown as InstanceType<typeof PrismaClient>);

    await service.reorderNotes('employee-1', ['note-2', 'note-1']);

    expect(prisma.dashboardNote.count).toHaveBeenCalledWith({
      where: { ownerId: 'employee-1', id: { in: ['note-2', 'note-1'] } },
    });
    expect(prisma.dashboardNote.updateMany).toHaveBeenCalledWith({
      where: { id: 'note-2', ownerId: 'employee-1' },
      data: { sortOrder: 0 },
    });
    expect(prisma.dashboardNote.updateMany).toHaveBeenCalledWith({
      where: { id: 'note-1', ownerId: 'employee-1' },
      data: { sortOrder: 1 },
    });
  });

  it('rejects duplicate dashboard note order ids', async () => {
    const prisma = createMockPrisma();
    const service = new DashboardService(prisma as unknown as InstanceType<typeof PrismaClient>);

    await expect(service.reorderNotes('employee-1', ['note-1', 'note-1'])).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.dashboardNote.updateMany).not.toHaveBeenCalled();
  });
});
