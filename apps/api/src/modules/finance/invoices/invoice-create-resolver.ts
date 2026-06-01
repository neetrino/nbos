import type { InvoiceTypeEnum, PrismaClient } from '@nbos/database';
import { INVOICE_DEFAULT_DUE_DAYS } from './invoice-create.constants';

export interface CreateInvoiceResolveInput {
  orderId?: string;
  subscriptionId?: string;
  clientServiceRecordId?: string;
  type?: string;
}

export function resolveInvoiceDueDate(dueDateRaw?: string): Date {
  if (dueDateRaw?.trim()) {
    return new Date(dueDateRaw);
  }
  const due = new Date();
  due.setDate(due.getDate() + INVOICE_DEFAULT_DUE_DAYS);
  due.setHours(0, 0, 0, 0);
  return due;
}

export async function resolveCreateInvoiceType(
  prisma: InstanceType<typeof PrismaClient>,
  data: CreateInvoiceResolveInput,
): Promise<InvoiceTypeEnum> {
  const explicit = data.type?.trim();
  if (explicit) {
    return explicit as InvoiceTypeEnum;
  }

  if (data.subscriptionId) {
    return 'SUBSCRIPTION';
  }

  if (data.clientServiceRecordId) {
    const service = await prisma.clientServiceRecord.findUnique({
      where: { id: data.clientServiceRecordId },
      select: { type: true },
    });
    if (service?.type === 'DOMAIN') return 'DOMAIN';
    return 'SERVICE';
  }

  if (data.orderId) {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      select: { type: true, paymentType: true },
    });
    if (order?.paymentType === 'SUBSCRIPTION') return 'SUBSCRIPTION';
    if (order?.type === 'EXTENSION') return 'EXTENSION';
    if (order?.type === 'MAINTENANCE') return 'SUBSCRIPTION';
    return 'DEVELOPMENT';
  }

  return 'MANUAL';
}
