import { describe, expect, it, vi } from 'vitest';

import { notifyTaskReviewRequested } from './task-review-notify.op';

describe('notifyTaskReviewRequested', () => {
  it('notifies reviewer when set', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'n1' });
    await notifyTaskReviewRequested({ create } as never, {
      taskId: 't1',
      taskCode: 'TASK-1',
      taskTitle: 'Fix bug',
      reviewerId: 'rev-1',
      assigneeId: 'a1',
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: 'rev-1',
        type: 'tasks.review.requested',
      }),
    );
  });

  it('skips when no recipient', async () => {
    const create = vi.fn();
    await notifyTaskReviewRequested({ create } as never, {
      taskId: 't1',
      taskCode: 'TASK-1',
      taskTitle: 'Fix bug',
      reviewerId: null,
      assigneeId: null,
    });
    expect(create).not.toHaveBeenCalled();
  });
});
