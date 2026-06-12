import { BadRequestException, NotFoundException } from '@nestjs/common';
import { buildCredentialRowVisibilityWhere } from './credential-visibility.loader';
import type { CredentialBulkMutationResult } from './credentials-bulk.operations';
import type { CredentialsAccessContext } from './credentials-access';
import type { CredentialsRuntime } from './credentials-runtime';
import { replaceCredentialFolderMemberships } from './credential-folders.operations';

async function findBulkFolderEditableRows(
  runtime: CredentialsRuntime,
  access: CredentialsAccessContext,
  credentialIds: string[],
) {
  const visibility = await buildCredentialRowVisibilityWhere(
    runtime.prisma,
    runtime.platformAccessResolver,
    access,
    'edit',
  );
  return runtime.prisma.credential.findMany({
    where: { id: { in: credentialIds }, trashedAt: null, ...visibility },
    select: { id: true, projectId: true },
  });
}

function buildBulkFolderResult(
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

async function assertFolderExists(runtime: CredentialsRuntime, folderId: string) {
  const folder = await runtime.prisma.credentialFolder.findFirst({
    where: { id: folderId },
    select: { id: true },
  });
  if (!folder) throw new NotFoundException(`Credential folder ${folderId} not found`);
}

/** v1: sets the sole primary folder membership per credential. */
export async function bulkAddCredentialsToFolder(
  runtime: CredentialsRuntime,
  access: CredentialsAccessContext,
  credentialIds: string[],
  folderId: string,
): Promise<CredentialBulkMutationResult> {
  if (!folderId.trim()) throw new BadRequestException('folderId is required');
  await assertFolderExists(runtime, folderId);

  const rows = await findBulkFolderEditableRows(runtime, access, credentialIds);
  const result = buildBulkFolderResult(credentialIds, rows);
  if (result.succeeded === 0) return result;

  for (const row of rows) {
    await replaceCredentialFolderMemberships(runtime, row.id, [folderId], access);
  }

  await runtime.auditService.log({
    entityType: 'credential_folder',
    entityId: folderId,
    action: 'credential_folder.bulk_add',
    userId: access.employeeId,
    changes: { credentialIds: result.credentialIds },
  });

  return result;
}

export async function bulkRemoveCredentialsFromFolder(
  runtime: CredentialsRuntime,
  access: CredentialsAccessContext,
  credentialIds: string[],
  folderId?: string,
): Promise<CredentialBulkMutationResult> {
  if (folderId) await assertFolderExists(runtime, folderId);

  const rows = await findBulkFolderEditableRows(runtime, access, credentialIds);
  const result = buildBulkFolderResult(credentialIds, rows);
  if (result.succeeded === 0) return result;

  await runtime.prisma.credentialFolderMembership.deleteMany({
    where: {
      credentialId: { in: result.credentialIds },
      ...(folderId ? { folderId } : {}),
    },
  });

  await Promise.all(
    rows.map((row) =>
      runtime.auditService.log({
        entityType: 'credential',
        entityId: row.id,
        action: folderId ? 'credential.folder_removed' : 'credential.folders_cleared',
        userId: access.employeeId,
        projectId: row.projectId ?? undefined,
        changes: { bulk: true, folderId: folderId ?? null },
      }),
    ),
  );

  return result;
}
