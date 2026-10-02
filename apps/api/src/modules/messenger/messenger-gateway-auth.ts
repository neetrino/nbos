import { Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import * as jwt from 'jsonwebtoken';
import type { Server, Socket } from 'socket.io';
import {
  MESSENGER_WS_SERVER_PRESENCE,
  MESSENGER_WS_SERVER_PRESENCE_SNAPSHOT,
  messengerSocketUserRoom,
} from '@nbos/shared';
import { loadMessengerLegacyAccess } from './access/messenger-legacy-channel-access.op';
import { MessengerPresenceTracker } from './messenger-presence-tracker';
import { readSocketToken } from './messenger-gateway-parse';

type PrismaLike = InstanceType<typeof PrismaClient>;

interface JwtSubPayload {
  sub: string;
  authVersion?: number;
}

export type MessengerSocketAuthInput = {
  client: Socket;
  server: Server;
  prisma: PrismaLike;
  jwtSecret: string;
  presenceTracker: MessengerPresenceTracker;
  logger: Logger;
};

/** Starts authentication and stores its promise for subscribe handlers that arrive early. */
export function beginMessengerSocketAuthentication(input: MessengerSocketAuthInput): void {
  const pending = authenticateMessengerSocket(input);
  const data = input.client.data as { messengerAuthReady?: Promise<void> };
  data.messengerAuthReady = pending;
}

export async function authenticateMessengerSocket(input: MessengerSocketAuthInput): Promise<void> {
  const token = readSocketToken(input.client);
  if (!token) {
    input.client.disconnect(true);
    return;
  }
  try {
    await acceptAuthenticatedMessengerSocket(input, token);
  } catch {
    input.logger.warn('Messenger socket auth failed');
    input.client.disconnect(true);
  }
}

async function acceptAuthenticatedMessengerSocket(
  input: {
    client: Socket;
    server: Server;
    prisma: PrismaLike;
    jwtSecret: string;
    presenceTracker: MessengerPresenceTracker;
    logger: Logger;
  },
  token: string,
): Promise<void> {
  const payload = jwt.verify(token, input.jwtSecret) as JwtSubPayload;
  const employeeId = payload.sub;
  if (!employeeId) {
    input.client.disconnect(true);
    return;
  }
  const employee = await input.prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, status: true, authVersion: true },
  });
  if (!employee || employee.status === 'TERMINATED') {
    input.client.disconnect(true);
    return;
  }
  if (typeof payload.authVersion === 'number' && payload.authVersion !== employee.authVersion) {
    input.client.disconnect(true);
    return;
  }
  const access = await loadMessengerLegacyAccess(input.prisma, employeeId);
  if (!access || access.viewScope === 'NONE') {
    input.logger.warn(`Messenger socket denied: no MESSENGER VIEW for ${employeeId}`);
    input.client.disconnect(true);
    return;
  }
  input.client.data.employeeId = employeeId;
  await input.client.join(messengerSocketUserRoom(employeeId));
  const { becameOnline } = input.presenceTracker.increment(employeeId);
  if (becameOnline) {
    input.server.emit(MESSENGER_WS_SERVER_PRESENCE, {
      employeeId,
      state: 'online' as const,
    });
  }
  input.client.emit(MESSENGER_WS_SERVER_PRESENCE_SNAPSHOT, {
    employeeIds: input.presenceTracker.snapshotEmployeeIds(),
  });
}
