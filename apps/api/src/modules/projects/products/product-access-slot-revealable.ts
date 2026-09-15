import type { Prisma, PrismaClient } from '@nbos/database';
import type { CredentialsAccessContext } from '../../credentials/credentials-access';
import { credentialsRbacBypassesRowFilter } from '../../credentials/credentials-access';
import { buildCredentialRowVisibilityWhere } from '../../credentials/credential-visibility.loader';
import type { PlatformAccessResolverService } from '../../platform-access/platform-access-resolver.service';

export async function loadRevealableCredentialIds(
  prisma: InstanceType<typeof PrismaClient>,
  platformAccessResolver: PlatformAccessResolverService,
  access: CredentialsAccessContext,
  credentialIds: string[],
): Promise<Set<string>> {
  if (credentialIds.length === 0) return new Set();
  if (credentialsRbacBypassesRowFilter(access)) return new Set(credentialIds);

  const visibility = await buildCredentialRowVisibilityWhere(
    prisma,
    platformAccessResolver,
    access,
  );
  const rows = await prisma.credential.findMany({
    where: { id: { in: credentialIds }, ...visibility },
    select: { id: true },
  });
  return new Set(rows.map((row) => row.id));
}

export async function buildAccessSlotVisibilityWhere(
  prisma: InstanceType<typeof PrismaClient>,
  platformAccessResolver: PlatformAccessResolverService,
  access: CredentialsAccessContext,
): Promise<Prisma.CredentialWhereInput> {
  if (credentialsRbacBypassesRowFilter(access)) return {};
  return buildCredentialRowVisibilityWhere(prisma, platformAccessResolver, access);
}
