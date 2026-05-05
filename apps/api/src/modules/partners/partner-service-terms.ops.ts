import { BadRequestException } from '@nestjs/common';
import type { Prisma, PrismaClient } from '@nbos/database';

const PARTNER_SERVICE_TYPES = ['SEO', 'SMM', 'ADS', 'OTHER'] as const;
const PARTNER_SERVICE_PAYMENT_MODELS = ['ONE_TIME', 'MONTHLY', 'CUSTOM'] as const;
const PARTNER_SERVICE_STATUSES = [
  'PENDING',
  'ACTIVE',
  'ON_HOLD',
  'CANCELLED',
  'COMPLETED',
] as const;

export interface PartnerServiceTermWireDto {
  id: string;
  partnerId: string;
  clientContactId: string | null;
  clientCompanyId: string | null;
  projectId: string | null;
  serviceType: (typeof PARTNER_SERVICE_TYPES)[number];
  paymentModel: (typeof PARTNER_SERVICE_PAYMENT_MODELS)[number];
  amount: string;
  billingStartDate: string | null;
  subscriptionId: string | null;
  invoiceId: string | null;
  status: (typeof PARTNER_SERVICE_STATUSES)[number];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartnerServiceTermInput {
  clientContactId?: string | null;
  clientCompanyId?: string | null;
  projectId?: string | null;
  serviceType: string;
  paymentModel: string;
  amount: number;
  billingStartDate?: string;
  subscriptionId?: string | null;
  invoiceId?: string | null;
  status?: string;
  notes?: string;
}

export interface UpdatePartnerServiceTermInput {
  clientContactId?: string | null;
  clientCompanyId?: string | null;
  projectId?: string | null;
  serviceType?: string;
  paymentModel?: string;
  amount?: number;
  billingStartDate?: string | null;
  subscriptionId?: string | null;
  invoiceId?: string | null;
  status?: string;
  notes?: string;
}

const partnerServiceTermSelect = {
  id: true,
  partnerId: true,
  clientContactId: true,
  clientCompanyId: true,
  projectId: true,
  serviceType: true,
  paymentModel: true,
  amount: true,
  billingStartDate: true,
  subscriptionId: true,
  invoiceId: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PartnerServiceTermSelect;

type PartnerServiceTermRow = Prisma.PartnerServiceTermGetPayload<{
  select: typeof partnerServiceTermSelect;
}>;

export async function listPartnerServiceTerms(
  prisma: InstanceType<typeof PrismaClient>,
  partnerId: string,
): Promise<PartnerServiceTermWireDto[]> {
  const rows = await prisma.partnerServiceTerm.findMany({
    where: { partnerId },
    orderBy: { createdAt: 'desc' },
    select: partnerServiceTermSelect,
    take: 200,
  });
  return rows.map(serializePartnerServiceTerm);
}

export async function createPartnerServiceTerm(
  prisma: InstanceType<typeof PrismaClient>,
  partnerId: string,
  input: CreatePartnerServiceTermInput,
): Promise<PartnerServiceTermWireDto> {
  const serviceType = parseServiceType(input.serviceType);
  const paymentModel = parsePaymentModel(input.paymentModel);
  const status = input.status ? parseServiceStatus(input.status) : 'PENDING';
  const amount = parseAmount(input.amount);
  const billingStartDate = parseBillingStartDate(input.billingStartDate);
  assertMonthlyBillingDate(paymentModel, billingStartDate);

  const created = await prisma.partnerServiceTerm.create({
    data: {
      partnerId,
      clientContactId: normalizeNullableId(input.clientContactId),
      clientCompanyId: normalizeNullableId(input.clientCompanyId),
      projectId: normalizeNullableId(input.projectId),
      serviceType,
      paymentModel,
      amount,
      billingStartDate,
      subscriptionId: normalizeNullableId(input.subscriptionId),
      invoiceId: normalizeNullableId(input.invoiceId),
      status,
      notes: normalizeNotes(input.notes),
    },
    select: partnerServiceTermSelect,
  });
  return serializePartnerServiceTerm(created);
}

export async function updatePartnerServiceTerm(
  prisma: InstanceType<typeof PrismaClient>,
  partnerId: string,
  termId: string,
  input: UpdatePartnerServiceTermInput,
): Promise<PartnerServiceTermWireDto> {
  const existing = await prisma.partnerServiceTerm.findUnique({
    where: { id: termId },
    select: partnerServiceTermSelect,
  });
  if (!existing || existing.partnerId !== partnerId) {
    throw new BadRequestException(`Partner service term ${termId} not found`);
  }

  const nextPaymentModel = input.paymentModel
    ? parsePaymentModel(input.paymentModel)
    : existing.paymentModel;
  const nextBillingStartDate =
    input.billingStartDate !== undefined
      ? parseNullableBillingStartDate(input.billingStartDate)
      : existing.billingStartDate;
  assertMonthlyBillingDate(nextPaymentModel, nextBillingStartDate);

  const updated = await prisma.partnerServiceTerm.update({
    where: { id: termId },
    data: {
      ...(input.clientContactId !== undefined && {
        clientContactId: normalizeNullableId(input.clientContactId),
      }),
      ...(input.clientCompanyId !== undefined && {
        clientCompanyId: normalizeNullableId(input.clientCompanyId),
      }),
      ...(input.projectId !== undefined && { projectId: normalizeNullableId(input.projectId) }),
      ...(input.serviceType !== undefined && { serviceType: parseServiceType(input.serviceType) }),
      ...(input.paymentModel !== undefined && { paymentModel: nextPaymentModel }),
      ...(input.amount !== undefined && { amount: parseAmount(input.amount) }),
      ...(input.billingStartDate !== undefined && { billingStartDate: nextBillingStartDate }),
      ...(input.subscriptionId !== undefined && {
        subscriptionId: normalizeNullableId(input.subscriptionId),
      }),
      ...(input.invoiceId !== undefined && { invoiceId: normalizeNullableId(input.invoiceId) }),
      ...(input.status !== undefined && { status: parseServiceStatus(input.status) }),
      ...(input.notes !== undefined && { notes: normalizeNotes(input.notes) }),
    },
    select: partnerServiceTermSelect,
  });
  return serializePartnerServiceTerm(updated);
}

function parseServiceType(value: string): (typeof PARTNER_SERVICE_TYPES)[number] {
  const upper = value.toUpperCase();
  if (PARTNER_SERVICE_TYPES.includes(upper as (typeof PARTNER_SERVICE_TYPES)[number])) {
    return upper as (typeof PARTNER_SERVICE_TYPES)[number];
  }
  throw new BadRequestException('serviceType must be one of: SEO, SMM, ADS, OTHER');
}

function parsePaymentModel(value: string): (typeof PARTNER_SERVICE_PAYMENT_MODELS)[number] {
  const upper = value.toUpperCase();
  if (
    PARTNER_SERVICE_PAYMENT_MODELS.includes(
      upper as (typeof PARTNER_SERVICE_PAYMENT_MODELS)[number],
    )
  ) {
    return upper as (typeof PARTNER_SERVICE_PAYMENT_MODELS)[number];
  }
  throw new BadRequestException('paymentModel must be one of: ONE_TIME, MONTHLY, CUSTOM');
}

function parseServiceStatus(value: string): (typeof PARTNER_SERVICE_STATUSES)[number] {
  const upper = value.toUpperCase();
  if (PARTNER_SERVICE_STATUSES.includes(upper as (typeof PARTNER_SERVICE_STATUSES)[number])) {
    return upper as (typeof PARTNER_SERVICE_STATUSES)[number];
  }
  throw new BadRequestException(
    'status must be one of: PENDING, ACTIVE, ON_HOLD, CANCELLED, COMPLETED',
  );
}

function parseAmount(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new BadRequestException('amount must be a number greater than zero');
  }
  return value;
}

function parseBillingStartDate(value?: string): Date | null {
  if (!value) return null;
  return parseDate(value, 'billingStartDate');
}

function parseNullableBillingStartDate(value: string | null): Date | null {
  if (value === null || value === '') return null;
  return parseDate(value, 'billingStartDate');
}

function parseDate(value: string, fieldName: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${fieldName} must be a valid ISO date`);
  }
  return date;
}

function assertMonthlyBillingDate(
  paymentModel: (typeof PARTNER_SERVICE_PAYMENT_MODELS)[number],
  billingStartDate: Date | null,
): void {
  if (paymentModel === 'MONTHLY' && !billingStartDate) {
    throw new BadRequestException('billingStartDate is required when paymentModel is MONTHLY');
  }
}

function normalizeNullableId(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeNotes(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function serializePartnerServiceTerm(row: PartnerServiceTermRow): PartnerServiceTermWireDto {
  return {
    id: row.id,
    partnerId: row.partnerId,
    clientContactId: row.clientContactId,
    clientCompanyId: row.clientCompanyId,
    projectId: row.projectId,
    serviceType: row.serviceType,
    paymentModel: row.paymentModel,
    amount: row.amount.toFixed(2),
    billingStartDate: row.billingStartDate?.toISOString() ?? null,
    subscriptionId: row.subscriptionId,
    invoiceId: row.invoiceId,
    status: row.status,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
