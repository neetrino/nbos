import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  PrismaClient,
  type JournalRecognitionBasisEnum,
  type JournalSourceTypeEnum,
  type Prisma,
} from '@nbos/database';
import { randomUUID } from 'node:crypto';
import { PRISMA_TOKEN } from '../../../database.module';
import { assertPostingPeriodOpenForBookedAt } from './posting-period-guard';
import {
  resolvePostingMonthKey,
  resolvePostingPeriodEnd,
  resolvePostingPeriodStart,
} from './posting-period-utils';

interface PaymentJournalLineInput {
  paymentId: string;
  invoiceCode?: string;
  amount: number;
  bookedAt: Date;
  companyId?: string | null;
  projectId?: string | null;
  productId?: string | null;
  orderId?: string | null;
}

export interface PartnerAccrualJournalLineInput {
  partnerAccrualId: string;
  amount: number;
  bookedAt: Date;
  partnerId: string;
  companyId?: string | null;
  projectId: string;
  productId?: string | null;
  orderId: string;
  description?: string;
}

interface ExpensePaymentJournalLineInput {
  expensePaymentId: string;
  expenseName?: string;
  amount: number;
  bookedAt: Date;
  projectId?: string | null;
  companyId?: string | null;
}

interface InvoiceAccrualJournalLineInput {
  invoiceId: string;
  invoiceCode?: string;
  amount: number;
  bookedAt: Date;
  companyId?: string | null;
  projectId?: string | null;
  productId?: string | null;
  orderId?: string | null;
}

interface ExpenseAccrualJournalLineInput {
  expenseId: string;
  expenseName?: string;
  amount: number;
  bookedAt: Date;
  projectId?: string | null;
}

export interface ManualAdjustmentInput {
  amount: number;
  bookedAt: string;
  description: string;
  recognitionBasis?: JournalRecognitionBasisEnum;
  companyId?: string | null;
  projectId?: string | null;
  productId?: string | null;
  orderId?: string | null;
  employeeId?: string | null;
}

interface JournalListParams {
  page?: number;
  pageSize?: number;
  monthKey?: string;
  sourceType?: string;
}

interface PostingPeriod {
  id: string;
  status: 'OPEN' | 'CLOSED';
}

interface JournalSummaryParams {
  dateFrom?: string;
  dateTo?: string;
}

const FUNCTIONAL_CURRENCY = 'AMD';
const DEFAULT_FX_RATE = 1;
const JOURNAL_LIST_MAX_PAGE_SIZE = 100;

