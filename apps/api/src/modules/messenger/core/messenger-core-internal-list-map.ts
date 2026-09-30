import { mapPinnedMessagePreview } from './messenger-core-pin-message.ops';
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
      select: { employeeId: true, lastReadAt: true },
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
        employee: { select: { firstName: true, lastName: true, position: true } },
      },
    },
    pinnedMessage: {
      select: { id: true, senderNameSnapshot: true, content: true, deletedAt: true },
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
  readStates: Array<{ employeeId: string; lastReadAt: Date }>;
  userSettings: Array<{ favorite: boolean }>;
  participants: Array<{
    employeeId: string;
    role: string;
    employee: { firstName: string; lastName: string; position: string | null };
  }>;
  pinnedMessage?: {
    id: string;
    senderNameSnapshot: string;
    content: string;
    deletedAt: Date | null;
  } | null;
};

export function mapInternalListItem(
  row: InternalListRow,
  employeeId: string,
  editScope: string,
  editGrantIds: Set<string>,
): MessengerInternalConversationListItem {
  const lastReadAt =
    row.readStates.find((state) => state.employeeId === employeeId)?.lastReadAt ?? null;
  const visible = row.messages[0];
  const activityAt = visible?.createdAt ?? row.lastMessageAt ?? null;
  const lastMessageMine = Boolean(visible?.senderId && visible.senderId === employeeId);
  const lastMessageSeen =
    lastMessageMine && visible
      ? row.readStates.some(
          (state) => state.employeeId !== employeeId && state.lastReadAt >= visible.createdAt,
        )
      : false;
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
    lastMessageAt: activityAt,
    lastMessagePreview: visible?.content ?? null,
    lastMessageMine,
    lastMessageSeen,
    unreadCount,
    peerEmployeeId: peer?.employeeId ?? null,
    peerName: peer ? `${peer.employee.firstName} ${peer.employee.lastName}`.trim() : null,
    peerPosition: peerPositionLabel(peer?.employee.position),
    isFavorite: row.userSettings[0]?.favorite === true,
    canWrite: conversationCanWrite(editScope, self?.role ?? null, editGrantIds.has(row.id)),
    pinnedMessage: mapPinnedMessagePreview(row.pinnedMessage),
  };
}

const PEER_POSITION_MAX_CHARS = 256;

function peerPositionLabel(position: string | null | undefined): string | null {
  const value = position?.trim() ?? '';
  if (!value) return null;
  return value.slice(0, PEER_POSITION_MAX_CHARS);
}
