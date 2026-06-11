import { NotFoundException } from '@nestjs/common';
import { buildCredentialRowVisibilityWhere } from './credential-visibility.loader';
import type { CredentialsAccessContext } from './credentials-access';
import type { CredentialsRuntime } from './credentials-runtime';

type FavoriteDelegate = {
  upsert: (args: unknown) => Promise<unknown>;
  deleteMany: (args: unknown) => Promise<unknown>;
};

function favoriteDelegate(runtime: CredentialsRuntime): FavoriteDelegate {
  return (runtime.prisma as unknown as { credentialFavorite: FavoriteDelegate }).credentialFavorite;
}

export async function setCredentialFavorite(
  runtime: CredentialsRuntime,
  credentialId: string,
  favorite: boolean,
  access: CredentialsAccessContext,
) {
  const visible = await runtime.prisma.credential.findFirst({
    where: {
      id: credentialId,
      archivedAt: null,
      ...(await buildCredentialRowVisibilityWhere(
        runtime.prisma,
        runtime.platformAccessResolver,
        access,
        'view',
      )),
    },
    select: { id: true, projectId: true },
  });
  if (!visible) throw new NotFoundException(`Credential ${credentialId} not found`);

  const delegate = favoriteDelegate(runtime);
  if (favorite) {
    await delegate.upsert({
      where: { credentialId_employeeId: { credentialId, employeeId: access.employeeId } },
      create: { credentialId, employeeId: access.employeeId },
      update: {},
    });
  } else {
    await delegate.deleteMany({ where: { credentialId, employeeId: access.employeeId } });
  }

  await runtime.auditService.log({
    entityType: 'credential',
    entityId: credentialId,
    action: favorite ? 'credential.favorite_added' : 'credential.favorite_removed',
    userId: access.employeeId,
    projectId: visible.projectId ?? undefined,
  });

  return { credentialId, isFavorite: favorite };
}
