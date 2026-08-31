import type { InvoiceTypeEnum, PrismaClient, TaxStatus } from '@nbos/database';
import { allocateInvoiceCode } from '../../../common/utils/entity-code-series';
import {
  persistInvoiceCreate,
  type OfficialAwaitingNotifier,
} from '../../finance/invoices/invoice-card-persist';

/** Manual deal/order invoices stay in New until Finance moves them to collection. */
const MANUAL_DEAL_INVOICE_MONEY_STATUS = 'NEW' as const;

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
  notifier?: OfficialAwaitingNotifier,
) {
  const code = await allocateInvoiceCode(prisma);
  return persistInvoiceCreate(
    prisma,
    {
      code,
      orderId: input.orderId,
      projectId: input.projectId,
      companyId: input.companyId,
      amount: input.amount,
      type: input.type,
      dueDate: input.dueDate,
      moneyStatus: MANUAL_DEAL_INVOICE_MONEY_STATUS,
      taxStatus: input.taxStatus,
    },
    notifier,
  );
}
