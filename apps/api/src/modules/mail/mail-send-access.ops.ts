import { ForbiddenException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { mailRoleCanSend } from './mail-access.policy';
import { loadMailAccountWithViewerRole } from './mail-account-role.ops';

/** Throws when the viewer lacks mailbox send permission (OWNER/ADMIN/SENDER). */
export async function requireMailAccountSendRole(
  prisma: InstanceType<typeof PrismaClient>,
  params: { mailAccountId: string; employeeId: string; viewScope: string },
): Promise<void> {
  const loaded = await loadMailAccountWithViewerRole(prisma, params);
  if (!loaded || !mailRoleCanSend(loaded.role)) {
    throw new ForbiddenException('You cannot send from this mailbox');
  }
}
