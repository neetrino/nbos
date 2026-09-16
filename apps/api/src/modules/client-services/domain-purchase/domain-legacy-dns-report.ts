import type { Prisma, PrismaClient } from '@nbos/database';
import type { DomainLegacyDnsReportRow } from './domain-operation.types';

type PrismaDb = Pick<PrismaClient, 'credential'>;

/** Dry-run list of Vault cards named DNS. Does not migrate or delete. */
export async function reportLegacyDnsCredentials(
  prisma: PrismaDb,
  visibility: Prisma.CredentialWhereInput = {},
): Promise<DomainLegacyDnsReportRow[]> {
  const credentials = await prisma.credential.findMany({
    where: {
      trashedAt: null,
      name: { equals: 'DNS', mode: 'insensitive' },
      ...visibility,
    },
    select: {
      id: true,
      name: true,
      clientServiceRecords: { select: { id: true, productId: true } },
    },
    take: 200,
  });
  return credentials.map((row) => ({
    credentialId: row.id,
    credentialName: row.name,
    linkedServiceIds: row.clientServiceRecords.map((service) => service.id),
    linkedProductIds: uniqueIds(row.clientServiceRecords.map((service) => service.productId)),
  }));
}

function uniqueIds(ids: Array<string | null>): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}
