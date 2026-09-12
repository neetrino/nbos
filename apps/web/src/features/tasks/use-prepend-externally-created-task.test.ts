import { describe, expect, it } from 'vitest';
import type { Task } from '@/lib/api/tasks';
import { prependCreatedTask } from './use-prepend-externally-created-task';

describe('prependCreatedTask', () => {
  it('inserts a created task without a full reload and de-dupes by id', () => {
    const existing = { id: 't1' } as Task;
    const created = { id: 't2' } as Task;
    expect(prependCreatedTask([existing], created).map((task) => task.id)).toEqual(['t2', 't1']);
    expect(prependCreatedTask([created, existing], created).map((task) => task.id)).toEqual([
      't2',
      't1',
    ]);
  });
});
