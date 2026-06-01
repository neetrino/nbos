import type { InvoiceTypeEnum, PrismaClient, TaxStatus } from '@nbos/database';

interface CreateDealInvoiceInput {
  orderId: string;
  projectId: string;
  companyId?: string;
  amount: number;
  type: InvoiceTypeEnum;
  taxStatus: TaxStatus;
  dueDate?: Date;
}

export async function createDealDepositInvoice(
  prisma: InstanceType<typeof PrismaClient>,
  input: CreateDealInvoiceInput,
) {
  const code = await generateInvoiceCode(prisma);
  return prisma.invoice.create({
    data: {
      code,
      orderId: input.orderId,
      projectId: input.projectId,
      companyId: input.companyId,
      amount: input.amount,
      type: input.type,
      dueDate: input.dueDate,
      moneyStatus: 'AWAITING_PAYMENT',
      taxStatus: input.taxStatus,
    },
  });
}

async function generateInvoiceCode(prisma: InstanceType<typeof PrismaClient>): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const last = await prisma.invoice.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
  });
  const nextNum = last ? parseInt(last.code.split('-')[2] ?? '0', 10) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}
