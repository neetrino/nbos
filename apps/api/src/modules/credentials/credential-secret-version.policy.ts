import { ForbiddenException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import type { CredentialsAccessContext } from './credentials-access';
import { credentialsRbacBypassesRowFilter } from './credentials-access';
import { assertEmergencyAccessRole } from './credential-emergency-access.policy';

/** Old secret versions: executives or CREDENTIALS_BYPASS_ROW_VISIBILITY. */
export async function assertSecretVersionRevealAllowed(
  prisma: InstanceType<typeof PrismaClient>,
  access: CredentialsAccessContext,
): Promise<void> {
  if (credentialsRbacBypassesRowFilter(access)) return;
  try {
    await assertEmergencyAccessRole(prisma, access.employeeId);
  } catch {
    throw new ForbiddenException(
      'Historical secret versions require executive or vault-wide access',
    );
  }
}
