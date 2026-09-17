import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { parseReminderLanguage } from '../finance/subscriptions/subscription-reminder-language';
import {
  requireClientServiceType,
  resolveClientServiceBillingModel,
  resolveClientServiceFrequency,
  resolveClientServicePricingModel,
  resolveClientServiceStatus,
  resolveClientServiceTaxStatus,
} from './client-service-record-enum-validators';
import { parseOptionalDate, toOptionalMoneyDecimal } from './client-services.helpers';
import type {
  ClientServiceRecordBody,
  UpdateClientServiceRecordBody,
} from './client-services.types';
import {
  assertClientDnsHasNoCredential,
  clientServicePatchForConnectionMode,
  requireDomainConnectionMode,
} from './domain-purchase/domain-connection-mode';

type PrismaDb = InstanceType<typeof PrismaClient>;

export async function buildClientServiceCreateData(
  prisma: PrismaDb,
  body: ClientServiceRecordBody,
): Promise<Prisma.ClientServiceRecordCreateInput> {
  const name = body.name?.trim();
  if (!name) throw new BadRequestException('Name is required');
  assertClientDnsHasNoCredential(body.connectionMode, body.providerAccountId);
  const project = await resolveClientServiceProjectOrThrow(prisma, body.projectId);
  await ensureClientServiceProductMatchesProject(prisma, body.productId, project.id);
  await ensureClientServiceCredentialExists(prisma, body.providerAccountId);

  return {
    project: { connect: { id: project.id } },
    ...(body.productId?.trim() ? { product: { connect: { id: body.productId.trim() } } } : {}),
    ...(body.providerAccountId?.trim()
      ? { providerAccount: { connect: { id: body.providerAccountId.trim() } } }
      : {}),
    name,
    type: requireClientServiceType(body.type),
    provider: body.provider?.trim() || null,
    status: resolveClientServiceStatus(body.status),
    billingModel: resolveClientServiceBillingModel(body.billingModel),
    pricingModel: resolveClientServicePricingModel(body.pricingModel),
    frequency: resolveClientServiceFrequency(body.frequency),
    ourCost: toOptionalMoneyDecimal(body.ourCost, 'ourCost') ?? null,
    clientCharge: toOptionalMoneyDecimal(body.clientCharge, 'clientCharge') ?? null,
    taxStatus: resolveClientServiceTaxStatus(body.taxStatus),
    notificationsEnabled: body.notificationsEnabled ?? true,
    reminderLanguage: parseReminderLanguage(body.reminderLanguage),
    startDate: parseOptionalDate(body.startDate, 'startDate'),
    renewalDate: parseOptionalDate(body.renewalDate, 'renewalDate'),
    notes: body.notes?.trim() || null,
    ...(body.connectionMode?.trim()
      ? { connectionMode: requireDomainConnectionMode(body.connectionMode) }
      : {}),
    dnsInstructions: body.dnsInstructions?.trim() || null,
  };
}

export async function buildClientServiceUpdateData(
  prisma: PrismaDb,
  body: UpdateClientServiceRecordBody,
): Promise<Prisma.ClientServiceRecordUpdateInput> {
  const data: Prisma.ClientServiceRecordUpdateInput = {};
  if (body.projectId !== undefined) {
    const project = await resolveClientServiceProjectOrThrow(prisma, body.projectId);
    data.project = { connect: { id: project.id } };
  }
  if (body.productId !== undefined) {
    data.product = body.productId?.trim()
      ? { connect: { id: body.productId.trim() } }
      : { disconnect: true };
  }
  if (body.providerAccountId !== undefined) {
    data.providerAccount = body.providerAccountId?.trim()
      ? { connect: { id: body.providerAccountId.trim() } }
      : { disconnect: true };
  }
  applyClientServiceUpdateScalars(data, body);
  return data;
}

