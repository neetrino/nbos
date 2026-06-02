import type { Prisma, PrismaClient } from '@nbos/database';
import {
  type CredentialsAccessContext,
  credentialsRbacBypassesRowFilter,
  resolveCredentialsRbacScope,
} from './credentials-access';
import { loadManualGrantCredentialIds } from './credential-manual-grants';
import {
  buildCredentialVisibilityOr,
  credentialVisibilityContextFromTeam,
  type CredentialVisibilityContext,
} from './credentials-visibility';
import type { PlatformAccessResolverService } from '../platform-access/platform-access-resolver.service';

export async function loadCredentialVisibilityContext(
  prisma: InstanceType<typeof PrismaClient>,
  platformAccessResolver: PlatformAccessResolverService,
  access: Pick<CredentialsAccessContext, 'employeeId' | 'departmentIds'>,
): Promise<CredentialVisibilityContext> {
  const [team, manualGrantCredentialIds] = await Promise.all([
    platformAccessResolver.loadTeamContext(access.employeeId),
    loadManualGrantCredentialIds(prisma, access.employeeId),
  ]);
  return credentialVisibilityContextFromTeam(
    access.employeeId,
    access.departmentIds,
    team,
    manualGrantCredentialIds,
  );
}

export async function buildCredentialRowVisibilityWhere(
  prisma: InstanceType<typeof PrismaClient>,
  platformAccessResolver: PlatformAccessResolverService,
  access: CredentialsAccessContext,
  action: 'view' | 'edit' | 'delete' = 'view',
): Promise<Pick<Prisma.CredentialWhereInput, 'OR'>> {
  const scope = resolveCredentialsRbacScope(access, action);
  if (credentialsRbacBypassesRowFilter(scope)) return {};
  const ctx = await loadCredentialVisibilityContext(prisma, platformAccessResolver, access);
  return { OR: buildCredentialVisibilityOr(ctx) };
}
