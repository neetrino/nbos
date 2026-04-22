import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';

interface BillingRunResult {
  generatedInvoices: number;
  totalAmount: number;
  errors: string[];
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
  ) {}

  /**
   * Generates invoices for all active subscriptions whose billingDay matches today.
   * Skips subscriptions that already have an invoice for the current month.
   */
  async runMonthlyBilling(targetDate?: Date): Promise<BillingRunResult> {
    const now = targetDate ?? new Date();
    const day = now.getDate();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        billingDay: day,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        partner: { select: { id: true } },
      },
    });

    this.logger.log(`Found ${subscriptions.length} subscriptions to bill for day ${day}`);

    let generatedInvoices = 0;
    let totalAmount = 0;
    const errors: string[] = [];

    for (const sub of subscriptions) {
      try {
        const existing = await this.prisma.invoice.findFirst({
          where: {
            subscriptionId: sub.id,
            createdAt: { gte: monthStart, lte: monthEnd },
          },
        });

        if (existing) {
          this.logger.log(`Invoice already exists for subscription ${sub.code} this month`);
          continue;
        }

        const code = await this.generateInvoiceCode(now);
        const dueDate = new Date(now.getFullYear(), now.getMonth(), day + 14);

        await this.prisma.invoice.create({
          data: {
            code,
            subscriptionId: sub.id,
            projectId: sub.projectId,
            amount: sub.amount,
            taxStatus: sub.taxStatus,
            type: 'SUBSCRIPTION' as Prisma.InvoiceCreateInput['type'],
            dueDate,
          },
        });

        generatedInvoices++;
        totalAmount += Number(sub.amount);
        this.logger.log(`Generated invoice ${code} for subscription ${sub.code}`);
      } catch (err) {
        const message = `Failed to generate invoice for subscription ${sub.code}: ${(err as Error).message}`;
        this.logger.error(message);
        errors.push(message);
      }
    }

    return { generatedInvoices, totalAmount, errors };
  }

  /**
   * Generates planned expenses (rent, salaries, etc.) for the 1st of each month.
   */
  async runMonthlyExpenses(targetDate?: Date): Promise<{ generated: number }> {
    const now = targetDate ?? new Date();

    if (now.getDate() !== 1) {
      return { generated: 0 };
    }

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const existingCount = await this.prisma.expense.count({
      where: {
        type: 'PLANNED',
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    });

    if (existingCount > 0) {
      this.logger.log('Planned expenses already generated for this month');
      return { generated: 0 };
    }

    const templates = await this.prisma.expense.findMany({
      where: { type: 'PLANNED' },
      orderBy: { createdAt: 'desc' },
      distinct: ['category'],
    });

    let generated = 0;
    for (const tpl of templates) {
      await this.prisma.expense.create({
        data: {
          projectId: tpl.projectId,
          category: tpl.category,
          name: tpl.name,
          type: 'PLANNED',
          amount: tpl.amount,
          notes: tpl.notes,
        },
      });
      generated++;
    }

    this.logger.log(`Generated ${generated} planned expenses for the month`);
    return { generated };
  }

  private async generateInvoiceCode(targetDate: Date): Promise<string> {
    const year = targetDate.getFullYear();
    const prefix = `INV-${year}-`;
    const last = await this.prisma.invoice.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
    });
    const nextNum = last ? parseInt(last.code.split('-')[2] ?? '0', 10) + 1 : 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }
}
