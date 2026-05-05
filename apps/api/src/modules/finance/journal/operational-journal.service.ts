import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';

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
const FIRST_DAY_OF_MONTH = 1;

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

    return this.prisma.operationalJournalEntry.upsert({
      where: { idempotencyKey: `payment:${input.paymentId}` },
      update: {},
      create: {
        amount: input.amount,
        currency: FUNCTIONAL_CURRENCY,
        fxRateApplied: DEFAULT_FX_RATE,
        functionalAmount: input.amount,
        bookedAt: input.bookedAt,
        recognitionBasis: 'CASH',
        postingPeriodId: postingPeriod.id,
        idempotencyKey: `payment:${input.paymentId}`,
        sourceType: 'PAYMENT',
        sourceId: input.paymentId,
        description,
        companyId: input.companyId ?? undefined,
        projectId: input.projectId ?? undefined,
        productId: input.productId ?? undefined,
        orderId: input.orderId ?? undefined,
      },
    });
  }

  /**
   * Accrual-basis partner liability line (does not affect {@link getCashMovementSummary} cash totals).
   */
  async appendPartnerAccrualLine(input: PartnerAccrualJournalLineInput) {
    const postingPeriod = await this.ensureOpenPostingPeriod(input.bookedAt);
    const description =
      input.description ?? `Partner accrual ${input.partnerAccrualId.slice(0, 8)}`;

    return this.prisma.operationalJournalEntry.upsert({
      where: { idempotencyKey: `partner-accrual:${input.partnerAccrualId}` },
      update: {},
      create: {
        amount: input.amount,
        currency: FUNCTIONAL_CURRENCY,
        fxRateApplied: DEFAULT_FX_RATE,
        functionalAmount: input.amount,
        bookedAt: input.bookedAt,
        recognitionBasis: 'ACCRUAL',
        postingPeriodId: postingPeriod.id,
        idempotencyKey: `partner-accrual:${input.partnerAccrualId}`,
        sourceType: 'PARTNER_ACCRUAL',
        sourceId: input.partnerAccrualId,
        description,
        companyId: input.companyId ?? undefined,
        projectId: input.projectId,
        productId: input.productId ?? undefined,
        orderId: input.orderId,
        partnerId: input.partnerId,
      },
    });
  }

  private async ensureOpenPostingPeriod(bookedAt: Date): Promise<PostingPeriod> {
    const monthKey = this.resolveMonthKey(bookedAt);
    const existing = await this.prisma.financePostingPeriod.findUnique({ where: { monthKey } });

    if (existing?.status === 'CLOSED') {
      throw new BadRequestException(`Finance posting period ${monthKey} is closed`);
    }
    if (existing) return existing;

    return this.prisma.financePostingPeriod.create({
      data: {
        monthKey,
        startsAt: this.resolvePeriodStart(bookedAt),
        endsAt: this.resolvePeriodEnd(bookedAt),
      },
    });
  }

  private resolveMonthKey(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private resolvePeriodStart(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), FIRST_DAY_OF_MONTH));
  }

  private resolvePeriodEnd(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, FIRST_DAY_OF_MONTH));
  }

  private buildBookedAtFilter(params: JournalSummaryParams): Prisma.DateTimeFilter | undefined {
    if (!params.dateFrom && !params.dateTo) return undefined;

    return {
      ...(params.dateFrom ? { gte: new Date(params.dateFrom) } : {}),
      ...(params.dateTo ? { lte: new Date(params.dateTo) } : {}),
    };
  }
}
