import { describe, expect, it, vi } from 'vitest';
import {
  expandDriveFolderSubtreeIds,
  buildDriveFolderInheritedFileGrantWhere,
} from './drive-folder-grant-inherit';

describe('expandDriveFolderSubtreeIds', () => {
  it('includes descendants across multiple levels', async () => {
    const prisma = {
      driveFolder: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([{ id: 'child-a' }])
          .mockResolvedValueOnce([{ id: 'grandchild' }])
          .mockResolvedValueOnce([]),
      },
    };

    const ids = await expandDriveFolderSubtreeIds(prisma as never, ['root']);
    expect(ids).toEqual(['root', 'child-a', 'grandchild']);
  });
});

describe('buildDriveFolderInheritedFileGrantWhere', () => {
  it('returns empty set when user has no folder grants', async () => {
    const prisma = {
      driveFolder: { findMany: vi.fn() },
      resourceAccessGrant: { findMany: vi.fn().mockResolvedValue([]) },
    };
    const where = await buildDriveFolderInheritedFileGrantWhere(prisma as never, 'emp-1');
    expect(where).toEqual({ id: { in: [] } });
  });
});
