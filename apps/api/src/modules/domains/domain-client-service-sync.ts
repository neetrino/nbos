import {
  Decimal,
  type ClientServiceStatus,
  type DomainStatusEnum,
  type Prisma,
  type TransactionClient,
} from '@nbos/database';

type DomainSyncRow = {
  id: string;
  projectId: string;
  domainName: string;
  provider: string | null;
  purchaseDate: Date | null;
  expiryDate: Date | null;
  renewalCost: Decimal | null;
  clientCharge: Decimal | null;
  status: DomainStatusEnum;
  clientServiceRecordId: string | null;
};

export function mapDomainStatusToClientServiceStatus(
  status: DomainStatusEnum,
): ClientServiceStatus {
  if (status === 'ACTIVE') return 'ACTIVE';
  if (status === 'EXPIRING_SOON') return 'EXPIRING_SOON';
  if (status === 'EXPIRED') return 'EXPIRED';
  return 'CANCELLED';
}

function resolveBillingModel(
  clientCharge: DomainSyncRow['clientCharge'],
): 'CLIENT_PAID' | 'COMPANY_PAID' {
  if (clientCharge != null && clientCharge.gt(0)) {
    return 'CLIENT_PAID';
  }
  return 'COMPANY_PAID';
}

export function buildClientServicePayloadFromDomain(
  domain: DomainSyncRow,
): Omit<Prisma.ClientServiceRecordCreateInput, 'project'> {
  return {
    type: 'DOMAIN',
    name: domain.domainName,
    provider: domain.provider,
    status: mapDomainStatusToClientServiceStatus(domain.status),
    billingModel: resolveBillingModel(domain.clientCharge),
    pricingModel: 'FIXED',
    frequency: 'YEARLY',
    ourCost: domain.renewalCost,
    clientCharge: domain.clientCharge,
    startDate: domain.purchaseDate,
    renewalDate: domain.expiryDate,
    notes: `Synced from domain inventory ${domain.id}`,
  };
}

/** Ensures a linked `ClientServiceRecord` exists and mirrors domain billing fields. */
export async function syncDomainClientServiceRecord(
  tx: TransactionClient,
  domain: DomainSyncRow,
): Promise<string> {
  const payload = buildClientServicePayloadFromDomain(domain);

  if (domain.clientServiceRecordId) {
    await tx.clientServiceRecord.update({
      where: { id: domain.clientServiceRecordId },
      data: payload,
    });
    return domain.clientServiceRecordId;
  }

  const created = await tx.clientServiceRecord.create({
    data: {
      ...payload,
      project: { connect: { id: domain.projectId } },
    },
    select: { id: true },
  });

  await tx.domain.update({
    where: { id: domain.id },
    data: { clientServiceRecordId: created.id },
  });

  return created.id;
}
