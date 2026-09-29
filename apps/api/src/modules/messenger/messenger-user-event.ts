import type { Server } from 'socket.io';
import { messengerSocketUserRoom } from '@nbos/shared';

export function emitMessengerUserEvent(
  server: Server | undefined,
  employeeId: string,
  event: string,
  payload: object,
): void {
  if (!server) return;
  server.to(messengerSocketUserRoom(employeeId)).emit(event, payload);
}
