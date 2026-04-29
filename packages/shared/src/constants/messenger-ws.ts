/** Minimum gap between typing fan-out per socket (client + server aligned). */
export const MESSENGER_TYPING_EMIT_MIN_MS = 2_000;

/** Socket.IO namespace for internal messenger (must match API gateway). */
export const MESSENGER_SOCKET_NAMESPACE = '/messenger';

/** Client → server: join a channel room for live messages. */
export const MESSENGER_WS_CLIENT_SUBSCRIBE_CHANNEL = 'messenger.subscribe_channel';

/** Server → client: new channel message persisted. */
export const MESSENGER_WS_SERVER_CHANNEL_MESSAGE = 'messenger.channel.message';

/** Server → client: new DM persisted (`counterpartId` is the other participant). */
export const MESSENGER_WS_SERVER_DM_MESSAGE = 'messenger.dm.message';

/** Client → server: ephemeral typing in a channel (server throttles). */
export const MESSENGER_WS_CLIENT_TYPING_CHANNEL = 'messenger.typing_channel';

/** Client → server: ephemeral typing in a DM to `recipientId`. */
export const MESSENGER_WS_CLIENT_TYPING_DM = 'messenger.typing_dm';

/** Server → client: someone else is typing in the channel (`label` is first name or fallback). */
export const MESSENGER_WS_SERVER_CHANNEL_TYPING = 'messenger.channel.typing';

/** Server → client: DM peer is typing (`counterpartId` is the typist from your perspective). */
export const MESSENGER_WS_SERVER_DM_TYPING = 'messenger.dm.typing';

/** Server → client: employee joined or left `/messenger` (reference-counted per employee). */
export const MESSENGER_WS_SERVER_PRESENCE = 'messenger.presence';

/** Server → client (this socket only): ids currently connected to `/messenger`. */
export const MESSENGER_WS_SERVER_PRESENCE_SNAPSHOT = 'messenger.presence.snapshot';

/** Server → client: read cursors for `employeeId` changed; fan-out to `messenger:user:{employeeId}` only. */
export const MESSENGER_WS_SERVER_READ_UPDATED = 'messenger.read.updated';

/** Payload `scope` for {@link MESSENGER_WS_SERVER_READ_UPDATED} (re-fetch channel + DM list unread). */
export const MESSENGER_WS_READ_UPDATED_SCOPE = {
  LISTS: 'lists',
} as const;

export type MessengerWsReadUpdatedScope =
  (typeof MESSENGER_WS_READ_UPDATED_SCOPE)[keyof typeof MESSENGER_WS_READ_UPDATED_SCOPE];

export interface MessengerWsReadUpdatedPayload {
  scope: MessengerWsReadUpdatedScope;
}

/** Server → client: DM peer advanced their read cursor (notify the other participant). */
export const MESSENGER_WS_SERVER_DM_PEER_READ = 'messenger.dm.peer_read';

export interface MessengerWsDmPeerReadPayload {
  /** Employee who marked read (viewer of the receipt). */
  counterpartId: string;
  threadId: string;
  /** ISO-8601 instant of their stored read cursor. */
  lastReadAt: string;
}

export function messengerSocketUserRoom(employeeId: string): string {
  return `messenger:user:${employeeId}`;
}

export function messengerSocketChannelRoom(channelId: string): string {
  return `messenger:channel:${channelId}`;
}
