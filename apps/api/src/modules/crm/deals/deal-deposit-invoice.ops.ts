import type { InvoiceTypeEnum, PrismaClient, TaxStatus } from '@nbos/database';
import { allocateInvoiceCode } from '../../../common/utils/entity-code-series';
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
  const code = await allocateInvoiceCode(prisma);
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
