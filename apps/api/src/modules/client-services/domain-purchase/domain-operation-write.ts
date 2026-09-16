import { BadRequestException } from '@nestjs/common';
import { Decimal, type PrismaClient } from '@nbos/database';
import type { DomainConnectionMode } from '@nbos/shared';
import { isPrismaUniqueViolation } from '../../../common/prisma-unique-violation';
import { toOptionalMoneyDecimal } from '../client-services.helpers';
import type { DomainOperationDomainInput } from './domain-operation.types';

type PrismaDb = Pick<PrismaClient, 'clientServiceRecord' | 'domain' | '$transaction'>;
type PrismaTx = Pick<PrismaClient, 'clientServiceRecord' | 'domain'>;

export interface PersistDomainServiceParams {
  projectId: string;
  productId: string;
  domainName: string;
  connectionMode: DomainConnectionMode;
  domain: DomainOperationDomainInput;
  encryptedRegistrantData: string | null;
  dnsInstructions: string | null;
  existingDomainId: string | null;
}

export async function persistDomainService(
  prisma: PrismaDb,
  params: PersistDomainServiceParams,
): Promise<string> {
  return prisma.$transaction((tx) => persistDomainServiceInTx(tx, params));
}

async function persistDomainServiceInTx(
  prisma: PrismaTx,
  params: PersistDomainServiceParams,
): Promise<string> {
  const ourCost = toOptionalMoneyDecimal(params.domain.ourCost, 'ourCost') ?? null;
  const clientCharge = toOptionalMoneyDecimal(params.domain.clientCharge, 'clientCharge') ?? null;
  const providerAccountId =
    params.connectionMode === 'CLIENT_DNS' ? null : params.domain.providerAccountId?.trim() || null;

  const created = await prisma.clientServiceRecord.create({
    data: {
      projectId: params.projectId,
      productId: params.productId,
      type: 'DOMAIN',
      name: params.domainName,
      provider: params.domain.provider?.trim() || null,
      providerAccountId,
      status: 'PENDING',
      billingModel: params.connectionMode === 'CLIENT_DNS' ? 'REMINDER_ONLY' : 'WE_PAY',
      connectionMode: params.connectionMode,
      dnsInstructions: params.dnsInstructions,
      encryptedRegistrantData: params.encryptedRegistrantData,
      registrantDataUpdatedAt: params.encryptedRegistrantData ? new Date() : null,
      ourCost,
      clientCharge,
    },
    select: { id: true },
  });

  await upsertDomainRow(prisma, {
    domainId: params.existingDomainId,
    domainName: params.domainName,
    projectId: params.projectId,
    serviceId: created.id,
    provider: params.domain.provider?.trim() || null,
    ourCost,
    clientCharge,
  });

  return created.id;
}

async function upsertDomainRow(
  prisma: PrismaTx,
  params: {
    domainId: string | null;
    domainName: string;
    projectId: string;
    serviceId: string;
    provider: string | null;
    ourCost: Decimal | null;
    clientCharge: Decimal | null;
  },
): Promise<void> {
  if (params.domainId) {
    await prisma.domain.update({
      where: { id: params.domainId },
      data: { clientServiceRecordId: params.serviceId, provider: params.provider },
    });
    return;
  }
  try {
    await prisma.domain.create({
      data: {
        projectId: params.projectId,
        clientServiceRecordId: params.serviceId,
        domainName: params.domainName,
        provider: params.provider,
        renewalCost: params.ourCost,
        clientCharge: params.clientCharge,
      },
    });
  } catch (caught) {
    if (isPrismaUniqueViolation(caught, ['domainName'])) {
      throw new BadRequestException('This domain is already recorded.');
    }
    throw caught;
  }
}
