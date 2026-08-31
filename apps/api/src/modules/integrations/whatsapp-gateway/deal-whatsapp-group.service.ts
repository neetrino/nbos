import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient, type ProductWhatsAppGroupBindingStatusEnum } from '@nbos/database';
import {
  buildDealWhatsAppCreateDedupeKey,
  buildDealWhatsAppGroupName,
  isWhatsAppGroupChatId,
  normalizeWhatsAppGroupChatId,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import { AuditService } from '../../audit/audit.service';
import { resolveDealProductIdForWhatsApp } from '../../crm/deals/deal-won-whatsapp';
import {
  assertCanCreateDealLevelWhatsAppGroup,
  assertDealLevelWhatsAppType,
} from './deal-whatsapp-group.policy';
import { toDealBindingView, toDealWhatsAppState } from './deal-whatsapp-group-state';
import type { DealWhatsAppState } from './deal-whatsapp-group.types';
import { ProductWhatsAppGroupService } from './product-whatsapp-group.service';
import {
  WHATSAPP_AUDIT_ENTITY_DEAL_GROUP,
  WHATSAPP_AUDIT_GROUP_BOUND,
  WHATSAPP_AUDIT_GROUP_REQUESTED,
  WHATSAPP_ERROR,
} from './whatsapp-gateway.constants';
import {
  isUnreachableWhatsAppGatewayError,
  throwWhatsAppDomainError,
} from './whatsapp-gateway.errors';
import { WhatsAppGatewayClient } from './whatsapp-gateway.client';
import { WhatsAppGatewayConnectionService } from './whatsapp-gateway-connection.service';
import { WhatsAppProductGroupsQueueService } from './whatsapp-product-groups-queue.service';

const DEAL_WHATSAPP_SELECT = {
  id: true,
  code: true,
  name: true,
  type: true,
  contactId: true,
  existingProductId: true,
  status: true,
  contact: { select: { firstName: true, lastName: true } },
  orders: { select: { productId: true }, orderBy: { createdAt: 'desc' as const } },
} as const;

@Injectable()
export class DealWhatsAppGroupService {
  private readonly logger = new Logger(DealWhatsAppGroupService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly productWhatsApp: ProductWhatsAppGroupService,
    private readonly queue: WhatsAppProductGroupsQueueService,
    private readonly connection: WhatsAppGatewayConnectionService,
    private readonly client: WhatsAppGatewayClient,
    private readonly audit: AuditService,
  ) {}

  async getState(dealId: string): Promise<DealWhatsAppState> {
    const deal = await this.requireDeal(dealId);
    const productId = resolveDealProductIdForWhatsApp(deal);
    const dealBinding = await this.prisma.dealWhatsAppGroupBinding.findUnique({
      where: { dealId },
    });
    if (productId) {
      const productState = await this.productWhatsApp.getProductWhatsAppState(productId);
      if (productState.binding) {
        return {
          dealId,
          productId,
          source: 'PRODUCT',
          binding: productState.binding,
          latestOperation: productState.latestOperation,
        };
      }
    }
    return toDealWhatsAppState({
      dealId,
      productId,
      source: 'DEAL',
      binding: dealBinding ? toDealBindingView(dealBinding) : null,
    });
  }

  async ensureForDealAction(dealId: string, actorId: string): Promise<DealWhatsAppState> {
    const deal = await this.requireDeal(dealId);
    const productId = resolveDealProductIdForWhatsApp(deal);
    if (productId) {
      const state = await this.productWhatsApp.ensureGroupForProduct(productId, {
        source: 'DEAL_ACTION',
        contextDealId: dealId,
        actorId,
      });
      return { ...state, dealId, productId, source: 'PRODUCT' };
    }
    assertCanCreateDealLevelWhatsAppGroup({
      dealType: deal.type,
      contactId: deal.contactId,
    });
    return this.ensureGroupForDeal(deal, actorId);
  }

  async bindExistingGroup(
    dealId: string,
    groupChatId: string,
    actorId: string,
    options?: { persistIfUnreachable?: boolean },
  ): Promise<DealWhatsAppState> {
    const deal = await this.requireDeal(dealId);
    assertDealLevelWhatsAppType(deal.type);
    const normalizedId = normalizeWhatsAppGroupChatId(groupChatId);
    if (!isWhatsAppGroupChatId(normalizedId)) {
      throwWhatsAppDomainError(400, WHATSAPP_ERROR.INVALID_GROUP_ID, 'Invalid WhatsApp group id');
    }
    const resolved = await this.resolveBindGroupName(
      normalizedId,
      options?.persistIfUnreachable === true,
    );
    const binding = await this.upsertDealBinding(dealId, {
      groupChatId: normalizedId,
      groupName: resolved.name,
      status: 'ACTIVE',
      lastErrorCode: null,
      lastErrorMessage: null,
      lastSuccessfulSyncAt: resolved.verified ? new Date() : null,
    });
    await this.audit.log({
      entityType: WHATSAPP_AUDIT_ENTITY_DEAL_GROUP,
      entityId: dealId,
      action: WHATSAPP_AUDIT_GROUP_BOUND,
      userId: actorId,
      changes: { groupChatId: normalizedId },
    });
    return toDealWhatsAppState({
      dealId,
      productId: resolveDealProductIdForWhatsApp(deal),
      source: 'DEAL',
      binding: toDealBindingView(binding),
    });
  }

  private async ensureGroupForDeal(
    deal: Awaited<ReturnType<DealWhatsAppGroupService['requireDeal']>>,
    actorId: string,
  ): Promise<DealWhatsAppState> {
    const existing = await this.prisma.dealWhatsAppGroupBinding.findUnique({
      where: { dealId: deal.id },
    });
    if (existing?.status === 'ACTIVE' && existing.groupChatId) {
      return toDealWhatsAppState({
        dealId: deal.id,
        productId: null,
        source: 'DEAL',
        binding: toDealBindingView(existing),
      });
    }
    if (existing?.status === 'OUTCOME_UNKNOWN' || existing?.status === 'NEEDS_RECONCILIATION') {
      return toDealWhatsAppState({
        dealId: deal.id,
        productId: null,
        source: 'DEAL',
        binding: toDealBindingView(existing),
      });
    }
    const contactName = deal.contact
      ? `${deal.contact.firstName} ${deal.contact.lastName}`.trim()
      : null;
    const groupName = buildDealWhatsAppGroupName({
      dealCode: deal.code,
      contactName,
      dealName: deal.name,
    });
    const binding = await this.upsertDealBinding(deal.id, {
      status: 'PENDING',
      groupName,
      lastErrorCode: null,
      lastErrorMessage: null,
    });
    const dedupeKey = buildDealWhatsAppCreateDedupeKey(deal.id);
    const queued = await this.queue.enqueueDealCreate(binding.id, dedupeKey);
    if (!queued) {
      this.logger.warn(`Deal WhatsApp create ${binding.id} left PENDING (queue unavailable)`);
    }
    await this.audit.log({
      entityType: WHATSAPP_AUDIT_ENTITY_DEAL_GROUP,
      entityId: deal.id,
      action: WHATSAPP_AUDIT_GROUP_REQUESTED,
      userId: actorId,
      changes: { bindingId: binding.id },
    });
    return toDealWhatsAppState({
      dealId: deal.id,
      productId: null,
      source: 'DEAL',
      binding: toDealBindingView(binding),
    });
  }

  private async requireDeal(dealId: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      select: DEAL_WHATSAPP_SELECT,
    });
    if (!deal) {
      throw new NotFoundException(`Deal ${dealId} not found`);
    }
    return deal;
  }

  private async upsertDealBinding(
    dealId: string,
    data: {
      groupChatId?: string | null;
      groupName?: string | null;
      status: ProductWhatsAppGroupBindingStatusEnum;
      lastErrorCode: string | null;
      lastErrorMessage: string | null;
      lastSuccessfulSyncAt?: Date | null;
    },
  ) {
    return this.prisma.dealWhatsAppGroupBinding.upsert({
      where: { dealId },
      create: { dealId, ...data },
      update: data,
    });
  }

  private async resolveBindGroupName(
    groupChatId: string,
    persistIfUnreachable: boolean,
  ): Promise<{ name: string | null; verified: boolean }> {
    try {
      const config = await this.connection.requireClientConfig();
      const group = await this.client.getGroup(config, groupChatId);
      return { name: group.name, verified: true };
    } catch (error) {
      if (persistIfUnreachable && isUnreachableWhatsAppGatewayError(error)) {
        return { name: null, verified: false };
      }
      throw error;
    }
  }
}
