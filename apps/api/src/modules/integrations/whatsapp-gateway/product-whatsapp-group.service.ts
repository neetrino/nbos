import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient, type WhatsAppGroupOperationSourceEnum } from '@nbos/database';
import { buildProductWhatsAppGroupName, normalizeWhatsAppGroupChatId } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import { AuditService } from '../../audit/audit.service';
import { resolveClientDestination } from '../../messenger/core/product-communication-resolver';
import { clearProductFinanceBinding } from '../../messenger/core/product-communication-binding.ops';
import { PRODUCT_COMMUNICATION_PURPOSE_WORK } from '../../messenger/core/product-communication.constants';
import { WhatsAppGatewayClient } from './whatsapp-gateway.client';
import { WhatsAppGatewayConnectionService } from './whatsapp-gateway-connection.service';
import { WHATSAPP_ERROR } from './whatsapp-gateway.constants';
import {
  isUnreachableWhatsAppGatewayError,
  throwWhatsAppDomainError,
} from './whatsapp-gateway.errors';
import { ProductWhatsAppParticipantResolver } from './product-whatsapp-participant.resolver';
import { WhatsAppProductGroupsQueueService } from './whatsapp-product-groups-queue.service';
import { persistBoundDestination } from './product-whatsapp-bind.ops';
import { listSelectableProductGroups } from './product-whatsapp-available-groups.ops';
import { loadProductWhatsAppState } from './product-whatsapp-communication-view.ops';
import { enqueueFinanceGroupCreate } from './product-whatsapp-finance-ensure.ops';
import { ensureWorkGroupForProduct } from './product-whatsapp-ensure-work.ops';
import { runEnsureTechnicalSpecialist } from './product-whatsapp-ensure-ts.ops';
import { queueProductClientInvitation } from './product-whatsapp-invite.ops';
import {
  createParticipantSyncOperation,
  planProductParticipantSync,
} from './product-whatsapp-sync.ops';
import {
  enqueueWhatsAppGroupOperation,
  listProductWhatsAppOperations,
  recordSucceededBindOperation,
} from './product-whatsapp-operation.ops';
import type { EnsureProductWhatsAppGroupInput } from './whatsapp-gateway.types';

@Injectable()
export class ProductWhatsAppGroupService {
  private readonly logger = new Logger(ProductWhatsAppGroupService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly queue: WhatsAppProductGroupsQueueService,
    private readonly connection: WhatsAppGatewayConnectionService,
    private readonly client: WhatsAppGatewayClient,
    private readonly participants: ProductWhatsAppParticipantResolver,
    private readonly audit: AuditService,
  ) {}

  async ensureGroupForProduct(productId: string, input: EnsureProductWhatsAppGroupInput) {
    if (input.purpose === 'FINANCE') {
      await enqueueFinanceGroupCreate(this.prisma, this.queue, {
        productId,
        source: input.source as WhatsAppGroupOperationSourceEnum,
        contextDealId: input.contextDealId,
        actorId: input.actorId,
      });
      return this.getProductWhatsAppState(productId);
    }
    await ensureWorkGroupForProduct(
      this.prisma,
      this.bindEnqueue(),
      (entry) => this.audit.log(entry),
      productId,
      input,
    );
    return this.getProductWhatsAppState(productId);
  }

  async ensureTechnicalSpecialist(productId: string, actorId?: string | null) {
    await runEnsureTechnicalSpecialist(
      this.prisma,
      this.bindEnqueue(),
      async () => {
        await ensureWorkGroupForProduct(
          this.prisma,
          this.bindEnqueue(),
          (entry) => this.audit.log(entry),
          productId,
          { source: 'DEVELOPMENT_TS', actorId },
        );
      },
      () => this.participants.resolveTechnicalSpecialist(productId),
      productId,
      actorId,
    );
    return this.getProductWhatsAppState(productId);
  }

  async getProductWhatsAppState(productId: string) {
    return loadProductWhatsAppState(this.prisma, productId);
  }

  async listAvailableGroups(
    productId: string,
    search?: string,
    purpose: 'WORK' | 'FINANCE' = 'WORK',
  ) {
    const config = await this.connection.requireClientConfig();
    const destination = await resolveClientDestination(this.prisma, productId, purpose);
    const binding = await this.prisma.productWhatsAppGroupBinding.findUnique({
      where: { productId },
    });
    const gateway = await this.client.listGroups(config, { limit: 200, offset: 0, search });
    const currentGroupChatId =
      destination && (purpose === 'WORK' || !destination.fallbackFromWork)
        ? destination.groupChatId
        : null;
    return listSelectableProductGroups(this.prisma, {
      productId,
      gatewayGroups: gateway.groups,
      currentGroupChatId,
      currentGroupName: binding?.groupName ?? null,
    });
  }

