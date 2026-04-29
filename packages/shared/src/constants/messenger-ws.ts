/** Socket.IO namespace for internal messenger (must match API gateway). */
export const MESSENGER_SOCKET_NAMESPACE = '/messenger';

/** Client → server: join a channel room for live messages. */
export const MESSENGER_WS_CLIENT_SUBSCRIBE_CHANNEL = 'messenger.subscribe_channel';

/** Server → client: new channel message persisted. */
export const MESSENGER_WS_SERVER_CHANNEL_MESSAGE = 'messenger.channel.message';

/** Server → client: new DM persisted (`counterpartId` is the other participant). */
export const MESSENGER_WS_SERVER_DM_MESSAGE = 'messenger.dm.message';

export function messengerSocketUserRoom(employeeId: string): string {
  return `messenger:user:${employeeId}`;
}

export function messengerSocketChannelRoom(channelId: string): string {
  return `messenger:channel:${channelId}`;
}
