import type { InvoiceTypeEnum, PrismaClient, TaxStatus } from '@nbos/database';
import { resolveDepositInvoiceMoneyStatus } from '@nbos/shared';

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
  const company = input.companyId
    ? await prisma.company.findUnique({
        where: { id: input.companyId },
        select: { name: true, taxId: true },
      })
    : null;
  const moneyStatus = resolveDepositInvoiceMoneyStatus({
    taxStatus: input.taxStatus,
    company,
  });
  return prisma.invoice.create({
    data: {
      code,
      orderId: input.orderId,
      projectId: input.projectId,
      companyId: input.companyId,
      amount: input.amount,
      type: input.type,
      dueDate: input.dueDate,
      moneyStatus,
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
