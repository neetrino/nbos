import { describe, expect, it } from 'vitest';
import { taskWhereInvolvesEmployee } from './task-involves-employee-where.op';

describe('taskWhereInvolvesEmployee', () => {
  it('matches personal marks only, not project team', () => {
    const where = taskWhereInvolvesEmployee('emp-1');
    const clauses = where.OR ?? [];
    expect(clauses).toEqual(
      expect.arrayContaining([
        { assigneeId: { in: ['emp-1'] } },
        { creatorId: { in: ['emp-1'] } },
        { reviewerId: { in: ['emp-1'] } },
        { coAssignees: { hasSome: ['emp-1'] } },
        { observers: { hasSome: ['emp-1'] } },
      ]),
    );
    expect(clauses.some((c) => 'product' in c || 'workspace' in c || 'extension' in c)).toBe(false);
  });
});
