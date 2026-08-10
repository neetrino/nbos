import { ForbiddenException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import type { MessengerAccessContext } from '../access/messenger-access.types';
import { toMessengerAccessContext } from '../access/messenger-access.types';
import {
  loadMessengerLegacyAccess,
  type MessengerLegacyAccessContext,
} from '../access/messenger-legacy-channel-access.op';

export async function requireMessengerUnifiedViewAccess(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
): Promise<{ access: MessengerAccessContext; legacy: MessengerLegacyAccessContext }> {
  const legacy = await loadMessengerLegacyAccess(prisma, employeeId);
  if (!legacy || legacy.viewScope === 'NONE') {
    throw new ForbiddenException('No permission: MESSENGER.VIEW');
  }
  return { access: toMessengerAccessContext(legacy), legacy };
}

export async function requireMessengerUnifiedEditAccess(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
): Promise<{ access: MessengerAccessContext; legacy: MessengerLegacyAccessContext }> {
  const loaded = await requireMessengerUnifiedViewAccess(prisma, employeeId);
  if (loaded.access.editScope === 'NONE') {
    throw new ForbiddenException('No permission: MESSENGER.EDIT');
  }
  return loaded;
}
