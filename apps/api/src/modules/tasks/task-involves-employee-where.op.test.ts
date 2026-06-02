import { describe, expect, it } from 'vitest';
import { taskWhereInvolvesEmployee } from './task-involves-employee-where.op';

describe('taskWhereInvolvesEmployee', () => {
  it('includes project team participation', () => {
    const where = taskWhereInvolvesEmployee('emp-1');
    const clauses = where.OR ?? [];
    expect(clauses).toEqual(expect.arrayContaining([{ assigneeId: 'emp-1' }]));
    expect(clauses.some((c) => 'product' in c || 'workspace' in c || 'extension' in c)).toBe(true);
  });
});
