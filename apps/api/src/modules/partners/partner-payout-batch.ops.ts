import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal, PrismaClient } from '@nbos/database';

const MAX_BATCH_ACCRUALS = 200;

export interface CreatePartnerPayoutBatchInput {
  accrualIds: string[];
  payoutDate?: string;
  notes?: string;
}

export interface ApprovePartnerPayoutBatchInput {
  payoutDate?: string;
  approvedBy?: string;
  notes?: string;
}

export interface CancelPartnerPayoutBatchInput {
  notes?: string;
}

export interface PartnerPayoutBatchDto {
  id: string;
  partnerId: string;
  totalAmount: string;
  status: string;
  payoutDate: string | null;
  expenseId: string | null;
  approvedBy: string | null;
  notes: string | null;
  accrualCount: number;
  createdAt: string;
}

export async function listPartnerPayoutBatches(
  prisma: InstanceType<typeof PrismaClient>,
  partnerId: string,
): Promise<PartnerPayoutBatchDto[]> {
  const rows = await prisma.partnerPayoutBatch.findMany({
    where: { partnerId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      partnerId: true,
      totalAmount: true,
      status: true,
      payoutDate: true,
      expenseId: true,
      approvedBy: true,
      notes: true,
      createdAt: true,
      _count: { select: { accruals: true } },
    },
  });

  return rows.map((r) => serializePartnerPayoutBatch(r));
}

export async function createPartnerPayoutBatch(
  prisma: InstanceType<typeof PrismaClient>,
  partnerId: string,
  input: CreatePartnerPayoutBatchInput,
): Promise<PartnerPayoutBatchDto> {
  const accrualIds = [...new Set(input.accrualIds.filter(Boolean))];
  if (accrualIds.length === 0) {
    throw new BadRequestException('accrualIds must include at least one accrual');
  }
  if (accrualIds.length > MAX_BATCH_ACCRUALS) {
    throw new BadRequestException(
      `A payout batch can include up to ${MAX_BATCH_ACCRUALS} accruals`,
    );
  }

  const accruals = await prisma.partnerAccrual.findMany({
    where: { id: { in: accrualIds }, partnerId, status: 'ELIGIBLE', payoutBatchId: null },
    select: { id: true, amount: true },
  });
  if (accruals.length !== accrualIds.length) {
    throw new BadRequestException(
      'All accruals must be eligible, unbatched, and belong to partner',
    );
  }

  const totalAmount = accruals.reduce((sum, row) => sum.plus(row.amount), new Decimal(0));
  const payoutDate = parseOptionalDate(input.payoutDate, 'payoutDate');

  const batch = await prisma.$transaction(async (tx) => {
    const created = await tx.partnerPayoutBatch.create({
      data: {
        partnerId,
        totalAmount,
        payoutDate,
        notes: normalizeNotes(input.notes),
      },
    });
    await tx.partnerAccrual.updateMany({
      where: { id: { in: accrualIds }, status: 'ELIGIBLE', payoutBatchId: null },
      data: { status: 'IN_BATCH', payoutBatchId: created.id },
    });
    return created;
  });

  return findPartnerPayoutBatchDto(prisma, partnerId, batch.id);
}

export async function approvePartnerPayoutBatch(
  prisma: InstanceType<typeof PrismaClient>,
  partnerId: string,
  batchId: string,
  input: ApprovePartnerPayoutBatchInput,
): Promise<PartnerPayoutBatchDto> {
  const existing = await prisma.partnerPayoutBatch.findUnique({
    where: { id: batchId },
    include: { partner: { select: { name: true } }, _count: { select: { accruals: true } } },
  });
  if (!existing || existing.partnerId !== partnerId) {
    throw new NotFoundException(`Partner payout batch ${batchId} not found`);
  }
  if (existing.status !== 'DRAFT') {
    throw new BadRequestException('Only draft payout batches can be approved');
  }
  if (existing._count.accruals === 0) {
    throw new BadRequestException('Payout batch has no accruals');
  }

  const payoutDate = parseOptionalDate(input.payoutDate, 'payoutDate') ?? existing.payoutDate;
  const approvedNotes = normalizeNotes(input.notes) ?? existing.notes;

  await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        type: 'PLANNED',
        category: 'PARTNER_PAYOUT',
        name: `Partner payout · ${existing.partner.name}`,
        amount: existing.totalAmount,
        frequency: 'ONE_TIME',
        dueDate: payoutDate,
        status: 'UNPAID',
        notes: formatExpenseNotes(existing.id, approvedNotes),
      },
    });
    await tx.partnerPayoutBatch.update({
      where: { id: batchId },
      data: {
        status: 'EXPENSE_CREATED',
        expenseId: expense.id,
        payoutDate,
        approvedBy: input.approvedBy?.trim() || null,
        notes: approvedNotes,
      },
    });
  });

  return findPartnerPayoutBatchDto(prisma, partnerId, batchId);
}