function applyClientServiceUpdateScalars(
  data: Prisma.ClientServiceRecordUpdateInput,
  body: UpdateClientServiceRecordBody,
): void {
  if (body.name !== undefined) data.name = requireNonEmptyClientServiceName(body.name);
  if (body.type !== undefined) data.type = requireClientServiceType(body.type);
  if (body.provider !== undefined) data.provider = body.provider?.trim() || null;
  if (body.status !== undefined) data.status = resolveClientServiceStatus(body.status);
  if (body.billingModel !== undefined) {
    data.billingModel = resolveClientServiceBillingModel(body.billingModel);
  }
  if (body.pricingModel !== undefined) {
    data.pricingModel = resolveClientServicePricingModel(body.pricingModel);
  }
  if (body.frequency !== undefined) data.frequency = resolveClientServiceFrequency(body.frequency);
  if (body.ourCost !== undefined) data.ourCost = toOptionalMoneyDecimal(body.ourCost, 'ourCost');
  if (body.clientCharge !== undefined) {
    data.clientCharge = toOptionalMoneyDecimal(body.clientCharge, 'clientCharge');
  }
  if (body.taxStatus !== undefined) {
    data.taxStatus = resolveClientServiceTaxStatus(body.taxStatus);
  }
  if (body.notificationsEnabled !== undefined) {
    data.notificationsEnabled = body.notificationsEnabled;
  }
  if (body.reminderLanguage !== undefined) {
    data.reminderLanguage = parseReminderLanguage(body.reminderLanguage);
  }
  if (body.startDate !== undefined) data.startDate = parseOptionalDate(body.startDate, 'startDate');
  if (body.renewalDate !== undefined) {
    data.renewalDate = parseOptionalDate(body.renewalDate, 'renewalDate');
  }
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null;
  if (body.connectionMode !== undefined) {
    if (!body.connectionMode?.trim()) {
      data.connectionMode = null;
    } else {
      const mode = requireDomainConnectionMode(body.connectionMode);
      const modePatch = clientServicePatchForConnectionMode(mode, {
        unlinkCredential: Boolean(body.unlinkCredential),
      });
      data.connectionMode = modePatch.connectionMode;
      if (modePatch.billingModel) data.billingModel = modePatch.billingModel;
      if (modePatch.providerAccountId === null) {
        data.providerAccount = { disconnect: true };
      }
    }
  }
  if (body.dnsInstructions !== undefined) {
    data.dnsInstructions = body.dnsInstructions?.trim() || null;
  }
}

function requireNonEmptyClientServiceName(name: string): string {
  const value = name.trim();
  if (!value) throw new BadRequestException('Name cannot be empty');
  return value;
}

async function resolveClientServiceProjectOrThrow(
  prisma: PrismaDb,
  projectId: string | null | undefined,
) {
  const id = projectId?.trim();
  if (!id) throw new BadRequestException('Project is required');
  const project = await prisma.project.findUnique({ where: { id }, select: { id: true } });
  if (!project) throw new BadRequestException('Project was not found');
  return project;
}

async function ensureClientServiceProductMatchesProject(
  prisma: PrismaDb,
  productId: string | null | undefined,
  projectId: string,
) {
  const id = productId?.trim();
  if (!id) return;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { projectId: true },
  });
  if (!product || product.projectId !== projectId) {
    throw new BadRequestException('Product does not belong to the selected project');
  }
}

async function ensureClientServiceCredentialExists(
  prisma: PrismaDb,
  credentialId: string | null | undefined,
) {
  const id = credentialId?.trim();
  if (!id) return;
  const credential = await prisma.credential.findFirst({
    where: { id, trashedAt: null },
    select: { id: true },
  });
  if (!credential) throw new BadRequestException('Provider account credential was not found');
}

export async function assertClientServiceExists(prisma: PrismaDb, id: string): Promise<void> {
  const row = await prisma.clientServiceRecord.findUnique({ where: { id } });
  if (!row) throw new NotFoundException('Client service record not found');
}

export async function assertClientServiceActiveForMutation(
  prisma: PrismaDb,
  id: string,
): Promise<void> {
  const row = await prisma.clientServiceRecord.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!row) throw new NotFoundException('Client service record not found');
  if (row.status === 'CANCELLED') {
    throw new BadRequestException('Cancelled client service records cannot be modified');
  }
}

export async function assertClientServiceDnsCredentialRules(
  prisma: PrismaDb,
  id: string,
  body: UpdateClientServiceRecordBody,
): Promise<void> {
  const current = await prisma.clientServiceRecord.findUnique({
    where: { id },
    select: { connectionMode: true, providerAccountId: true },
  });
  if (!current) throw new NotFoundException('Client service record not found');
  const mode =
    body.connectionMode !== undefined
      ? body.connectionMode?.trim() || null
      : current.connectionMode;
  const nextCredentialId =
    body.providerAccountId !== undefined
      ? body.providerAccountId?.trim() || null
      : current.providerAccountId;
  const attachingNewCredential =
    Boolean(nextCredentialId) && nextCredentialId !== current.providerAccountId;
  if (attachingNewCredential) {
    assertClientDnsHasNoCredential(mode, nextCredentialId);
  }
}
