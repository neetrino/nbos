import type { PrismaClient } from '@nbos/database';
import type { DomainConnectionMode } from '@nbos/shared';
import { fillCredentialContextIfEmpty } from '../../expenses/expense-credential-link';
import type { ClientServiceFlowsService } from '../client-service-flows.service';
import { clientServicePatchForConnectionMode } from './domain-connection-mode';
import { issueDomainInvoiceForService } from './domain-operation-invoice';
import { resolveExistingDomainService } from './domain-operation-resolve';
import type {
  DomainOperationDomainInput,
  DomainOperationItemResult,
} from './domain-operation.types';
import { persistDomainService } from './domain-operation-write';

type PrismaDb = InstanceType<typeof PrismaClient>;

export interface ApplyDomainParams {
  projectId: string;
  productId: string;
  connectionMode: DomainConnectionMode;
  domain: DomainOperationDomainInput & { domainName: string };
  encryptedRegistrantData: string | null;
  dnsInstructions: string | null;
  issueInvoices: boolean;
}

export async function applyOneDomainOperation(
  prisma: PrismaDb,
  flows: ClientServiceFlowsService,
  params: ApplyDomainParams,
): Promise<DomainOperationItemResult> {
  const existing = await resolveExistingDomainService(
    prisma,
    params.productId,
    params.domain.domainName,
  );
  const serviceId = existing.reuse
    ? existing.serviceId!
    : await persistDomainService(prisma, {
        projectId: params.projectId,
        productId: params.productId,
        domainName: params.domain.domainName,
        connectionMode: params.connectionMode,
        domain: params.domain,
        encryptedRegistrantData: params.encryptedRegistrantData,
        dnsInstructions: params.dnsInstructions,
        existingDomainId: existing.domainId,
      });

  if (existing.reuse) {
    await patchReusedDomainService(prisma, serviceId, params);
  }

  await fillCredentialContextIfEmpty(prisma, params.domain.providerAccountId?.trim() || null, {
    productId: params.productId,
    clientServiceRecordId: serviceId,
  });

  const invoiceId = params.issueInvoices
    ? await issueDomainInvoiceForService(prisma, flows, serviceId, params.domain.clientCharge)
    : null;

  return {
    domainName: params.domain.domainName,
    status: existing.reuse ? 'reused' : 'created',
    serviceId,
    invoiceId,
  };
}

async function patchReusedDomainService(
  prisma: PrismaDb,
  serviceId: string,
  params: ApplyDomainParams,
): Promise<void> {
  const credentialId = params.domain.providerAccountId?.trim() || null;
  const modePatch = clientServicePatchForConnectionMode(params.connectionMode);
  await prisma.clientServiceRecord.update({
    where: { id: serviceId },
    data: {
      ...modePatch,
      ...(params.domain.provider?.trim() ? { provider: params.domain.provider.trim() } : {}),
      ...(modePatch.providerAccountId === null
        ? {}
        : credentialId
          ? { providerAccountId: credentialId }
          : {}),
      ...(params.dnsInstructions ? { dnsInstructions: params.dnsInstructions } : {}),
      ...(params.encryptedRegistrantData
        ? {
            encryptedRegistrantData: params.encryptedRegistrantData,
            registrantDataUpdatedAt: new Date(),
          }
        : {}),
    },
  });
}
