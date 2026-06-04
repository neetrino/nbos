import type { PrismaClient } from '@nbos/database';
import { resolveMailViewerRole, type MailViewerRole, isWideMailScope } from './mail-access.policy';

export interface MailAccountWithRole {
  account: {
    id: string;
    emailAddress: string;
    displayName: string | null;
    ownerEmployeeId: string | null;
    providerType: string;
  };
  role: MailViewerRole;
}

/**
 * Loads a mail account together with the viewer's effective role, or null when
 * the account does not exist or the viewer has no access to it.
 */
export async function loadMailAccountWithViewerRole(
  prisma: InstanceType<typeof PrismaClient>,
  params: { mailAccountId: string; employeeId: string; viewScope: string },
): Promise<MailAccountWithRole | null> {
  const account = await prisma.mailAccount.findUnique({
    where: { id: params.mailAccountId },
    select: {
      id: true,
      emailAddress: true,
      displayName: true,
      ownerEmployeeId: true,
      providerType: true,
    },
  });
  if (!account) {
    return null;
  }
  const access = isWideMailScope(params.viewScope)
    ? null
    : await prisma.mailAccountAccess.findUnique({
        where: {
          mailAccountId_employeeId: {
            mailAccountId: params.mailAccountId,
            employeeId: params.employeeId,
          },
        },
        select: { role: true },
      });
  const role = resolveMailViewerRole({
    ownerEmployeeId: account.ownerEmployeeId,
    accessRole: access ? (access.role as MailViewerRole) : null,
    employeeId: params.employeeId,
    viewScope: params.viewScope,
  });
  if (!role) {
    return null;
  }
  return { account, role };
}
