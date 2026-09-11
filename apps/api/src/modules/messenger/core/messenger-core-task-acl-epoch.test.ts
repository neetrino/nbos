import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  createMessengerTaskAclSnapshot,
  digestTaskIdSet,
  loadAllowedTaskIds,
  loadMessengerTaskAclDigest,
} from './messenger-core-task-acl-epoch';
import { taskConversationListWhere } from './messenger-core-internal-list-where';
import {
  MESSENGER_TASK_ACL_ABSENT_SENTINEL,
  MESSENGER_TASK_ACL_BYPASS_SENTINEL,
} from './messenger-core-revision.constants';

vi.mock('../../tasks/tasks-scoped-access', () => ({
  loadTasksScopedEmployeeIds: vi.fn(async () => ['e1']),
  tasksViewBypassesRowFilter: (scope: string) => scope === 'ALL',
}));

describe('Messenger Task ACL epoch digest', () => {
  it('uses a constant sentinel when Task VIEW bypasses row filtering', async () => {
    const findMany = vi.fn();
    const digest = await loadMessengerTaskAclDigest({ task: { findMany } } as never, {
      employeeId: 'e1',
      departmentIds: ['d1'],
      viewScope: 'ALL',
    });
    expect(digest).toBe(MESSENGER_TASK_ACL_BYPASS_SENTINEL);
    expect(findMany).not.toHaveBeenCalled();
    expect(digest).not.toMatch(/[0-9a-f-]{36}/);
  });

  it('uses a constant sentinel when Task access is absent', async () => {
    expect(await loadMessengerTaskAclDigest({} as never, undefined)).toBe(
      MESSENGER_TASK_ACL_ABSENT_SENTINEL,
    );
  });

  it('re-queries Task ACL on the next operation when the same tasksAccess object is reused', async () => {
    const findMany = vi
      .fn()
      .mockResolvedValueOnce([{ id: 'task-a' }])
      .mockResolvedValueOnce([{ id: 'task-b' }]);
    const prisma = { task: { findMany } };
    const access = { employeeId: 'e1', departmentIds: ['d1'], viewScope: 'OWN' as const };
    const first = await loadAllowedTaskIds(prisma as never, access);
    const second = await loadAllowedTaskIds(prisma as never, access);
    expect(findMany).toHaveBeenCalledTimes(2);
    expect(first).toEqual(['task-a']);
    expect(second).toEqual(['task-b']);
    expect(digestTaskIdSet(first ?? [])).not.toBe(digestTaskIdSet(second ?? []));
  });

  it('reuses one Task ACL snapshot only when threaded within the same operation', async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: 'task-a' }]);
    const prisma = { task: { findMany } };
    const access = { employeeId: 'e1', departmentIds: ['d1'], viewScope: 'OWN' as const };
    const snap = await createMessengerTaskAclSnapshot(prisma as never, access);
    await taskConversationListWhere(prisma as never, access, snap.allowedTaskIds);
    await taskConversationListWhere(prisma as never, access, snap.allowedTaskIds);
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(snap.digest).toBe(digestTaskIdSet(['task-a']));
  });

  it('does not retain a process-lifetime tasksAccess cache', () => {
    const src = readFileSync(
      new URL('./messenger-core-task-acl-epoch.ts', import.meta.url),
      'utf8',
    );
    expect(src).not.toMatch(/WeakMap|new Map|AsyncLocalStorage|TTL/);
  });
});
