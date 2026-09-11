import { describe, expect, it } from 'vitest';
import { messengerAuthorizationEpoch } from './messenger-core-auth-epoch';
import { digestMessengerGrantSet } from './messenger-core-grant-epoch';
import { digestTaskIdSet } from './messenger-core-task-acl-epoch';
import { MESSENGER_TASK_ACL_BYPASS_SENTINEL } from './messenger-core-revision.constants';

const BASE = {
  employeeId: 'e1',
  viewScope: 'OWN',
  editScope: 'OWN',
  clientReadScope: 'NONE',
  clientSendScope: 'NONE',
};

describe('Messenger authorization epoch', () => {
  it('changes when the Task assignment set changes under the same RBAC scope', () => {
    const first = messengerAuthorizationEpoch({
      ...BASE,
      zone: 'INTERNAL',
      tasksViewScope: 'OWN',
      departmentIds: ['d1'],
      taskAclDigest: digestTaskIdSet(['task-a', 'task-b']),
    });
    const removed = messengerAuthorizationEpoch({
      ...BASE,
      zone: 'INTERNAL',
      tasksViewScope: 'OWN',
      departmentIds: ['d1'],
      taskAclDigest: digestTaskIdSet(['task-a']),
    });
    expect(first).not.toBe(removed);
  });

  it('is stable when the same Task IDs are reordered', () => {
    expect(digestTaskIdSet(['b', 'a'])).toBe(digestTaskIdSet(['a', 'b']));
  });

  it('uses a stable Task VIEW ALL sentinel', () => {
    const first = messengerAuthorizationEpoch({
      ...BASE,
      zone: 'INTERNAL',
      tasksViewScope: 'ALL',
      taskAclDigest: MESSENGER_TASK_ACL_BYPASS_SENTINEL,
    });
    const second = messengerAuthorizationEpoch({
      ...BASE,
      zone: 'INTERNAL',
      tasksViewScope: 'ALL',
      taskAclDigest: MESSENGER_TASK_ACL_BYPASS_SENTINEL,
    });
    expect(first).toBe(second);
  });

  it('changes the Internal epoch when a grant expires under the same RBAC scope', () => {
    const active = messengerAuthorizationEpoch({
      ...BASE,
      zone: 'INTERNAL',
      grantAclDigest: digestMessengerGrantSet([
        { conversationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', level: 'VIEW' },
        { conversationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', level: 'EDIT' },
      ]),
    });
    const expired = messengerAuthorizationEpoch({
      ...BASE,
      zone: 'INTERNAL',
      grantAclDigest: digestMessengerGrantSet([
        { conversationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', level: 'VIEW' },
      ]),
    });
    expect(active).not.toBe(expired);
  });

  it('does not include Task ACL data on the Client epoch', () => {
    const without = messengerAuthorizationEpoch({ ...BASE, zone: 'CLIENT' });
    const withTask = messengerAuthorizationEpoch({
      ...BASE,
      zone: 'CLIENT',
      tasksViewScope: 'OWN',
      departmentIds: ['d1'],
      taskAclDigest: digestTaskIdSet(['secret-task']),
    });
    expect(without).toBe(withTask);
    expect(JSON.stringify({ ...BASE, zone: 'CLIENT', taskAclDigest: 'secret-task' })).toContain(
      'secret-task',
    );
    expect(without).not.toMatch(/secret-task/);
  });
});
