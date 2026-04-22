import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, type Prisma, type InvoiceStatusEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';

interface CreatePaymentDto {
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  confirmedBy?: string;
  notes?: string;
}

interface PaymentQueryParams {
  page?: number;
  pageSize?: number;
  invoiceId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
  ) {}

  async findAll(params: PaymentQueryParams) {
    const { page = 1, pageSize = 20, invoiceId, search, dateFrom, dateTo } = params;
    const where: Prisma.PaymentWhereInput = {};

    if (invoiceId) where.invoiceId = invoiceId;
    if (search) {
      where.invoice = { code: { contains: search, mode: 'insensitive' } };
    }
    if (dateFrom || dateTo) {
      where.paymentDate = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          invoice: {
            select: {
              id: true,
              code: true,
              amount: true,
              status: true,
              type: true,
              projectId: true,
              company: { select: { id: true, name: true } },
              order: {
                select: {
                  project: { select: { id: true, name: true } },
                },
              },
              subscription: {
                select: {
                  project: { select: { id: true, name: true } },
                },
              },
            },
          },
          confirmer: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { paymentDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      items: items.map((payment) => ({
        ...payment,
        project:
          payment.invoice?.order?.project ??
          payment.invoice?.subscription?.project ??
          (payment.invoice ? { id: payment.invoice.projectId, name: 'Unknown project' } : null),
        company: payment.invoice?.company ?? null,
      })),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            company: { select: { id: true, name: true } },
            order: {
              select: { id: true, code: true, project: { select: { id: true, name: true } } },
            },
            subscription: {
              select: { id: true, code: true, project: { select: { id: true, name: true } } },
            },
          },
        },
        confirmer: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);
    return {
      ...payment,
      project: payment.invoice.order?.project ??
        payment.invoice.subscription?.project ?? {
          id: payment.invoice.projectId,
          name: 'Unknown project',
        },
      company: payment.invoice.company ?? null,
    };
  }

  async create(data: CreatePaymentDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: data.invoiceId },
      select: {
        id: true,
        orderId: true,
        amount: true,
        status: true,
        dueDate: true,
        payments: { select: { amount: true } },
      },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${data.invoiceId} not found`);

    if (data.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const currentPaid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const nextPaid = currentPaid + data.amount;
    const invoiceAmount = Number(invoice.amount);

    if (invoice.status === 'PAID' || currentPaid >= invoiceAmount) {
      throw new BadRequestException(`Invoice ${data.invoiceId} is already fully paid`);
    }

    if (nextPaid > invoiceAmount) {
      throw new BadRequestException(
        `Payment amount exceeds outstanding invoice balance of ${invoiceAmount - currentPaid}`,
      );
    }

    const payment = await this.prisma.payment.create({
      data: {
        invoiceId: data.invoiceId,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate),
        paymentMethod: data.paymentMethod,
        confirmedBy: data.confirmedBy,
        notes: data.notes,
      },
      include: {
        invoice: { select: { id: true, code: true, amount: true, status: true } },
      },
    });

    await this.syncInvoiceStatus(data.invoiceId);

    if (invoice.orderId) {
      await this.syncOrderStatus(invoice.orderId);
    }

    return payment;
  }

  async delete(id: string) {
    const payment = await this.findById(id);
    await this.prisma.payment.delete({ where: { id } });

    await this.syncInvoiceStatus(payment.invoiceId);
    if (payment.invoice.orderId) {
      await this.syncOrderStatus(payment.invoice.orderId);
    }
  }

  private async syncInvoiceStatus(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        amount: true,
        dueDate: true,
        status: true,
        payments: { select: { amount: true } },
      },
    });
    if (!invoice) return;

    const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const status = this.resolveInvoiceStatus({
      amount: Number(invoice.amount),
      paid,
      dueDate: invoice.dueDate,
      currentStatus: invoice.status,
    });

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status,
        paidDate: status === 'PAID' ? new Date() : null,
      },
    });
  }

  private async syncOrderStatus(orderId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { orderId },
      select: {
        status: true,
        amount: true,
        payments: { select: { amount: true } },
      },
    });
    if (invoices.length === 0) return;

    const allPaid = invoices.every((inv) => inv.status === 'PAID');
    const somePaid = invoices.some((inv) =>
      inv.payments.some((payment) => Number(payment.amount) > 0),
    );

    let status: 'FULLY_PAID' | 'PARTIALLY_PAID' | 'ACTIVE' = 'ACTIVE';
    if (allPaid) status = 'FULLY_PAID';
    else if (somePaid) status = 'PARTIALLY_PAID';

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }

  private resolveInvoiceStatus(args: {
    amount: number;
    paid: number;
    dueDate: Date | null;
    currentStatus: InvoiceStatusEnum;
  }): InvoiceStatusEnum {
    const { amount, paid, dueDate, currentStatus } = args;

    if (paid >= amount) {
      return 'PAID';
    }

    if (currentStatus === 'ON_HOLD' || currentStatus === 'FAIL') {
      return currentStatus;
    }

    if (!dueDate) {
      return paid > 0 ? 'WAITING' : 'THIS_MONTH';
    }

    return dueDate.getTime() < Date.now() ? 'DELAYED' : 'WAITING';
  }
}
