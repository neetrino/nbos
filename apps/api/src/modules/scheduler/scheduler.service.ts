import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { BillingService } from '../finance/billing/billing.service';

interface OverdueResult {
  marked: number;
  invoiceIds: string[];
}

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly billingService: BillingService,
  ) {}

  /** Ամադdelays delays billing — delays billing subscriptions-ի ежемесячные invoices */
  async runBilling() {
    this.logger.log('Scheduler: running monthly billing');
    const result = await this.billingService.runMonthlyBilling();
    this.logger.log(
      `Billing complete: ${result.generatedInvoices} invoices, $${result.totalAmount}`,
    );
    return result;
  }

  /** Delays ежемесячный expenses generation */
  async runExpenses() {
    this.logger.log('Scheduler: running monthly expenses');
    const result = await this.billingService.runMonthlyExpenses();
    this.logger.log(`Expenses complete: ${result.generated} generated`);
    return result;
  }

  /** Գdelays delays overdue invoices — dueDate < now, status ≠ PAID/CANCELLED */
  async markOverdueInvoices(): Promise<OverdueResult> {
    this.logger.log('Scheduler: marking overdue invoices');

    const now = new Date();
    const overdueInvoices = await this.prisma.invoice.findMany({
      where: {
        status: {
          notIn: ['PAID', 'FAIL', 'DELAYED'] as Prisma.EnumInvoiceStatusEnumFilter['notIn'],
        },
        dueDate: { lt: now },
      },
      select: { id: true, code: true },
    });

    if (overdueInvoices.length === 0) {
      this.logger.log('No overdue invoices found');
      return { marked: 0, invoiceIds: [] };
    }

    const ids = overdueInvoices.map((inv) => inv.id);
    await this.prisma.invoice.updateMany({
      where: { id: { in: ids } },
      data: { status: 'DELAYED' as Prisma.InvoiceUpdateManyMutationInput['status'] },
    });

    this.logger.log(
      `Marked ${ids.length} invoices as overdue: ${overdueInvoices.map((i) => i.code).join(', ')}`,
    );
    return { marked: ids.length, invoiceIds: ids };
  }
}
