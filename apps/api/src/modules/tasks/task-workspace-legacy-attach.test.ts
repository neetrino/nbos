import { describe, expect, it, vi } from 'vitest';

import { attachLegacyProductTasksToWorkSpace } from './task-workspace-legacy-attach.op';

describe('attachLegacyProductTasksToWorkSpace', () => {
  it('updates orphan product tasks to the workspace', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 3 });
    const prisma = { task: { updateMany } };

    const count = await attachLegacyProductTasksToWorkSpace(prisma as never, 'ws-1', 'product-1');

    expect(count).toBe(3);
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        workspaceId: null,
        OR: [
          { productId: 'product-1' },
          { links: { some: { entityType: 'PRODUCT', entityId: 'product-1' } } },
        ],
      },
      data: { workspaceId: 'ws-1' },
    });
  });
});
