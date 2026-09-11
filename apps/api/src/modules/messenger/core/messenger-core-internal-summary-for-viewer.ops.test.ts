import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadAccessibleInternalConversationSummary } from './messenger-core-internal-summary-for-viewer.ops';

const loadMessengerLegacyAccess = vi.fn();
const listAccessibleInternalConversationsByIds = vi.fn();

vi.mock('../access/messenger-legacy-channel-access.op', () => ({
  loadMessengerLegacyAccess: (...args: unknown[]) => loadMessengerLegacyAccess(...args),
}));

vi.mock('./messenger-core-internal-list.ops', () => ({
  listAccessibleInternalConversationsByIds: (...args: unknown[]) =>
    listAccessibleInternalConversationsByIds(...args),
}));

const SUMMARY = {
  id: 'conv-task',
  zone: 'INTERNAL',
  type: 'TASK',
  title: 'Ship cache fix',
  status: 'ACTIVE',
  canonicalKey: 'task:task-1',
  createdAt: new Date('2026-09-11T10:00:00.000Z'),
  lastMessageAt: new Date('2026-09-11T12:00:00.000Z'),
  lastMessagePreview: 'First note',
  unreadCount: 0,
  peerEmployeeId: null,
  peerName: null,
  isFavorite: false,
  canWrite: true,
};

describe('loadAccessibleInternalConversationSummary', () => {
  const prisma = {} as never;

  beforeEach(() => {
    loadMessengerLegacyAccess.mockReset();
    listAccessibleInternalConversationsByIds.mockReset();
  });

  it('returns null without listing when Messenger VIEW is NONE', async () => {
    loadMessengerLegacyAccess.mockResolvedValue({
      employeeId: 'emp-1',
      viewScope: 'NONE',
      editScope: 'NONE',
    });
    await expect(
      loadAccessibleInternalConversationSummary(prisma, 'emp-1', 'conv-task'),
    ).resolves.toBeNull();
    expect(listAccessibleInternalConversationsByIds).not.toHaveBeenCalled();
  });

  it('returns null when the employee has no Messenger access row', async () => {
    loadMessengerLegacyAccess.mockResolvedValue(null);
    await expect(
      loadAccessibleInternalConversationSummary(prisma, 'emp-1', 'conv-task'),
    ).resolves.toBeNull();
    expect(listAccessibleInternalConversationsByIds).not.toHaveBeenCalled();
  });

  it('returns the inbox list item from the canonical by-ids mapper', async () => {
    loadMessengerLegacyAccess.mockResolvedValue({
      employeeId: 'emp-1',
      viewScope: 'OWN',
      editScope: 'OWN',
    });
    listAccessibleInternalConversationsByIds.mockResolvedValue([SUMMARY]);
    const tasksAccess = { employeeId: 'emp-1', departmentIds: [], viewScope: 'OWN' };
    await expect(
      loadAccessibleInternalConversationSummary(prisma, 'emp-1', 'conv-task', tasksAccess),
    ).resolves.toEqual(SUMMARY);
    expect(listAccessibleInternalConversationsByIds).toHaveBeenCalledWith(
      prisma,
      'emp-1',
      'OWN',
      ['conv-task'],
      'OWN',
      tasksAccess,
    );
  });

  it('returns null when inbox ACL does not include the conversation', async () => {
    loadMessengerLegacyAccess.mockResolvedValue({
      employeeId: 'emp-1',
      viewScope: 'OWN',
      editScope: 'OWN',
    });
    listAccessibleInternalConversationsByIds.mockResolvedValue([]);
    await expect(
      loadAccessibleInternalConversationSummary(prisma, 'emp-1', 'conv-task'),
    ).resolves.toBeNull();
  });
});
