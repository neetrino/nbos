import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import {
  buildDealWhatsAppCreateDedupeKey,
  buildDealWhatsAppGroupName,
  normalizePhoneToWhatsAppJid,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import { AuditService } from '../../audit/audit.service';
import { resolveDealProductIdForWhatsApp } from '../../crm/deals/deal-won-whatsapp';
import {
  WHATSAPP_AUDIT_ENTITY_DEAL_GROUP,
  WHATSAPP_AUDIT_GROUP_CREATED,
  WHATSAPP_AUDIT_GROUP_FAILED,
  WHATSAPP_AUDIT_GROUP_OUTCOME_UNKNOWN,
  WHATSAPP_ERROR,
} from './whatsapp-gateway.constants';
import { isUnknownCreateOutcome, WhatsAppGatewayHttpError } from './whatsapp-gateway.errors';
import { WhatsAppGatewayClient } from './whatsapp-gateway.client';
import { WhatsAppGatewayConnectionService } from './whatsapp-gateway-connection.service';
import { WhatsAppOutboundQueueService } from './whatsapp-outbound-queue.service';
import { ProductWhatsAppGroupService } from './product-whatsapp-group.service';
import { ProductWhatsAppParticipantResolver } from './product-whatsapp-participant.resolver';
import {
  buildWhatsAppClientInviteMessage,
  extractContactLanguage,
} from './whatsapp-client-invite-message.builder';

const STALE_CREATING_MS = 5 * 60 * 1000;

@Injectable()
export class DealWhatsAppGroupCreateHandler {
  private readonly logger = new Logger(DealWhatsAppGroupCreateHandler.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly connection: WhatsAppGatewayConnectionService,
    private readonly client: WhatsAppGatewayClient,
    private readonly participants: ProductWhatsAppParticipantResolver,
    private readonly outbound: WhatsAppOutboundQueueService,
    private readonly productWhatsApp: ProductWhatsAppGroupService,
    private readonly audit: AuditService,
  ) {}

  async process(bindingId: string): Promise<void> {
    const binding = await this.prisma.dealWhatsAppGroupBinding.findUnique({
      where: { id: bindingId },
    });
    if (!binding) return;
    if (binding.status === 'ACTIVE' && binding.groupChatId) {
      await this.handoffToProductIfReady(binding.dealId, binding.groupChatId);
      return;
    }
    if (binding.status === 'OUTCOME_UNKNOWN' || binding.status === 'NEEDS_RECONCILIATION') {
      return;
    }
    if (!this.canClaim(binding)) return;

    const claimed = await this.prisma.dealWhatsAppGroupBinding.updateMany({
      where: { id: bindingId, status: { in: ['PENDING', 'FAILED', 'CREATING'] } },
      data: { status: 'CREATING', lastErrorCode: null, lastErrorMessage: null },
    });
    if (claimed.count === 0) return;

    try {
      await this.createGroup(binding.dealId, bindingId);
    } catch (error) {
      if (error instanceof WhatsAppGatewayHttpError && isUnknownCreateOutcome(error.code)) {
        await this.markBinding(bindingId, 'OUTCOME_UNKNOWN', error.code, error.message);
        await this.audit.log({
          entityType: WHATSAPP_AUDIT_ENTITY_DEAL_GROUP,
          entityId: binding.dealId,
          action: WHATSAPP_AUDIT_GROUP_OUTCOME_UNKNOWN,
          changes: { code: error.code },
        });
        return;
      }
      throw error;
    }
  }

  async markExhausted(bindingId: string, error: Error): Promise<void> {
    await this.markBinding(
      bindingId,
      'FAILED',
      WHATSAPP_ERROR.PRODUCT_GROUP_CREATE_FAILED,
      error.message,
    );
  }

  private canClaim(binding: { status: string; updatedAt: Date }): boolean {
    if (binding.status === 'PENDING' || binding.status === 'FAILED') return true;
    if (binding.status !== 'CREATING') return false;
    return Date.now() - binding.updatedAt.getTime() > STALE_CREATING_MS;
  }

  private async createGroup(dealId: string, bindingId: string): Promise<void> {
    const deal = await this.prisma.deal.findUniqueOrThrow({
      where: { id: dealId },
      select: {
        id: true,
        code: true,
        name: true,
        contactId: true,
        contact: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            messengerLinks: true,
          },
        },
      },
    });
    const resolved = await this.participants.resolveForDeal(deal.id);
    if (resolved.candidates.length === 0) {
      await this.failNoParticipants(dealId, bindingId);
      return;
    }
    const contactName = deal.contact
      ? `${deal.contact.firstName} ${deal.contact.lastName}`.trim()
      : null;
    const groupName = buildDealWhatsAppGroupName({
      dealCode: deal.code,
      contactName,
      dealName: deal.name,
    });
    const config = await this.connection.requireClientConfig();
    const created = await this.client.createGroup(
      config,
      { name: groupName, participants: resolved.candidates.map((row) => row.jid) },
      buildDealWhatsAppCreateDedupeKey(deal.id),
    );
    await this.prisma.dealWhatsAppGroupBinding.update({
      where: { id: bindingId },
      data: {
        groupChatId: created.id,
        groupName: created.name ?? groupName,
        status: 'ACTIVE',
        lastSuccessfulSyncAt: new Date(),
        lastErrorCode: null,
        lastErrorMessage: null,
      },
    });
    await this.audit.log({
      entityType: WHATSAPP_AUDIT_ENTITY_DEAL_GROUP,
      entityId: deal.id,
      action: WHATSAPP_AUDIT_GROUP_CREATED,
      changes: { groupChatId: created.id },
    });
    await this.inviteClient(deal, created.id);
    await this.handoffToProductIfReady(deal.id, created.id);
  }

  private async failNoParticipants(dealId: string, bindingId: string): Promise<void> {
    await this.markBinding(
      bindingId,
      'FAILED',
      WHATSAPP_ERROR.NO_VALID_INTERNAL_PARTICIPANTS,
      'No valid internal participants with WhatsApp phones',
    );
    await this.audit.log({
      entityType: WHATSAPP_AUDIT_ENTITY_DEAL_GROUP,
      entityId: dealId,
      action: WHATSAPP_AUDIT_GROUP_FAILED,
      changes: { code: WHATSAPP_ERROR.NO_VALID_INTERNAL_PARTICIPANTS },
    });
  }

  private async inviteClient(
    deal: {
      id: string;
      name: string | null;
      contact: {
        firstName: string;
        lastName: string;
        phone: string | null;
        messengerLinks: unknown;
      } | null;
    },
    groupChatId: string,
  ): Promise<void> {
    if (!deal.contact) return;
    const phone = normalizePhoneToWhatsAppJid(deal.contact.phone);
    if (!phone.success) return;
    try {
      const config = await this.connection.requireClientConfig();
      const invite = await this.client.getInviteLink(config, groupChatId);
      const message = buildWhatsAppClientInviteMessage({
        clientName: `${deal.contact.firstName} ${deal.contact.lastName}`.trim(),
        productName: deal.name ?? deal.id,
        inviteUrl: invite.inviteUrl,
        locale: extractContactLanguage(deal.contact.messengerLinks),
      });
      await this.outbound.enqueue(
        {
          kind: 'client_invite',
          chatId: phone.jid,
          text: message.text,
          idempotencyKey: `deal_client_invite:${deal.id}:${groupChatId}`,
        },
        true,
      );
    } catch (error) {
      this.logger.warn(
        `Deal ${deal.id} WhatsApp invite failed after group create: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async handoffToProductIfReady(dealId: string, groupChatId: string): Promise<void> {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      select: {
        id: true,
        status: true,
        existingProductId: true,
        orders: { select: { productId: true } },
      },
    });
    if (!deal || deal.status !== 'WON') return;
    const productId = resolveDealProductIdForWhatsApp(deal);
    if (!productId) return;
    const productBinding = await this.prisma.productWhatsAppGroupBinding.findUnique({
      where: { productId },
      select: { groupChatId: true, status: true },
    });
    if (productBinding?.status === 'ACTIVE' && productBinding.groupChatId) return;
    try {
      await this.productWhatsApp.bindExistingGroup(productId, groupChatId, dealId, {
        persistIfUnreachable: true,
      });
    } catch (error) {
      this.logger.warn(
        `Deal ${dealId} group handoff to product ${productId} failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async markBinding(
    bindingId: string,
    status: 'FAILED' | 'OUTCOME_UNKNOWN',
    code: string,
    message: string,
  ): Promise<void> {
    await this.prisma.dealWhatsAppGroupBinding.updateMany({
      where: { id: bindingId },
      data: { status, lastErrorCode: code, lastErrorMessage: message },
    });
  }
}
