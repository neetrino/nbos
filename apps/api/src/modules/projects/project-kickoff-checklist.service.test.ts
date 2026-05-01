import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, beforeEach } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { PROJECT_KICKOFF_CHECKLIST_ITEMS } from './project-kickoff-checklist.constants';
import { ProjectKickoffChecklistService } from './project-kickoff-checklist.service';

describe('ProjectKickoffChecklistService', () => {
  let prisma: MockPrisma;
  let service: ProjectKickoffChecklistService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new ProjectKickoffChecklistService(prisma as never);
  });

  it('does not create duplicate checklist rows when canonical items already exist', async () => {
    const existing = PROJECT_KICKOFF_CHECKLIST_ITEMS.map((item) => ({
      id: `item-${item.key}`,
      projectId: 'project-1',
      key: item.key,
      title: item.title,
      isRequired: item.isRequired,
      isChecked: false,
      note: null,
      checkedAt: null,
      checkedById: null,
      sortOrder: item.sortOrder,
    }));
    prisma.projectKickoffChecklistItem.findMany.mockResolvedValue(existing);

    const result = await service.ensureForProject('project-1');

    expect(result).toEqual(existing);
    expect(prisma.projectKickoffChecklistItem.create).not.toHaveBeenCalled();
  });

  it('creates missing canonical rows and returns the refreshed checklist', async () => {
    const refreshed = [{ id: 'new-item', key: 'scope_confirmed', sortOrder: 10 }];
    prisma.projectKickoffChecklistItem.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(refreshed);

    const result = await service.ensureForProject('project-1');

    expect(result).toEqual(refreshed);
    expect(prisma.projectKickoffChecklistItem.create).toHaveBeenCalledTimes(
      PROJECT_KICKOFF_CHECKLIST_ITEMS.length,
    );
  });

  it('updates checked state and note for a project checklist item', async () => {
    prisma.projectKickoffChecklistItem.findFirst.mockResolvedValue({ id: 'item-1' });
    prisma.projectKickoffChecklistItem.update.mockResolvedValue({
      id: 'item-1',
      isChecked: true,
      note: 'Reviewed with seller',
    });

    const result = await service.updateItem('project-1', 'item-1', {
      isChecked: true,
      note: 'Reviewed with seller',
    });

    expect(result).toMatchObject({ id: 'item-1', isChecked: true });
    expect(prisma.projectKickoffChecklistItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'item-1' },
        data: expect.objectContaining({
          isChecked: true,
          checkedAt: expect.any(Date),
          note: 'Reviewed with seller',
        }),
      }),
    );
  });

  it('rejects missing items and empty payloads', async () => {
    await expect(service.updateItem('project-1', 'item-1', {})).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.updateItem('project-1', 'item-1', { isChecked: true })).rejects.toThrow(
      NotFoundException,
    );
  });
});
