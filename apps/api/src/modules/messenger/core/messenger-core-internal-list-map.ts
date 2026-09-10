import { conversationCanWrite } from './messenger-core-internal.types';
import type { MessengerInternalConversationListItem } from './messenger-core-internal.types';
import { hiddenTaskDiscussionNoteWhere } from './messenger-task-discussion.metadata';
import { absoluteConversationUnreadCount } from './messenger-core-unread';

export function internalListInclude(employeeId: string) {
  return {
    messages: {
      where: { deletedAt: null, ...hiddenTaskDiscussionNoteWhere() },
      orderBy: { createdAt: 'desc' as const },
      take: 1,
      select: { content: true, senderId: true, createdAt: true },
    },
    readStates: {
      where: { employeeId },
      select: { lastReadAt: true },
    },
    userSettings: {
      where: { employeeId },
      select: { favorite: true },
    },
    participants: {
      where: { leftAt: null },
      select: {
        employeeId: true,
        role: true,
        employee: { select: { firstName: true, lastName: true } },
      },
    },
  };
}

export type InternalListRow = {
  id: string;
  zone: MessengerInternalConversationListItem['zone'];
  type: MessengerInternalConversationListItem['type'];
  title: string | null;
  status: string;
  canonicalKey: string | null;
  createdAt: Date;
  lastMessageAt: Date | null;
  messages: Array<{ content: string; senderId: string | null; createdAt: Date }>;
  readStates: Array<{ lastReadAt: Date }>;
  userSettings: Array<{ favorite: boolean }>;
  participants: Array<{
    employeeId: string;
    role: string;
    employee: { firstName: string; lastName: string };
  }>;
};

export function mapInternalListItem(
  row: InternalListRow,
  employeeId: string,
  editScope: string,
  editGrantIds: Set<string>,
): MessengerInternalConversationListItem {
  const lastReadAt = row.readStates[0]?.lastReadAt ?? null;
  const visible = row.messages[0];
  const unreadCount = absoluteConversationUnreadCount({
    viewerEmployeeId: employeeId,
    latestSenderId: visible?.senderId ?? null,
    lastMessageAt: visible?.createdAt ?? null,
    lastReadAt,
  });
  const peer =
    row.type === 'DIRECT' ? row.participants.find((p) => p.employeeId !== employeeId) : undefined;
  const self = row.participants.find((participant) => participant.employeeId === employeeId);
  return {
    id: row.id,
    zone: 'INTERNAL',
    type: row.type,
    title: row.title,
    status: row.status,
    canonicalKey: row.canonicalKey,
    createdAt: row.createdAt,
    lastMessageAt: visible?.createdAt ?? null,
    lastMessagePreview: visible?.content ?? null,
    unreadCount,
    peerEmployeeId: peer?.employeeId ?? null,
    peerName: peer ? `${peer.employee.firstName} ${peer.employee.lastName}`.trim() : null,
    isFavorite: row.userSettings[0]?.favorite === true,
    canWrite: conversationCanWrite(editScope, self?.role ?? null, editGrantIds.has(row.id)),
  };
}