export async function syncPartnerPayoutPaidFromExpense(
  prisma: InstanceType<typeof PrismaClient>,
  expenseId: string,
): Promise<void> {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: { status: true, partnerPayoutBatch: { select: { id: true, status: true } } },
  });
  const batch = expense?.partnerPayoutBatch;
  if (!batch || expense.status !== 'PAID' || batch.status === 'PAID') return;

  await prisma.$transaction([
    prisma.partnerPayoutBatch.update({ where: { id: batch.id }, data: { status: 'PAID' } }),
    prisma.partnerAccrual.updateMany({
      where: { payoutBatchId: batch.id, status: 'IN_BATCH' },
      data: { status: 'PAID' },
    }),
  ]);
}

export async function cancelPartnerPayoutBatch(
  prisma: InstanceType<typeof PrismaClient>,
  partnerId: string,
  batchId: string,
  input: CancelPartnerPayoutBatchInput = {},
): Promise<PartnerPayoutBatchDto> {
  const existing = await prisma.partnerPayoutBatch.findUnique({
    where: { id: batchId },
    select: { id: true, partnerId: true, status: true, notes: true },
  });
  if (!existing || existing.partnerId !== partnerId) {
    throw new NotFoundException(`Partner payout batch ${batchId} not found`);
  }
  if (existing.status !== 'DRAFT') {
    throw new BadRequestException('Only draft payout batches can be cancelled');
  }

  const nextNotes = normalizeNotes(input.notes) ?? existing.notes;
  await prisma.$transaction([
    prisma.partnerPayoutBatch.update({
      where: { id: batchId },
      data: { status: 'CANCELLED', notes: nextNotes },
    }),
    prisma.partnerAccrual.updateMany({
      where: { payoutBatchId: batchId, status: 'IN_BATCH' },
      data: { status: 'ELIGIBLE', payoutBatchId: null },
    }),
  ]);

  return findPartnerPayoutBatchDto(prisma, partnerId, batchId);
}

async function findPartnerPayoutBatchDto(
  prisma: InstanceType<typeof PrismaClient>,
  partnerId: string,
  batchId: string,
): Promise<PartnerPayoutBatchDto> {
  const row = await prisma.partnerPayoutBatch.findFirst({
    where: { id: batchId, partnerId },
    select: {
      id: true,
      partnerId: true,
      totalAmount: true,
      status: true,
      payoutDate: true,
      expenseId: true,
      approvedBy: true,
      notes: true,
      createdAt: true,
      _count: { select: { accruals: true } },
    },
  });
  if (!row) throw new NotFoundException(`Partner payout batch ${batchId} not found`);
  return serializePartnerPayoutBatch(row);
}

function parseOptionalDate(value: string | undefined, fieldName: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${fieldName} must be a valid ISO date`);
  }
  return date;
}

function normalizeNotes(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function formatExpenseNotes(batchId: string, notes: string | null): string {
  const prefix = `Partner payout batch: ${batchId}`;
  return notes ? `${prefix}\n${notes}` : prefix;
}

function serializePartnerPayoutBatch(row: {
  id: string;
  partnerId: string;
  totalAmount: Decimal;
  status: string;
  payoutDate: Date | null;
  expenseId: string | null;
  approvedBy: string | null;
  notes: string | null;
  createdAt: Date;
  _count: { accruals: number };
}): PartnerPayoutBatchDto {
  return {
    id: row.id,
    partnerId: row.partnerId,
    totalAmount: row.totalAmount.toFixed(2),
    status: row.status,
    payoutDate: row.payoutDate?.toISOString() ?? null,
    expenseId: row.expenseId,
    approvedBy: row.approvedBy,
    notes: row.notes,
    accrualCount: row._count.accruals,
    createdAt: row.createdAt.toISOString(),
  };
}
