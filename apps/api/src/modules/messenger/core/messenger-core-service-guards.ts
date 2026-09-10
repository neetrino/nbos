import { ForbiddenException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import {
  loadMessengerLegacyAccess,
  type MessengerLegacyAccessContext,
} from '../access/messenger-legacy-channel-access.op';
import { assertMessengerFileAssetsAttachable } from '../messenger-attachment-access.op';
import { clientPersistDenial } from './messenger-core-access';
import type { MessengerCoreAccessDecision } from './messenger-core-access.types';
import { assertCoreFileAssetsExist } from './messenger-core-attachment.ops';
import {
  MESSENGER_CORE_CLIENT_READ_ONLY,
  MESSENGER_CORE_CLIENT_SEND_FORBIDDEN,
} from './messenger-core.constants';

type PrismaLike = InstanceType<typeof PrismaClient>;

export function assertClientMayPersist(decision: MessengerCoreAccessDecision): void {
  const denial = clientPersistDenial(decision);
  if (!denial) return;
  throw new ForbiddenException(
    denial === 'READ_ONLY' ? MESSENGER_CORE_CLIENT_READ_ONLY : MESSENGER_CORE_CLIENT_SEND_FORBIDDEN,
  );
}

export async function validateCorePersistAttachments(
  prisma: PrismaLike,
  access: MessengerLegacyAccessContext,
  fileAssetIds: string[] | undefined,
): Promise<string[]> {
  const existing = await assertCoreFileAssetsExist(prisma, fileAssetIds ?? []);
  return assertMessengerFileAssetsAttachable(prisma, access, existing);
}

export async function requireMessengerEditAccess(
  prisma: PrismaLike,
  employeeId: string,
): Promise<MessengerLegacyAccessContext> {
  const access = await loadMessengerLegacyAccess(prisma, employeeId);
  if (!access || access.viewScope === 'NONE') {
    throw new ForbiddenException('No permission: MESSENGER.VIEW');
  }
  if (access.editScope === 'NONE') {
    throw new ForbiddenException('No permission: MESSENGER.EDIT');
  }
  return access;
}
