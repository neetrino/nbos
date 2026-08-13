import { PrismaClient, type Prisma } from '@nbos/database';

const referralTermsSelect = {
  id: true,
  partnerId: true,
  partnerPercent: true,
  dealType: true,
  paymentType: true,
} as const;

const inboundSubscriptionOrderSelect = {
  id: true,
  projectId: true,
  dealId: true,
  productId: true,
  extensionId: true,
  paymentType: true,
  deal: {
    select: {
      source: true,
      sourcePartnerId: true,
      partnerReferralTerms: { select: referralTermsSelect },
    },
  },
  product: { select: { status: true } },
  extension: { select: { status: true } },
} satisfies Prisma.OrderSelect;

export type InboundSubscriptionOrder = Prisma.OrderGetPayload<{
  select: typeof inboundSubscriptionOrderSelect;
}>;

export type PaidSubscriptionInvoice = {
  id: string;
  companyId: string | null;
  projectId: string;
  orderId: string | null;
  subscriptionId: string;
  subscription: { partnerId: string | null; type: string } | null;
};

type PrismaClientLike = InstanceType<typeof PrismaClient>;

export async function loadPaidSubscriptionInvoice(
  prisma: PrismaClientLike,
  invoiceId: string,
): Promise<PaidSubscriptionInvoice | null> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      moneyStatus: true,
      type: true,
      projectId: true,
      orderId: true,
      subscriptionId: true,
      companyId: true,
      subscription: { select: { partnerId: true, type: true } },
    },
  });
  if (!invoice || invoice.moneyStatus !== 'PAID') return null;
  if (invoice.type !== 'SUBSCRIPTION' || !invoice.subscriptionId) return null;
  if (!invoice.projectId) return null;
  return { ...invoice, projectId: invoice.projectId, subscriptionId: invoice.subscriptionId };
}

export async function resolveEligiblePartnerOrder(
  prisma: PrismaClientLike,
  invoice: PaidSubscriptionInvoice,
): Promise<InboundSubscriptionOrder | null> {
  const order = await resolveOrderForSubscriptionPartnerInvoice(prisma, {
    projectId: invoice.projectId,
    orderId: invoice.orderId,
    subscriptionPartnerId: invoice.subscription?.partnerId ?? null,
  });
  if (!order?.dealId || !order.deal) return null;
  if (order.paymentType !== 'SUBSCRIPTION') return null;
  if (order.deal.source !== 'PARTNER' || !order.deal.sourcePartnerId) return null;

  const terms = order.deal.partnerReferralTerms;
  if (!terms || terms.partnerId !== order.deal.sourcePartnerId) return null;
  if (terms.paymentType && terms.paymentType !== order.paymentType) return null;
  return order;
}

async function resolveOrderForSubscriptionPartnerInvoice(
  prisma: PrismaClientLike,
  input: {
    projectId: string;
    orderId: string | null;
    subscriptionPartnerId: string | null;
  },
): Promise<InboundSubscriptionOrder | null> {
  if (input.orderId) {
    return prisma.order.findUnique({
      where: { id: input.orderId },
      select: inboundSubscriptionOrderSelect,
    });
  }

  const dealPartnerFilter = input.subscriptionPartnerId
    ? { sourcePartnerId: input.subscriptionPartnerId }
    : { sourcePartnerId: { not: null } };

  return prisma.order.findFirst({
    where: {
      projectId: input.projectId,
      paymentType: 'SUBSCRIPTION',
      deal: {
        source: 'PARTNER',
        ...dealPartnerFilter,
        partnerReferralTerms: { isNot: null },
      },
    },
    orderBy: { createdAt: 'asc' },
    select: inboundSubscriptionOrderSelect,
  });
}
