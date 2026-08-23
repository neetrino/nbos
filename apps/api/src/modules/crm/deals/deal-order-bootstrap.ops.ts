import { BadRequestException } from '@nestjs/common';
import type {
  DealTypeEnum,
  OrderDeliveryStartModeEnum,
  OrderPaymentModeEnum,
  OrderStatusEnum,
  OrderTypeEnum,
  PaymentTypeEnum,
  PrismaClient,
  TaxStatus,
} from '@nbos/database';
import { deriveSubscriptionContractTotal } from './deal-subscription-contract-total';
import { allocateOrderCode, allocateProjectCode } from '../../../common/utils/entity-code-series';

interface DealOrderBootstrapInput {
  id: string;
  code: string;
  type: DealTypeEnum | null;
  amount: unknown;
  paymentType: PaymentTypeEnum | null;
  subscriptionTermMonths?: number | null;
  taxStatus: TaxStatus | null;
  projectId: string | null;
  contactId: string | null;
  companyId: string | null;
  name: string | null;
  sourcePartnerId: string | null;
}

interface CreateDealOrderInput {
  deal: DealOrderBootstrapInput;
  totalAmount: number;
  paymentMode: OrderPaymentModeEnum;
  deliveryStartMode: OrderDeliveryStartModeEnum;
  status: OrderStatusEnum;
}

export async function ensureProjectForDeal(
  prisma: InstanceType<typeof PrismaClient>,
  deal: DealOrderBootstrapInput,
): Promise<string> {
  if (deal.projectId) return deal.projectId;
  if (!deal.contactId) {
    throw new BadRequestException('Deal must have a contact before a project can be created');
  }

  const projectCode = await allocateProjectCode(prisma);
  const project = await prisma.project.create({
    data: {
      code: projectCode,
      name: deal.name ?? `Project from ${deal.code}`,
      contactId: deal.contactId,
      companyId: deal.companyId ?? undefined,
    },
  });

  await prisma.deal.update({
    where: { id: deal.id },
    data: { projectId: project.id },
  });

  return project.id;
}

export async function createOrderForDeal(
  prisma: InstanceType<typeof PrismaClient>,
  input: CreateDealOrderInput,
): Promise<{ id: string; code: string; projectId: string }> {
  const projectId = await ensureProjectForDeal(prisma, input.deal);
  const orderType = mapDealTypeToOrderType(input.deal.type);
  const code = await allocateOrderCode(prisma);

  const order = await prisma.order.create({
    data: {
      code,
      projectId,
      dealId: input.deal.id,
      type: orderType,
      paymentType: (input.deal.paymentType ?? 'CLASSIC') as PaymentTypeEnum,
      totalAmount: input.totalAmount,
      subscriptionTermMonths: input.deal.subscriptionTermMonths ?? null,
      taxStatus: (input.deal.taxStatus ?? 'TAX') as TaxStatus,
      status: input.status,
      paymentMode: input.paymentMode,
      deliveryStartMode: input.deliveryStartMode,
      partnerId: input.deal.sourcePartnerId ?? undefined,
    },
  });

  return { id: order.id, code: order.code, projectId };
}

export function mapDealTypeToOrderType(dealType: DealTypeEnum | null): OrderTypeEnum {
  if (dealType === 'EXTENSION') return 'EXTENSION';
  if (dealType === 'MAINTENANCE') return 'MAINTENANCE';
  if (dealType === 'OUTSOURCE') return 'OUTSOURCE';
  return 'PRODUCT';
}

export function assertDealHasCommercialAmount(deal: DealOrderBootstrapInput): number {
  const amount = Number(deal.amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new BadRequestException('Deal amount must be greater than zero for this action');
  }
  return amount;
}

/**
 * Order.totalAmount for handoff: CLASSIC / open-ended subscription = period (deal) amount;
 * SUBSCRIPTION with a term = period × term (contract total).
 */
export function resolveDealOrderTotalAmount(
  deal: Pick<DealOrderBootstrapInput, 'amount' | 'paymentType' | 'subscriptionTermMonths'>,
  fallbackPeriodAmount?: number,
): number {
  const periodAmount = Number(deal.amount ?? fallbackPeriodAmount ?? 0);
  if (deal.paymentType === 'SUBSCRIPTION' && deal.subscriptionTermMonths != null) {
    return deriveSubscriptionContractTotal(periodAmount, deal.subscriptionTermMonths);
  }
  return periodAmount;
}
