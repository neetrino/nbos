import {
  MESSENGER_WS_SERVER_CHANNEL_MESSAGE,
  MESSENGER_WS_SERVER_CHANNEL_PEER_READ,
  MESSENGER_WS_SERVER_CHANNEL_TYPING,
  MESSENGER_WS_SERVER_DM_MESSAGE,
  MESSENGER_WS_SERVER_DM_PEER_READ,
  MESSENGER_WS_SERVER_DM_TYPING,
  MESSENGER_WS_SERVER_PRESENCE,
  MESSENGER_WS_SERVER_PRESENCE_SNAPSHOT,
  MESSENGER_WS_SERVER_READ_UPDATED,
} from '@nbos/shared';
import type { MessengerMessageRow } from '@/lib/api/messenger';
import type { MessengerWsChannelPeerReadPayload, MessengerWsDmPeerReadPayload } from '@nbos/shared';
import { isMessengerListReadPayload } from '@/features/messenger-internal/messenger-realtime-list-read';
import {
  parseChannelMessage,
  parseChannelPeerRead,
  parseChannelTyping,
  parseDmMessage,
  parseDmPeerRead,
  parseDmTyping,
  parsePresenceDelta,
  parsePresenceSnapshot,
} from './messenger-legacy-parse';
import type { MessengerClientSocket } from './messenger-socket-client';

export type MessengerLegacyListener = {
  onChannelMessage?: (channelId: string, message: MessengerMessageRow) => void;
  onDmMessage?: (counterpartId: string, message: MessengerMessageRow) => void;
  onChannelTyping?: (payload: { channelId: string; employeeId: string; label: string }) => void;
  onDmTyping?: (payload: { counterpartId: string; employeeId: string; label: string }) => void;
  onPresenceSnapshot?: (employeeIds: readonly string[]) => void;
  onPresenceDelta?: (employeeId: string, state: 'online' | 'offline') => void;
  onReadLists?: () => void;
  onDmPeerRead?: (payload: MessengerWsDmPeerReadPayload) => void;
  onChannelPeerRead?: (payload: MessengerWsChannelPeerReadPayload) => void;
};

export type MessengerLegacyFanout = {
  onChannelMessage: (channelId: string, message: MessengerMessageRow) => void;
  onDmMessage: (counterpartId: string, message: MessengerMessageRow) => void;
  onChannelTyping: (payload: { channelId: string; employeeId: string; label: string }) => void;
  onDmTyping: (payload: { counterpartId: string; employeeId: string; label: string }) => void;
  onPresenceSnapshot: (employeeIds: readonly string[]) => void;
  onPresenceDelta: (employeeId: string, state: 'online' | 'offline') => void;
  onReadLists: () => void;
  onDmPeerRead: (payload: MessengerWsDmPeerReadPayload) => void;
  onChannelPeerRead: (payload: MessengerWsChannelPeerReadPayload) => void;
};

export function bindMessengerLegacySocket(
  socket: MessengerClientSocket,
  fanout: MessengerLegacyFanout,
): void {
  bindLegacyMessages(socket, fanout);
  bindLegacyPresence(socket, fanout);
  bindLegacyReceipts(socket, fanout);
}

function bindLegacyMessages(socket: MessengerClientSocket, fanout: MessengerLegacyFanout): void {
  socket.on(MESSENGER_WS_SERVER_CHANNEL_MESSAGE, (payload: unknown) => {
    const message = parseChannelMessage(payload);
    if (message) fanout.onChannelMessage(message.channelId, message.message);
  });
  socket.on(MESSENGER_WS_SERVER_DM_MESSAGE, (payload: unknown) => {
    const message = parseDmMessage(payload);
    if (message) fanout.onDmMessage(message.counterpartId, message.message);
  });
  socket.on(MESSENGER_WS_SERVER_CHANNEL_TYPING, (payload: unknown) => {
    const typing = parseChannelTyping(payload);
    if (typing) fanout.onChannelTyping(typing);
  });
  socket.on(MESSENGER_WS_SERVER_DM_TYPING, (payload: unknown) => {
    const typing = parseDmTyping(payload);
    if (typing) fanout.onDmTyping(typing);
  });
}

function bindLegacyPresence(socket: MessengerClientSocket, fanout: MessengerLegacyFanout): void {
  socket.on(MESSENGER_WS_SERVER_PRESENCE_SNAPSHOT, (payload: unknown) => {
    fanout.onPresenceSnapshot(parsePresenceSnapshot(payload));
  });
  socket.on(MESSENGER_WS_SERVER_PRESENCE, (payload: unknown) => {
    const delta = parsePresenceDelta(payload);
    if (delta) fanout.onPresenceDelta(delta.employeeId, delta.state);
  });
}

function bindLegacyReceipts(socket: MessengerClientSocket, fanout: MessengerLegacyFanout): void {
  socket.on(MESSENGER_WS_SERVER_READ_UPDATED, (payload: unknown) => {
    if (isMessengerListReadPayload(payload)) fanout.onReadLists();
  });
  socket.on(MESSENGER_WS_SERVER_DM_PEER_READ, (payload: unknown) => {
    const peer = parseDmPeerRead(payload);
    if (peer) fanout.onDmPeerRead(peer);
  });
  socket.on(MESSENGER_WS_SERVER_CHANNEL_PEER_READ, (payload: unknown) => {
    const peer = parseChannelPeerRead(payload);
    if (peer) fanout.onChannelPeerRead(peer);
  });
}
