import type { CredentialsAccessContext } from './credentials-access';
import { buildCredentialRowVisibilityWhere } from './credential-visibility.loader';
import type { CredentialsRuntime } from './credentials-runtime';

export interface CredentialBulkMutationResult {
  succeeded: number;
  skipped: number;
  credentialIds: string[];
}

async function findBulkMutableIds(
  runtime: CredentialsRuntime,
  access: CredentialsAccessContext,
  credentialIds: string[],
  mode: 'archive' | 'restore',
): Promise<{ id: string; projectId: string | null }[]> {
  const action = mode === 'archive' ? 'delete' : 'edit';
  const visibility = await buildCredentialRowVisibilityWhere(
    runtime.prisma,
    runtime.platformAccessResolver,
    access,
    action,
  );
  const archivedFilter = mode === 'archive' ? { trashedAt: null } : { trashedAt: { not: null } };

  return runtime.prisma.credential.findMany({
    where: {
      id: { in: credentialIds },
      ...archivedFilter,
      ...visibility,
    },
    select: { id: true, projectId: true },
  });
}

function buildBulkResult(
  requestedIds: string[],
  rows: { id: string }[],
): CredentialBulkMutationResult {
  const credentialIds = rows.map((row) => row.id);
  return {
    succeeded: credentialIds.length,
    skipped: requestedIds.length - credentialIds.length,
    credentialIds,
  };
}

export async function bulkArchiveCredentials(
  runtime: CredentialsRuntime,
  access: CredentialsAccessContext,
  credentialIds: string[],
): Promise<CredentialBulkMutationResult> {
  const rows = await findBulkMutableIds(runtime, access, credentialIds, 'archive');
  const result = buildBulkResult(credentialIds, rows);
  if (result.succeeded === 0) return result;

  const trashedAt = new Date();
  await runtime.prisma.$transaction([
    runtime.prisma.credential.updateMany({
      where: { id: { in: result.credentialIds } },
      data: { trashedAt },
    }),
    runtime.prisma.credentialFolderMembership.deleteMany({
      where: { credentialId: { in: result.credentialIds } },
    }),
    runtime.prisma.credentialFavorite.deleteMany({
      where: { credentialId: { in: result.credentialIds } },
    }),
  ]);

  await Promise.all(
    rows.map((row) =>
      runtime.auditService.log({
        entityType: 'credential',
        entityId: row.id,
        action: 'credential.archived',
        userId: access.employeeId,
        projectId: row.projectId ?? undefined,
        changes: { bulk: true },
      }),
    ),
  );

  return result;
}

export async function bulkRestoreCredentials(
  runtime: CredentialsRuntime,
  access: CredentialsAccessContext,
  credentialIds: string[],
): Promise<CredentialBulkMutationResult> {
  const rows = await findBulkMutableIds(runtime, access, credentialIds, 'restore');
  const result = buildBulkResult(credentialIds, rows);
  if (result.succeeded === 0) return result;

  await runtime.prisma.credential.updateMany({
    where: { id: { in: result.credentialIds } },
    data: { trashedAt: null },
  });

  await Promise.all(
    rows.map((row) =>
      runtime.auditService.log({
        entityType: 'credential',
        entityId: row.id,
        action: 'credential.restored',
        userId: access.employeeId,
        projectId: row.projectId ?? undefined,
        changes: { bulk: true },
      }),
    ),
  );

  return result;
}
