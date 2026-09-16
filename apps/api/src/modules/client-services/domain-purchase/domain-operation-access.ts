import { NotFoundException } from '@nestjs/common';
import type { Prisma, PrismaClient } from '@nbos/database';
import type { FinanceScopedAccessContext } from '../../finance/finance-scoped-access';
import type { CredentialsAccessContext } from '../../credentials/credentials-access';
import { buildCredentialRowVisibilityWhere } from '../../credentials/credential-visibility.loader';
import type { PlatformAccessResolverService } from '../../platform-access/platform-access-resolver.service';
import { assertProductAccessibleForClientService } from '../client-service-access.op';

export async function requireAccessibleDomainProduct(
  prisma: InstanceType<typeof PrismaClient>,
  productId: string,
  access: FinanceScopedAccessContext,
): Promise<{ id: string; projectId: string }> {
  return assertProductAccessibleForClientService(prisma, productId, access);
}

export async function assertAccessibleDomainCredentials(
  prisma: InstanceType<typeof PrismaClient>,
  platformAccessResolver: PlatformAccessResolverService,
  credentialsAccess: CredentialsAccessContext,
  credentialIds: readonly string[],
): Promise<void> {
  const uniqueIds = [...new Set(credentialIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) return;
  const visibility = await buildCredentialRowVisibilityWhere(
    prisma,
    platformAccessResolver,
    credentialsAccess,
    'view',
  );
  for (const id of uniqueIds) {
    const row = await prisma.credential.findFirst({
      where: { id, trashedAt: null, ...visibility },
      select: { id: true },
    });
    if (!row) throw new NotFoundException('Provider account credential was not found');
  }
}

export async function credentialVisibilityWhereForReport(
  prisma: InstanceType<typeof PrismaClient>,
  platformAccessResolver: PlatformAccessResolverService,
  credentialsAccess: CredentialsAccessContext,
): Promise<Prisma.CredentialWhereInput> {
  return buildCredentialRowVisibilityWhere(
    prisma,
    platformAccessResolver,
    credentialsAccess,
    'view',
  );
}
