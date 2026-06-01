import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import type { DealWonModeEnum, PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { AuditService } from '../../audit/audit.service';
import { dealDetailInclude } from './deal.includes';
import { DealWonHandler } from './deal-won.handler';
import { validateDealWonGate } from './deal-won-gate';
import {
  assertDealHasCommercialAmount,
  createOrderForDeal,
  ensureProjectForDeal,
} from './deal-order-bootstrap.ops';
import { createDealDepositInvoice } from './deal-deposit-invoice.ops';
import {
  DEPOSIT_COMMERCIAL_DEAL_TYPES,
  EXCEPTION_REASON_MIN_LEN,
  PRIVILEGED_COMMERCIAL_ROLE_LEVEL,
  type CreateDepositOrderBody,
  type CreateExceptionOrderBody,
  type DealCommercialActor,
  type DealExceptionType,
  type StartEarlyDeliveryBody,
} from './deal-commercial-handoff.types';

@Injectable()
export class DealCommercialHandoffService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly dealWonHandler: DealWonHandler,
    private readonly auditService: AuditService,
  ) {}

  async createDepositOrder(dealId: string, body: CreateDepositOrderBody) {
    const deal = await this.loadCommercialDeal(dealId);
    this.assertDepositCommercialDeal(deal);
    if (deal.status === 'WON' || deal.status === 'FAILED') {
      throw new BadRequestException('Deal is already closed');
    }

    const amount = body.amount;
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Invoice amount must be greater than zero');
    }

    let order = deal.orders[0];
    if (!order) {
      const created = await createOrderForDeal(this.prisma, {
        deal,
        totalAmount: Number(deal.amount ?? amount),
        paymentMode: 'STANDARD_PREPAY',
        deliveryStartMode: 'AFTER_PAYMENT',
        status: 'PENDING_PAYMENT',
      });
      const reloaded = await this.reloadDeal(dealId);
      order = reloaded.orders.find((row) => row.id === created.id) ?? reloaded.orders[0];
    }

    if (!order) {
      throw new BadRequestException('Could not create deposit order');
    }

    const hasInvoice = order.invoices.length > 0;
    if (!hasInvoice) {
      const taxStatus = deal.taxStatus ?? 'TAX';
      await createDealDepositInvoice(this.prisma, {
        orderId: order.id,
        projectId: order.projectId,
        companyId: taxStatus === 'TAX' ? (deal.companyId ?? undefined) : undefined,
        amount,
        type: deal.paymentType === 'SUBSCRIPTION' ? 'SUBSCRIPTION' : 'DEVELOPMENT',
        taxStatus,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      });
    }

    return this.reloadDeal(dealId);
  }

  async startEarlyDelivery(
    dealId: string,
    body: StartEarlyDeliveryBody,
    actor: DealCommercialActor,
  ) {
    const deal = await this.loadCommercialDeal(dealId);
    this.assertDepositCommercialDeal(deal);
    if (deal.status === 'WON' || deal.status === 'FAILED') {
      throw new BadRequestException('Deal is already closed');
    }

    const order = deal.orders[0];
    if (!order) {
      throw new BadRequestException(
        'Create a deposit order and invoice before starting early delivery',
      );
    }
    if (order.deliveryStartMode === 'EXCEPTION_IMMEDIATE') {
      throw new BadRequestException('Exception orders already allow immediate delivery');
    }
    if (order.deliveryStartMode === 'EARLY_START') {
      return this.reloadDeal(dealId);
    }

    const hasInvoice = order.invoices.length > 0;
    if (!hasInvoice) {
      throw new BadRequestException('Deposit invoice is required before early delivery start');
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { deliveryStartMode: 'EARLY_START' },
    });

    const refreshed = await this.reloadDeal(dealId);
    await this.dealWonHandler.ensureDeliveryShell(refreshed);

    if (body.note?.trim() && actor.actorId) {
      await this.auditService.log({
        entityType: 'DEAL',
        entityId: dealId,
        action: 'DEAL_EARLY_DELIVERY_STARTED',
        userId: actor.actorId,
        changes: { note: body.note.trim(), orderId: order.id },
      });
    }

    return this.reloadDeal(dealId);
  }

  async createExceptionOrder(
    dealId: string,
    body: CreateExceptionOrderBody,
    actor: DealCommercialActor,
  ) {
    this.assertPrivilegedActor(actor);
    const reason = body.reason?.trim() ?? '';
    if (reason.length < EXCEPTION_REASON_MIN_LEN) {
      throw new BadRequestException(
        `Exception reason must be at least ${EXCEPTION_REASON_MIN_LEN} characters`,
      );
    }

    const deal = await this.loadCommercialDeal(dealId);
    this.assertDepositCommercialDeal(deal);
    if (deal.status === 'WON' || deal.status === 'FAILED') {
      throw new BadRequestException('Deal is already closed');
    }
    if (deal.orders.length > 0) {
      throw new BadRequestException('Deal already has a commercial order');
    }

    validateDealWonGate(deal, { skipFinance: true });

    const wonMode = mapExceptionTypeToWonMode(body.exceptionType);
    const totalAmount = body.exceptionType === 'FREE' ? 0 : assertDealHasCommercialAmount(deal);

    await createOrderForDeal(this.prisma, {
      deal,
      totalAmount,
      paymentMode: body.exceptionType === 'FREE' ? 'FREE' : 'POSTPAID',
      deliveryStartMode: 'EXCEPTION_IMMEDIATE',
      status: body.exceptionType === 'FREE' ? 'FULLY_PAID' : 'ACTIVE',
    });

    await this.prisma.deal.update({
      where: { id: dealId },
      data: {
        status: 'WON',
        wonMode,
        exceptionReason: reason,
        exceptionApprovedById: actor.actorId,
        exceptionApprovedAt: new Date(),
        exceptionPaymentExpectedAt: body.paymentExpectedAt
          ? new Date(body.paymentExpectedAt)
          : null,
      },
    });

    const wonDeal = await this.reloadDeal(dealId);
    await this.dealWonHandler.handle(wonDeal);

    if (actor.actorId) {
      await this.auditService.log({
        entityType: 'DEAL',
        entityId: dealId,
        action: 'DEAL_EXCEPTION_ORDER',
        userId: actor.actorId,
        changes: {
          exceptionType: body.exceptionType,
          wonMode,
          reason,
          paymentExpectedAt: body.paymentExpectedAt ?? null,
        },
      });
    }

    return wonDeal;
  }

  private assertPrivilegedActor(actor: DealCommercialActor): void {
    if (
      actor.actorRoleLevel === undefined ||
      actor.actorRoleLevel > PRIVILEGED_COMMERCIAL_ROLE_LEVEL
    ) {
      throw new ForbiddenException('Only Owner or CEO can create exception orders');
    }
    if (!actor.actorId) {
      throw new ForbiddenException('Authenticated approver is required');
    }
  }

  private assertDepositCommercialDeal(deal: { type: string | null; status: string }) {
    if (!deal.type || !DEPOSIT_COMMERCIAL_DEAL_TYPES.has(deal.type)) {
      throw new BadRequestException(
        'Commercial handoff applies to PRODUCT, EXTENSION, and OUTSOURCE deals',
      );
    }
  }

  private async loadCommercialDeal(dealId: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      include: dealDetailInclude,
    });
    if (!deal) throw new NotFoundException(`Deal ${dealId} not found`);
    return deal;
  }

  private reloadDeal(dealId: string) {
    return this.loadCommercialDeal(dealId);
  }
}

function mapExceptionTypeToWonMode(type: DealExceptionType): DealWonModeEnum {
  return type === 'FREE' ? 'EXCEPTION_FREE' : 'EXCEPTION_POSTPAID';
}
