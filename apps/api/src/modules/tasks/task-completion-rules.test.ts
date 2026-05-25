import { describe, expect, it } from 'vitest';

import { buildTaskCompletionBlockers } from './task-completion-rules';

const baseTask = {
  status: 'IN_PROGRESS',
  reviewApprovedAt: null,
  completionRules: [{ type: 'requires_review', enabled: true }],
  checklists: [],
  subtasks: [],
};

describe('buildTaskCompletionBlockers requires_review', () => {
  it('blocks when review not requested', () => {
    const blockers = buildTaskCompletionBlockers(baseTask);
    expect(blockers.some((b) => b.code === 'REVIEW_NOT_REQUESTED')).toBe(true);
  });

  it('blocks when in review but not approved', () => {
    const blockers = buildTaskCompletionBlockers({
      ...baseTask,
      status: 'REVIEW',
    });
    expect(blockers.some((b) => b.code === 'REVIEW_NOT_APPROVED')).toBe(true);
  });

  it('passes when review approved', () => {
    const blockers = buildTaskCompletionBlockers({
      ...baseTask,
      status: 'REVIEW',
      reviewApprovedAt: new Date(),
    });
    expect(blockers).toHaveLength(0);
  });
});