  async bindExistingGroup(
    productId: string,
    groupChatId: string,
    actorId: string,
    options?: {
      replace?: boolean;
      persistIfUnreachable?: boolean;
      purpose?: 'WORK' | 'FINANCE';
    },
  ) {
    const purpose = options?.purpose ?? PRODUCT_COMMUNICATION_PURPOSE_WORK;
    const normalizedId = normalizeWhatsAppGroupChatId(groupChatId);
    if (!normalizedId.endsWith('@g.us')) {
      throwWhatsAppDomainError(400, WHATSAPP_ERROR.INVALID_GROUP_ID, 'Invalid WhatsApp group id');
    }
    const product = await this.requireProduct(productId);
    const resolvedGroup = await this.resolveBindGroupFromGateway(
      normalizedId,
      options?.persistIfUnreachable === true,
    );
    const replaced = await this.assertPurposeReplaceAllowed(
      productId,
      purpose,
      normalizedId,
      options?.replace === true,
    );
    const persisted = await persistBoundDestination(this.prisma, {
      productId,
      purpose,
      groupChatId: normalizedId,
      groupName: resolvedGroup.name,
      replace: true,
      createdFromDealId: null,
    });
    await this.afterBindPersisted(
      productId,
      actorId,
      purpose,
      normalizedId,
      resolvedGroup.verified,
      replaced,
      product.projectId,
      persisted,
    );
    return this.getProductWhatsAppState(productId);
  }

  async useWorkForFinance(productId: string) {
    await clearProductFinanceBinding(this.prisma, productId);
    return this.getProductWhatsAppState(productId);
  }

  async syncParticipants(productId: string, actorId?: string | null) {
    const plan = await planProductParticipantSync(this.prisma, productId);
    if (plan.result === 'noop_shared') return this.getProductWhatsAppState(productId);
    if (plan.result === 'needs_ensure' || !plan.bindingId) {
      return this.ensureGroupForProduct(productId, { source: 'MANUAL_SYNC', actorId });
    }
    await createParticipantSyncOperation(
      this.prisma,
      this.bindEnqueue(),
      productId,
      plan.bindingId,
      actorId,
    );
    return this.getProductWhatsAppState(productId);
  }

  async queueParticipantSync(productId: string, bindingId: string, actorId?: string | null) {
    await createParticipantSyncOperation(
      this.prisma,
      this.bindEnqueue(),
      productId,
      bindingId,
      actorId,
    );
  }

  async queueClientInvitation(
    productId: string,
    actorId: string,
    options?: { forceResend?: boolean },
  ) {
    await queueProductClientInvitation(
      this.prisma,
      this.bindEnqueue(),
      productId,
      actorId,
      options,
    );
    return this.getProductWhatsAppState(productId);
  }

  async listOperations(productId: string) {
    return listProductWhatsAppOperations(this.prisma, productId);
  }

  previewGroupName(projectName: string, productName: string): string {
    return buildProductWhatsAppGroupName(projectName, productName);
  }
  private bindEnqueue() {
    return (operationId: string, dedupeKey: string, resetFailed: boolean) =>
      enqueueWhatsAppGroupOperation(
        this.prisma,
        this.queue,
        (message) => this.logger.warn(message),
        operationId,
        dedupeKey,
        resetFailed,
      );
  }

  private async requireProduct(productId: string): Promise<{ id: string; projectId: string }> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, projectId: true },
    });
    if (!product) {
      throwWhatsAppDomainError(400, WHATSAPP_ERROR.PRODUCT_GROUP_NOT_FOUND, 'Product not found');
    }
    return product;
  }

  private async assertPurposeReplaceAllowed(
    productId: string,
    purpose: 'WORK' | 'FINANCE',
    groupChatId: string,
    replace: boolean,
  ): Promise<boolean> {
    const current = await resolveClientDestination(this.prisma, productId, purpose);
    const explicit = current && (purpose === 'WORK' || !current.fallbackFromWork);
    const replaced = Boolean(explicit && current.groupChatId !== groupChatId);
    if (replaced && !replace) {
      throwWhatsAppDomainError(
        409,
        WHATSAPP_ERROR.GROUP_ALREADY_ASSIGNED,
        'Product already has a destination for this purpose; confirm replace',
      );
    }
    return replaced;
  }

  private async resolveBindGroupFromGateway(
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

  private async afterBindPersisted(
    productId: string,
    actorId: string,
    purpose: 'WORK' | 'FINANCE',
    groupChatId: string,
    verified: boolean,
    replaced: boolean,
    projectId: string,
    persisted: { mappingAlreadyExisted: boolean; legacyBindingId: string | null },
  ): Promise<void> {
    await recordSucceededBindOperation(
      this.prisma,
      (entry) => this.audit.log(entry),
      productId,
      persisted.legacyBindingId,
      actorId,
      { groupChatId, verified, purpose, replaced, projectId },
    );
    if (purpose !== 'WORK' || !verified || persisted.mappingAlreadyExisted) return;
    if (!persisted.legacyBindingId) return;
    await this.queueParticipantSync(productId, persisted.legacyBindingId, actorId);
  }
}
