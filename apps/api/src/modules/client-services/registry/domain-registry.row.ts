import type { Prisma } from '@nbos/database';
import { resolveLookupDomainName } from './domain-name';

export const DOMAIN_REGISTRY_ROW_INCLUDE = {
  domain: { select: { domainName: true } },
} as const satisfies Prisma.ClientServiceRecordInclude;

export type DomainRegistryServiceRow = Prisma.ClientServiceRecordGetPayload<{
  include: typeof DOMAIN_REGISTRY_ROW_INCLUDE;
}>;

export function resolveRowDomainName(
  row: Pick<DomainRegistryServiceRow, 'name' | 'domain'>,
): string | null {
  return resolveLookupDomainName({
    linkedDomainName: row.domain?.domainName,
    serviceName: row.name,
  });
}
