import { PrismaClient } from '@nbos/database';

export const PAID_INVOICE_ACCRUAL_SELECT = {
  id: true,
  paidDate: true,
  moneyStatus: true,
  amount: true,
  type: true,
  coverageMonthCount: true,
  orderId: true,
  payments: { select: { paymentDate: true } },
  order: {
    select: {
      id: true,
      projectId: true,
      totalAmount: true,
      paymentType: true,
      paymentMode: true,
      dealId: true,
      deal: {
        select: {
          id: true,
          source: true,
          amount: true,
          sellerId: true,
          sellerAssistantId: true,
        },
      },
    },
  },
} as const;

export async function loadPaidSalesBonusInvoice(
  prisma: InstanceType<typeof PrismaClient>,
  invoiceId: string,
) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: PAID_INVOICE_ACCRUAL_SELECT,
  });
  if (!invoice || invoice.moneyStatus !== 'PAID' || !invoice.orderId || !invoice.order) {
    return null;
  }
  return invoice;
}
