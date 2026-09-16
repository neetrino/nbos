import { ConflictException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { DOMAIN_EXISTS_CONFLICT } from './domain-operation.errors';

type PrismaDb = Pick<PrismaClient, 'domain' | 'clientServiceRecord'>;

export interface ResolvedDomainService {
  serviceId: string | null;
  domainId: string | null;
  reuse: boolean;
}

/**
 * Finds an existing Domain / Client Service for this product without leaking
 * other products' records. Conflict is a generic message.
 */
export async function resolveExistingDomainService(
  prisma: PrismaDb,
  productId: string,
  domainName: string,
): Promise<ResolvedDomainService> {
  const domain = await prisma.domain.findUnique({
    where: { domainName },
    select: { id: true, clientServiceRecordId: true, projectId: true },
  });

  const openOnProduct = await prisma.clientServiceRecord.findFirst({
    where: {
      productId,
      type: 'DOMAIN',
      name: domainName,
      status: { not: 'CANCELLED' },
    },
    select: { id: true },
  });

  if (openOnProduct) {
    return { serviceId: openOnProduct.id, domainId: domain?.id ?? null, reuse: true };
  }

  if (!domain) {
    return { serviceId: null, domainId: null, reuse: false };
  }

  if (!domain.clientServiceRecordId) {
    return { serviceId: null, domainId: domain.id, reuse: false };
  }

  const linked = await prisma.clientServiceRecord.findUnique({
    where: { id: domain.clientServiceRecordId },
    select: { id: true, productId: true, status: true },
  });

  if (!linked || linked.status === 'CANCELLED') {
    return { serviceId: null, domainId: domain.id, reuse: false };
  }

  if (linked.productId === productId) {
    return { serviceId: linked.id, domainId: domain.id, reuse: true };
  }

  throw new ConflictException(DOMAIN_EXISTS_CONFLICT);
}
