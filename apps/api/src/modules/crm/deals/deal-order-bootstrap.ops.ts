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

interface DealOrderBootstrapInput {
  id: string;
  code: string;
  type: DealTypeEnum | null;
  amount: unknown;
  paymentType: PaymentTypeEnum | null;
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

  const projectCode = await generateProjectCode(prisma);
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
  const code = await generateOrderCode(prisma);

  const order = await prisma.order.create({
    data: {
      code,
      projectId,
      dealId: input.deal.id,
      type: orderType,
      paymentType: (input.deal.paymentType ?? 'CLASSIC') as PaymentTypeEnum,
      totalAmount: input.totalAmount,
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

async function generateProjectCode(prisma: InstanceType<typeof PrismaClient>): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `P-${year}-`;
  const last = await prisma.project.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
  });
  const nextNum = last ? parseInt(last.code.split('-')[2] ?? '0', 10) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

async function generateOrderCode(prisma: InstanceType<typeof PrismaClient>): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;
  const last = await prisma.order.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
  });
  const nextNum = last ? parseInt(last.code.split('-')[2] ?? '0', 10) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}
