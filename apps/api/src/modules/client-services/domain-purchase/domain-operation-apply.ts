import { BadRequestException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import type { DomainConnectionMode } from '@nbos/shared';
import { fillCredentialContextIfEmpty } from '../../expenses/expense-credential-link';
import type { ClientServiceFlowsService } from '../client-service-flows.service';
import { ensureExpenseForPaidInvoice } from '../client-paid-invoice-expense';
import { clientServicePatchForConnectionMode } from './domain-connection-mode';
import { issueDomainInvoiceForService } from './domain-operation-invoice';
import { resolveExistingDomainService } from './domain-operation-resolve';
import {
  DOMAIN_ARCHIVED_CLARIFY,
  DOMAIN_AMBIGUOUS_CLARIFY,
  DOMAIN_OPEN_EXISTING_INVOICE,
} from './domain-operation.errors';
import { syncOpenExpenseCredentialFromService } from './late-credential-sync';
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

  if (existing.kind === 'archived') {
    return failed(params.domain.domainName, DOMAIN_ARCHIVED_CLARIFY);
  }
  if (existing.kind === 'ambiguous') {
    return failed(params.domain.domainName, DOMAIN_AMBIGUOUS_CLARIFY);
  }
  if (existing.kind === 'existing_invoice') {
    return {
      domainName: params.domain.domainName,
      status: 'reused',
      serviceId: existing.serviceId,
      invoiceId: existing.invoiceId,
      kind: existing.kind,
      message: DOMAIN_OPEN_EXISTING_INVOICE,
    };
  }

  const reuse = Boolean(existing.serviceId) && existing.kind !== 'new_purchase';
  const serviceId = reuse
    ? existing.serviceId!
    : await persistDomainService(prisma, {
        projectId: params.projectId,
        productId: params.productId,
        domainName: params.domain.domainName,
        connectionMode: params.connectionMode,
        domain: params.domain,
        encryptedRegistrantData: params.encryptedRegistrantData,
        dnsInstructions: params.dnsInstructions,
        existingDomainId: existing.domainId ?? null,
      });

  if (reuse) {
    await patchReusedDomainService(prisma, serviceId, params);
  }

  const credentialId = params.domain.providerAccountId?.trim() || null;
  await fillCredentialContextIfEmpty(prisma, credentialId, {
    productId: params.productId,
    clientServiceRecordId: serviceId,
  });
  await syncOpenExpenseCredentialFromService(prisma, serviceId, credentialId);

  const finance = await issueFinanceIfNeeded(prisma, flows, params, serviceId, existing.kind);

  return {
    domainName: params.domain.domainName,
    status: reuse ? 'reused' : 'created',
    serviceId,
    invoiceId: finance.invoiceId,
    expenseId: finance.expenseId,
    kind: existing.kind,
  };
}

async function issueFinanceIfNeeded(
  prisma: PrismaDb,
  flows: ClientServiceFlowsService,
  params: ApplyDomainParams,
  serviceId: string,
  kind: string,
): Promise<{ invoiceId: string | null; expenseId: string | null }> {
  if (!params.issueInvoices) return { invoiceId: null, expenseId: null };
  const invoiceId = await issueDomainInvoiceForService(
    prisma,
    flows,
    serviceId,
    params.domain.clientCharge ?? params.domain.ourCost,
  );
  if (kind === 'renewal') return { invoiceId, expenseId: null };

  const service = await prisma.clientServiceRecord.findUnique({
    where: { id: serviceId },
    select: { id: true, name: true, ourCost: true, renewalDate: true },
  });
  if (!service) throw new BadRequestException('Client service record not found');
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { amount: true },
  });
  const expenseId = await ensureExpenseForPaidInvoice(prisma, flows, {
    invoiceId,
    invoiceAmount: invoice?.amount,
    paidDate: new Date(),
    service,
  });
  return { invoiceId, expenseId };
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

function failed(domainName: string, message: string): DomainOperationItemResult {
  return { domainName, status: 'failed', message };
}
