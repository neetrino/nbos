import type { TransactionClient } from '@nbos/database';

const RESOURCE_TYPE_CREDENTIAL = 'credential';

export interface CredentialOffboardingRevokeResult {
  credentialIds: string[];
  credentialGrantsRevoked: number;
  allowedEmployeesEntriesCleared: number;
  favoritesRemoved: number;
}

/** Revokes vault access for an offboarded employee (grants, SECRET allow-list, favorites). */
export async function revokeCredentialAccessForOffboard(
  tx: TransactionClient,
  employeeId: string,
  now: Date,
): Promise<CredentialOffboardingRevokeResult> {
  const grantRows = await tx.resourceAccessGrant.findMany({
    where: {
      employeeId,
      revokedAt: null,
      resourceType: RESOURCE_TYPE_CREDENTIAL,
    },
    select: { resourceId: true },
  });

  const allowedListRows = await tx.credential.findMany({
    where: { trashedAt: null, allowedEmployees: { has: employeeId } },
    select: { id: true, allowedEmployees: true },
  });

  await tx.resourceAccessGrant.updateMany({
    where: { employeeId, revokedAt: null, resourceType: RESOURCE_TYPE_CREDENTIAL },
    data: { revokedAt: now },
  });

  for (const row of allowedListRows) {
    await tx.credential.update({
      where: { id: row.id },
      data: {
        allowedEmployees: row.allowedEmployees.filter((id) => id !== employeeId),
      },
    });
  }

  const favoritesRemoved = await tx.credentialFavorite.deleteMany({
    where: { employeeId },
  });

  const credentialIds = [
    ...new Set([
      ...grantRows.map((row) => row.resourceId),
      ...allowedListRows.map((row) => row.id),
    ]),
  ];

  return {
    credentialIds,
    credentialGrantsRevoked: grantRows.length,
    allowedEmployeesEntriesCleared: allowedListRows.length,
    favoritesRemoved: favoritesRemoved.count,
  };
}
