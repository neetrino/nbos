import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { AiProviderConnectionStatusEnum, AiProviderTypeEnum } from '@nbos/database';
import type { PrismaTransaction } from '../agents/agent-row-lock';

export interface LockedProviderConnection {
  id: string;
  status: AiProviderConnectionStatusEnum;
  revokedAt: Date | null;
  provider: AiProviderTypeEnum;
}

export async function lockProviderConnection(
  tx: PrismaTransaction,
  connectionId: string,
): Promise<LockedProviderConnection> {
  const locked = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM ai_provider_connections WHERE id = ${connectionId} FOR UPDATE
  `;
  if (locked.length === 0) {
    throw new NotFoundException('Provider connection not found');
  }
  return tx.aiProviderConnection.findUniqueOrThrow({
    where: { id: connectionId },
    select: { id: true, status: true, revokedAt: true, provider: true },
  });
}

export function isProviderConnectionRevoked(
  connection: Pick<LockedProviderConnection, 'status' | 'revokedAt'>,
): boolean {
  return connection.status === 'REVOKED' || connection.revokedAt !== null;
}

export async function lockLiveProviderConnection(
  tx: PrismaTransaction,
  connectionId: string,
  reason: string,
): Promise<LockedProviderConnection> {
  const connection = await lockProviderConnection(tx, connectionId);
  if (isProviderConnectionRevoked(connection)) {
    throw new BadRequestException(reason);
  }
  return connection;
}
