import { ConflictException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import {
  classifyDomainOperation,
  type DomainClassifyResult,
} from './domain-operation-classify';
import { DOMAIN_EXISTS_CONFLICT } from './domain-operation.errors';

type PrismaDb = Pick<PrismaClient, 'domain' | 'clientServiceRecord'>;

export type ResolvedDomainService = DomainClassifyResult;

/**
 * Finds an existing Domain / Client Service without leaking other products' records.
 */
export async function resolveExistingDomainService(
  prisma: PrismaDb,
  productId: string,
  domainName: string,
): Promise<ResolvedDomainService> {
  const domain = await prisma.domain.findUnique({
    where: { domainName },
    select: { id: true, clientServiceRecordId: true },
  });

  const openOnProduct = await prisma.clientServiceRecord.findFirst({
    where: {
      productId,
      type: 'DOMAIN',
      name: domainName,
      status: { not: 'CANCELLED' },
    },
    select: classifyServiceSelect,
  });

  if (openOnProduct) {
    return classifyDomainOperation({
      ...toClassifyInput(openOnProduct, productId),
      domainId: domain?.id ?? null,
    });
  }

  if (!domain?.clientServiceRecordId) {
    return classifyDomainOperation({
      serviceId: null,
      domainId: domain?.id ?? null,
      productId: null,
      requestedProductId: productId,
      status: null,
      registrationConfirmedAt: null,
      invoices: [],
      renewalDate: null,
    });
  }

  const linked = await prisma.clientServiceRecord.findUnique({
    where: { id: domain.clientServiceRecordId },
    select: classifyServiceSelect,
  });

  if (!linked || linked.status === 'CANCELLED') {
    return classifyDomainOperation({
      serviceId: linked?.id ?? null,
      domainId: domain.id,
      productId: linked?.productId ?? null,
      requestedProductId: productId,
      status: linked?.status ?? 'CANCELLED',
      registrationConfirmedAt: linked?.registrationConfirmedAt ?? null,
      invoices: linked?.invoices ?? [],
      renewalDate: linked?.renewalDate ?? null,
    });
  }

  if (linked.productId === productId) {
    return classifyDomainOperation({
      ...toClassifyInput(linked, productId),
      domainId: domain.id,
    });
  }

  throw new ConflictException(DOMAIN_EXISTS_CONFLICT);
}

const classifyServiceSelect = {
  id: true,
  productId: true,
  status: true,
  registrationConfirmedAt: true,
  renewalDate: true,
  invoices: {
    select: {
      id: true,
      moneyStatus: true,
      type: true,
      createdAt: true,
      dueDate: true,
    },
  },
} as const;

function toClassifyInput(
  row: {
    id: string;
    productId: string | null;
    status: string;
    registrationConfirmedAt: Date | null;
    renewalDate: Date | null;
    invoices: Array<{
      id: string;
      moneyStatus: string;
      type: string | null;
      createdAt: Date | null;
      dueDate: Date | null;
    }>;
  },
  requestedProductId: string,
) {
  return {
    serviceId: row.id,
    domainId: null as string | null,
    productId: row.productId,
    requestedProductId,
    status: row.status,
    registrationConfirmedAt: row.registrationConfirmedAt,
    invoices: row.invoices,
    renewalDate: row.renewalDate,
  };
}