@Injectable()
export class OperationalJournalService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async listPostingPeriods() {
    return this.prisma.financePostingPeriod.findMany({
      orderBy: { monthKey: 'desc' },
      include: { _count: { select: { journalEntries: true } } },
    });
  }

  async closePostingPeriod(monthKey: string) {
    const period = await this.prisma.financePostingPeriod.findUnique({ where: { monthKey } });
    if (!period) throw new BadRequestException(`Finance posting period ${monthKey} does not exist`);
    if (period.status === 'CLOSED') return period;

    return this.prisma.financePostingPeriod.update({
      where: { monthKey },
      data: { status: 'CLOSED', closedAt: new Date() },
    });
  }

  async listEntries(params: JournalListParams = {}) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(JOURNAL_LIST_MAX_PAGE_SIZE, Math.max(1, params.pageSize ?? 50));
    const where: Prisma.OperationalJournalEntryWhereInput = {
      status: 'ACTIVE',
      ...(params.sourceType ? { sourceType: params.sourceType as JournalSourceTypeEnum } : {}),
      ...(params.monthKey ? { postingPeriod: { monthKey: params.monthKey } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.operationalJournalEntry.findMany({
        where,
        orderBy: { bookedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { postingPeriod: { select: { monthKey: true, status: true } } },
      }),
      this.prisma.operationalJournalEntry.count({ where }),
    ]);

    return {
      items: items.map((row) => ({
        ...row,
        amount: String(row.amount),
        functionalAmount: String(row.functionalAmount),
        fxRateApplied: String(row.fxRateApplied),
      })),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async appendManualAdjustment(input: ManualAdjustmentInput) {
    const bookedAt = new Date(input.bookedAt);
    if (Number.isNaN(bookedAt.getTime())) {
      throw new BadRequestException('bookedAt must be a valid ISO date');
    }
    const description = input.description?.trim();
    if (!description) {
      throw new BadRequestException('description is required for manual adjustments');
    }
    if (!Number.isFinite(input.amount) || input.amount === 0) {
      throw new BadRequestException('amount must be a non-zero number');
    }

    const postingPeriod = await this.ensureOpenPostingPeriod(bookedAt);
    const recognitionBasis = input.recognitionBasis ?? 'ACCRUAL';
    const idempotencyKey = `manual:${randomUUID()}`;

    return this.prisma.operationalJournalEntry.create({
      data: {
        amount: input.amount,
        currency: FUNCTIONAL_CURRENCY,
        fxRateApplied: DEFAULT_FX_RATE,
        functionalAmount: input.amount,
        bookedAt,
        recognitionBasis,
        postingPeriodId: postingPeriod.id,
        idempotencyKey,
        sourceType: 'MANUAL_ADJUSTMENT',
        sourceId: idempotencyKey,
        description,
        companyId: input.companyId ?? undefined,
        projectId: input.projectId ?? undefined,
        productId: input.productId ?? undefined,
        orderId: input.orderId ?? undefined,
        employeeId: input.employeeId ?? undefined,
      },
    });
  }

  async getCashMovementSummary(params: JournalSummaryParams = {}) {
    const bookedAt = this.buildBookedAtFilter(params);
    const where = {
      recognitionBasis: 'CASH',
      status: 'ACTIVE',
      ...(bookedAt ? { bookedAt } : {}),
    } satisfies Prisma.OperationalJournalEntryWhereInput;
    const [movement, entryCount] = await Promise.all([
      this.prisma.operationalJournalEntry.aggregate({ where, _sum: { functionalAmount: true } }),
      this.prisma.operationalJournalEntry.count({ where }),
    ]);

    return {
      basis: 'CASH',
      source: 'OperationalJournal',
      entryCount,
      netCashMovement: movement._sum.functionalAmount ?? 0,
    };
  }

  async appendCashPaymentLine(input: PaymentJournalLineInput) {
    const postingPeriod = await this.ensureOpenPostingPeriod(input.bookedAt);
    const description = input.invoiceCode
      ? `Cash payment for invoice ${input.invoiceCode}`
      : 'Cash payment';

    return this.upsertJournalLine({
      idempotencyKey: `payment:${input.paymentId}`,
      amount: input.amount,
      functionalAmount: input.amount,
      bookedAt: input.bookedAt,
      recognitionBasis: 'CASH',
      postingPeriodId: postingPeriod.id,
      sourceType: 'PAYMENT',
      sourceId: input.paymentId,
      description,
      companyId: input.companyId,
      projectId: input.projectId,
      productId: input.productId,
      orderId: input.orderId,
    });
  }

  async appendExpensePaymentLine(input: ExpensePaymentJournalLineInput) {
    const postingPeriod = await this.ensureOpenPostingPeriod(input.bookedAt);
    const description = input.expenseName
      ? `Cash expense payment: ${input.expenseName}`
      : 'Cash expense payment';
    const outflow = -Math.abs(input.amount);

    return this.upsertJournalLine({
      idempotencyKey: `expense-payment:${input.expensePaymentId}`,
      amount: input.amount,
      functionalAmount: outflow,
      bookedAt: input.bookedAt,
      recognitionBasis: 'CASH',
      postingPeriodId: postingPeriod.id,
      sourceType: 'EXPENSE_PAYMENT',
      sourceId: input.expensePaymentId,
      description,
      companyId: input.companyId,
      projectId: input.projectId,
    });
  }

  async appendInvoiceCardAccrualLine(input: InvoiceAccrualJournalLineInput) {
    const postingPeriod = await this.ensureOpenPostingPeriod(input.bookedAt);
    const description = input.invoiceCode
      ? `Invoice card accrual ${input.invoiceCode}`
      : 'Invoice card accrual';

    return this.upsertJournalLine({
      idempotencyKey: `invoice-accrual:${input.invoiceId}`,
      amount: input.amount,
      functionalAmount: input.amount,
      bookedAt: input.bookedAt,
      recognitionBasis: 'ACCRUAL',
      postingPeriodId: postingPeriod.id,
      sourceType: 'INVOICE_CARD',
      sourceId: input.invoiceId,
      description,
      companyId: input.companyId,
      projectId: input.projectId,
      productId: input.productId,
      orderId: input.orderId,
    });
  }

  async appendExpenseCardAccrualLine(input: ExpenseAccrualJournalLineInput) {
    const postingPeriod = await this.ensureOpenPostingPeriod(input.bookedAt);
    const description = input.expenseName
      ? `Expense card accrual: ${input.expenseName}`
      : 'Expense card accrual';
    const expenseAmount = -Math.abs(input.amount);

    return this.upsertJournalLine({
      idempotencyKey: `expense-accrual:${input.expenseId}`,
      amount: input.amount,
      functionalAmount: expenseAmount,
      bookedAt: input.bookedAt,
      recognitionBasis: 'ACCRUAL',
      postingPeriodId: postingPeriod.id,
      sourceType: 'EXPENSE_CARD',
      sourceId: input.expenseId,
      description,
      projectId: input.projectId,
    });
  }

  /** Marks an accrual line reversed (Profile D void/cancel). No-op when missing or already reversed. */
  async reverseJournalLineByIdempotencyKey(
    idempotencyKey: string,
    reversalNote: string,
  ): Promise<void> {
    const row = await this.prisma.operationalJournalEntry.findUnique({
      where: { idempotencyKey },
      select: { id: true, status: true, description: true },
    });
    if (!row || row.status === 'REVERSED') return;

    const description = row.description?.trim()
      ? `${row.description} — ${reversalNote}`
      : reversalNote;

    await this.prisma.operationalJournalEntry.update({
      where: { idempotencyKey },
      data: { status: 'REVERSED', description },
    });
  }

  async appendPartnerAccrualLine(input: PartnerAccrualJournalLineInput) {
    const postingPeriod = await this.ensureOpenPostingPeriod(input.bookedAt);
    const description =
      input.description ?? `Partner accrual ${input.partnerAccrualId.slice(0, 8)}`;

    return this.upsertJournalLine({
      idempotencyKey: `partner-accrual:${input.partnerAccrualId}`,
      amount: input.amount,
      functionalAmount: input.amount,
      bookedAt: input.bookedAt,
      recognitionBasis: 'ACCRUAL',
      postingPeriodId: postingPeriod.id,
      sourceType: 'PARTNER_ACCRUAL',
      sourceId: input.partnerAccrualId,
      description,
      companyId: input.companyId,
      projectId: input.projectId,
      productId: input.productId,
      orderId: input.orderId,
      partnerId: input.partnerId,
    });
  }

  private async upsertJournalLine(data: {
    idempotencyKey: string;
    amount: number;
    functionalAmount: number;
    bookedAt: Date;
    recognitionBasis: JournalRecognitionBasisEnum;
    postingPeriodId: string;
    sourceType: Prisma.OperationalJournalEntryCreateInput['sourceType'];
    sourceId: string;
    description: string;
    companyId?: string | null;
    projectId?: string | null;
    productId?: string | null;
    orderId?: string | null;
    partnerId?: string | null;
    employeeId?: string | null;
  }) {
    return this.prisma.operationalJournalEntry.upsert({
      where: { idempotencyKey: data.idempotencyKey },
      update: {},
      create: {
        amount: data.amount,
        currency: FUNCTIONAL_CURRENCY,
        fxRateApplied: DEFAULT_FX_RATE,
        functionalAmount: data.functionalAmount,
        bookedAt: data.bookedAt,
        recognitionBasis: data.recognitionBasis,
        postingPeriodId: data.postingPeriodId,
        idempotencyKey: data.idempotencyKey,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        description: data.description,
        companyId: data.companyId ?? undefined,
        projectId: data.projectId ?? undefined,
        productId: data.productId ?? undefined,
        orderId: data.orderId ?? undefined,
        partnerId: data.partnerId ?? undefined,
        employeeId: data.employeeId ?? undefined,
      },
    });
  }

  private async ensureOpenPostingPeriod(bookedAt: Date): Promise<PostingPeriod> {
    await assertPostingPeriodOpenForBookedAt(this.prisma, bookedAt);
    const monthKey = resolvePostingMonthKey(bookedAt);
    const existing = await this.prisma.financePostingPeriod.findUnique({ where: { monthKey } });
    if (existing) return existing;

    return this.prisma.financePostingPeriod.create({
      data: {
        monthKey,
        startsAt: resolvePostingPeriodStart(bookedAt),
        endsAt: resolvePostingPeriodEnd(bookedAt),
      },
    });
  }

  private buildBookedAtFilter(params: JournalSummaryParams): Prisma.DateTimeFilter | undefined {
    if (!params.dateFrom && !params.dateTo) return undefined;

    return {
      ...(params.dateFrom ? { gte: new Date(params.dateFrom) } : {}),
      ...(params.dateTo ? { lte: new Date(params.dateTo) } : {}),
    };
  }
}
