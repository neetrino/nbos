import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { buildWorkSpaceParticipationWhere } from '../../tasks/task-workspace-access.op';
import { requireWorkSpaceEntityAccess } from './messenger-core-entity-access.ops';

const WORKSPACE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0002';
const STANDALONE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0003';
const EXTENSION_WS_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0006';
const PRODUCT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001';
const PROJECT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0005';
const EMPLOYEE_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const TASKS_VIEW_OWN = 'OWN';
const TASKS_VIEW_ALL = 'ALL';
const TASKS_VIEW_NONE = 'NONE';

function createPrisma() {
  return {
    workSpace: { findUnique: vi.fn(), findFirst: vi.fn() },
  };
}

function orgLevelRow() {
  return {
    id: STANDALONE_ID,
    name: 'CEO planning',
    productId: null,
    projectId: null,
    extensionId: null,
    type: 'STANDALONE_OPERATIONAL',
  };
}

describe('requireWorkSpaceEntityAccess', () => {
  it('queries buildWorkSpaceParticipationWhere and allows org-level standalone with TASKS.VIEW', async () => {
    const prisma = createPrisma();
    prisma.workSpace.findUnique.mockResolvedValue(orgLevelRow());
    prisma.workSpace.findFirst.mockImplementation(async (args: { where: unknown }) => {
      expect(args.where).toEqual({
        id: STANDALONE_ID,
        ...buildWorkSpaceParticipationWhere([EMPLOYEE_ID]),
      });
      return null;
    });
    const row = await requireWorkSpaceEntityAccess(
      prisma as never,
      STANDALONE_ID,
      EMPLOYEE_ID,
      TASKS_VIEW_OWN,
    );
    expect(row.id).toBe(STANDALONE_ID);
    expect(row.type).toBe('STANDALONE_OPERATIONAL');
    expect(prisma.workSpace.findFirst).toHaveBeenCalledTimes(1);
  });

  it('404s org-level standalone when TASKS.VIEW is NONE even if MESSENGER.VIEW would be ALL', async () => {
    const prisma = createPrisma();
    prisma.workSpace.findUnique.mockResolvedValue(orgLevelRow());
    prisma.workSpace.findFirst.mockResolvedValue(null);
    await expect(
      requireWorkSpaceEntityAccess(prisma as never, STANDALONE_ID, EMPLOYEE_ID, TASKS_VIEW_NONE),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      requireWorkSpaceEntityAccess(prisma as never, STANDALONE_ID, EMPLOYEE_ID, undefined),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows standalone task involvement via participation without TASKS.VIEW fallback', async () => {
    const prisma = createPrisma();
    prisma.workSpace.findUnique.mockResolvedValue(orgLevelRow());
    prisma.workSpace.findFirst.mockImplementation(async (args: { where: unknown }) => {
      expect(args.where).toEqual({
        id: STANDALONE_ID,
        ...buildWorkSpaceParticipationWhere([EMPLOYEE_ID]),
      });
      return { id: STANDALONE_ID };
    });
    const row = await requireWorkSpaceEntityAccess(
      prisma as never,
      STANDALONE_ID,
      EMPLOYEE_ID,
      TASKS_VIEW_NONE,
    );
    expect(row.id).toBe(STANDALONE_ID);
  });

  it('does not use TASKS.VIEW bypass for Extension Work Spaces', async () => {
    const prisma = createPrisma();
    prisma.workSpace.findUnique.mockResolvedValue({
      id: EXTENSION_WS_ID,
      name: 'Extension space',
      productId: null,
      projectId: PROJECT_ID,
      extensionId: 'ext-1',
      type: 'EXTENSION_DELIVERY',
    });
    prisma.workSpace.findFirst.mockImplementation(async (args: { where: unknown }) => {
      expect(args.where).toEqual({
        id: EXTENSION_WS_ID,
        ...buildWorkSpaceParticipationWhere([EMPLOYEE_ID]),
      });
      return null;
    });
    await expect(
      requireWorkSpaceEntityAccess(prisma as never, EXTENSION_WS_ID, EMPLOYEE_ID, TASKS_VIEW_ALL),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns Connected Work Space without TASKS.VIEW and without participation findFirst', async () => {
    const prisma = createPrisma();
    prisma.workSpace.findUnique.mockResolvedValue({
      id: WORKSPACE_ID,
      name: 'Website space',
      productId: PRODUCT_ID,
      projectId: PROJECT_ID,
      extensionId: null,
      type: 'PRODUCT_DELIVERY',
    });
    const row = await requireWorkSpaceEntityAccess(
      prisma as never,
      WORKSPACE_ID,
      EMPLOYEE_ID,
      TASKS_VIEW_NONE,
    );
    expect(row.productId).toBe(PRODUCT_ID);
    expect(prisma.workSpace.findFirst).not.toHaveBeenCalled();
  });
});
