import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  PrismaClient,
  type ProductWhatsAppGroupBindingStatusEnum,
  type WhatsAppGroupOperationSourceEnum,
  type WhatsAppGroupOperationTypeEnum,
} from '@nbos/database';
import {
  buildProductWhatsAppClientInviteDedupeKey,
  buildProductWhatsAppCreateDedupeKey,
  buildProductWhatsAppGroupName,
  buildProductWhatsAppParticipantDedupeKey,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import { AuditService } from '../../audit/audit.service';
import { WhatsAppGatewayClient } from './whatsapp-gateway.client';
import { WhatsAppGatewayConnectionService } from './whatsapp-gateway-connection.service';
import {
  WHATSAPP_AUDIT_ENTITY_PRODUCT_GROUP,
  WHATSAPP_AUDIT_GROUP_BOUND,
  WHATSAPP_AUDIT_GROUP_REPLACED,
  WHATSAPP_AUDIT_GROUP_REQUESTED,
  WHATSAPP_AUDIT_MANUAL_RETRY,
  WHATSAPP_ERROR,
} from './whatsapp-gateway.constants';
import {
  isUnreachableWhatsAppGatewayError,
  throwWhatsAppDomainError,
} from './whatsapp-gateway.errors';
import { normalizeWhatsAppGroupChatId } from '@nbos/shared';
import { ProductWhatsAppParticipantResolver } from './product-whatsapp-participant.resolver';
import { WhatsAppProductGroupsQueueService } from './whatsapp-product-groups-queue.service';
import type {
  EnsureProductWhatsAppGroupInput,
  WhatsAppGatewayGroupSummary,
} from './whatsapp-gateway.types';

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
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, projectId: true },
    });
    if (!product) {
      throwWhatsAppDomainError(400, WHATSAPP_ERROR.PRODUCT_GROUP_NOT_FOUND, 'Product not found');
    }

    const binding = await this.prisma.productWhatsAppGroupBinding.findUnique({
      where: { productId },
    });

    if (binding?.status === 'ACTIVE' && binding.groupChatId) {
      return this.getProductWhatsAppState(productId);
    }
    if (binding?.status === 'OUTCOME_UNKNOWN' || binding?.status === 'NEEDS_RECONCILIATION') {
      return this.getProductWhatsAppState(productId);
    }
    if (binding?.status === 'CREATING' || binding?.status === 'PENDING') {
      const activeOp = await this.prisma.whatsAppGroupOperation.findFirst({
        where: {
          productId,
          type: 'CREATE_PRODUCT_GROUP',
          status: { in: ['PENDING', 'QUEUED', 'PROCESSING'] },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (activeOp) {
        // Re-enqueue durable PENDING/QUEUED ops (e.g. after Redis was down).
        // Stale PROCESSING is recovered as FAILED so Retry can run.
        if (activeOp.status === 'PENDING' || activeOp.status === 'QUEUED') {
          await this.enqueueExisting(activeOp.id, activeOp.dedupeKey, false);
        } else if (this.isStaleProcessing(activeOp.startedAt)) {
          await this.prisma.whatsAppGroupOperation.update({
            where: { id: activeOp.id },
            data: {
              status: 'FAILED',
              failedAt: new Date(),
              errorCode: WHATSAPP_ERROR.PRODUCT_GROUP_CREATE_FAILED,
              errorMessage:
                'Create stuck in PROCESSING after Gateway failure; reset for manual retry',
            },
          });
          await this.prisma.productWhatsAppGroupBinding.updateMany({
            where: { productId, status: { in: ['PENDING', 'CREATING'] } },
            data: {
              status: 'FAILED',
              lastErrorCode: WHATSAPP_ERROR.PRODUCT_GROUP_CREATE_FAILED,
              lastErrorMessage:
                'Create stuck in PROCESSING after Gateway failure; reset for manual retry',
            },
          });
        }
        return this.getProductWhatsAppState(productId);
      }
    }

    const dedupeKey = buildProductWhatsAppCreateDedupeKey(productId);
    const existingOp = await this.prisma.whatsAppGroupOperation.findUnique({
      where: { dedupeKey },
    });
    if (
      existingOp &&
      (existingOp.status === 'SUCCEEDED' ||
        existingOp.status === 'QUEUED' ||
        existingOp.status === 'PROCESSING' ||
        existingOp.status === 'PENDING' ||
        existingOp.status === 'OUTCOME_UNKNOWN')
    ) {
      if (existingOp.status === 'PENDING' || existingOp.status === 'QUEUED') {
        await this.enqueueExisting(existingOp.id, dedupeKey, false);
      }
      return this.getProductWhatsAppState(productId);
    }

    if (existingOp?.status === 'FAILED') {
      await this.prisma.whatsAppGroupOperation.update({
        where: { id: existingOp.id },
        data: {
          status: 'PENDING',
          source: input.source as WhatsAppGroupOperationSourceEnum,
          contextDealId: input.contextDealId ?? null,
          requestedById: input.actorId ?? null,
          errorCode: null,
          errorMessage: null,
          failedAt: null,
          completedAt: null,
        },
      });
      await this.enqueueExisting(existingOp.id, dedupeKey, false);
      return this.getProductWhatsAppState(productId);
    }

    const nextBinding =
      binding ??
      (await this.prisma.productWhatsAppGroupBinding.create({
        data: {
          productId,
          status: 'PENDING',
          createdFromDealId: input.contextDealId ?? null,
        },
      }));

    if (nextBinding.status === 'FAILED' || nextBinding.status === 'PENDING') {
      await this.prisma.productWhatsAppGroupBinding.update({
        where: { id: nextBinding.id },
        data: {
          status: 'PENDING',
          lastErrorCode: null,
          lastErrorMessage: null,
          createdFromDealId: input.contextDealId ?? nextBinding.createdFromDealId,
        },
      });
    }

    const operation = await this.prisma.whatsAppGroupOperation.upsert({
      where: { dedupeKey },
      create: {
        productId,
        bindingId: nextBinding.id,
        type: 'CREATE_PRODUCT_GROUP',
        status: 'PENDING',
        dedupeKey,
        source: input.source as WhatsAppGroupOperationSourceEnum,
        contextDealId: input.contextDealId ?? null,
        requestedById: input.actorId ?? null,
        safePayload: { productId },
      },
      update: {
        status: 'PENDING',
        source: input.source as WhatsAppGroupOperationSourceEnum,
        contextDealId: input.contextDealId ?? null,
        requestedById: input.actorId ?? null,
        bindingId: nextBinding.id,
        errorCode: null,
        errorMessage: null,
        failedAt: null,
        completedAt: null,
        safePayload: { productId },
      },
    });

    await this.enqueueExisting(operation.id, dedupeKey, false);

    if (input.actorId) {
      await this.audit.log({
        entityType: WHATSAPP_AUDIT_ENTITY_PRODUCT_GROUP,
        entityId: productId,
        action:
          input.source === 'MANUAL_RETRY'
            ? WHATSAPP_AUDIT_MANUAL_RETRY
            : WHATSAPP_AUDIT_GROUP_REQUESTED,
        userId: input.actorId,
        projectId: product.projectId,
        changes: { source: input.source, operationId: operation.id },
      });
    }

    return this.getProductWhatsAppState(productId);
  }

  async ensureTechnicalSpecialist(productId: string, actorId?: string | null) {
    const binding = await this.prisma.productWhatsAppGroupBinding.findUnique({
      where: { productId },
    });
    const ts = await this.participants.resolveTechnicalSpecialist(productId);
    if (!ts) {
      return this.getProductWhatsAppState(productId);
    }
    if (!binding || binding.status !== 'ACTIVE' || !binding.groupChatId) {
      await this.ensureGroupForProduct(productId, {
        source: 'DEVELOPMENT_TS',
        actorId,
      });
      return this.getProductWhatsAppState(productId);
    }

    const dedupeKey = buildProductWhatsAppParticipantDedupeKey(productId, ts.employeeId);
    const existing = await this.prisma.whatsAppGroupOperation.findUnique({
      where: { dedupeKey },
    });
    if (existing && ['SUCCEEDED', 'QUEUED', 'PROCESSING', 'PENDING'].includes(existing.status)) {
      return this.getProductWhatsAppState(productId);
    }

    const operation = await this.prisma.whatsAppGroupOperation.create({
      data: {
        productId,
        bindingId: binding.id,
        type: 'ADD_PRODUCT_PARTICIPANT',
        status: 'PENDING',
        dedupeKey,
        source: 'DEVELOPMENT_TS',
        requestedById: actorId ?? null,
        safePayload: { employeeId: ts.employeeId, roles: ts.roles },
      },
    });
    await this.enqueueExisting(operation.id, dedupeKey, false);
    return this.getProductWhatsAppState(productId);
  }

  async getProductWhatsAppState(productId: string) {
    const binding = await this.prisma.productWhatsAppGroupBinding.findUnique({
      where: { productId },
    });
    const latestOperation = await this.prisma.whatsAppGroupOperation.findFirst({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
    const participants = binding
      ? await this.prisma.productWhatsAppParticipantSync.findMany({
          where: { bindingId: binding.id },
          select: {
            employeeId: true,
            status: true,
            sourceRoles: true,
            lastErrorCode: true,
          },
        })
      : [];
    const invitation = binding
      ? await this.prisma.productWhatsAppClientInvitation.findFirst({
          where: { bindingId: binding.id },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            contactId: true,
            attemptCount: true,
            sentAt: true,
            lastErrorCode: true,
            lastErrorMessage: true,
          },
        })
      : null;

    return {
      productId,
      binding: binding
        ? {
            id: binding.id,
            groupChatId: binding.groupChatId,
            groupName: binding.groupName,
            status: binding.status,
            lastSuccessfulSyncAt: binding.lastSuccessfulSyncAt?.toISOString() ?? null,
            lastErrorCode: binding.lastErrorCode,
            lastErrorMessage: binding.lastErrorMessage,
          }
        : null,
      participants: participants.map((row) => ({
        employeeId: row.employeeId,
        status: row.status,
        sourceRoles: row.sourceRoles,
        lastErrorCode: row.lastErrorCode,
      })),
      invitation,
      latestOperation: latestOperation
        ? {
            id: latestOperation.id,
            type: latestOperation.type,
            status: latestOperation.status,
            errorCode: latestOperation.errorCode,
            errorMessage: latestOperation.errorMessage,
            createdAt: latestOperation.createdAt.toISOString(),
            completedAt: latestOperation.completedAt?.toISOString() ?? null,
          }
        : null,
    };
  }

  async listAvailableGroups(productId: string, search?: string) {
    const config = await this.connection.requireClientConfig();
    const binding = await this.prisma.productWhatsAppGroupBinding.findUnique({
      where: { productId },
    });
    const gateway = await this.client.listGroups(config, { limit: 200, offset: 0, search });
    const otherBindings = await this.prisma.productWhatsAppGroupBinding.findMany({
      where: {
        groupChatId: { not: null },
        productId: { not: productId },
      },
      select: { groupChatId: true },
    });
    const taken = new Set(
      otherBindings.map((row) => row.groupChatId).filter((id): id is string => Boolean(id)),
    );

    const groups: Array<WhatsAppGatewayGroupSummary & { missingFromGateway?: boolean }> =
      gateway.groups.filter((group) => !taken.has(group.id) || group.id === binding?.groupChatId);

    if (binding?.groupChatId && !groups.some((group) => group.id === binding.groupChatId)) {
      groups.unshift({
        id: binding.groupChatId,
        name: binding.groupName ?? binding.groupChatId,
        participantCount: null,
        pictureUrl: null,
        missingFromGateway: true,
      });
    }

    return { groups, currentGroupChatId: binding?.groupChatId ?? null };
  }

  async bindExistingGroup(
    productId: string,
    groupChatId: string,
    actorId: string,
    options?: { replace?: boolean; persistIfUnreachable?: boolean },
  ) {
    const normalizedId = normalizeWhatsAppGroupChatId(groupChatId);
    if (!normalizedId.endsWith('@g.us')) {
      throwWhatsAppDomainError(400, WHATSAPP_ERROR.INVALID_GROUP_ID, 'Invalid WhatsApp group id');
    }
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, projectId: true, name: true, project: { select: { name: true } } },
    });
    if (!product) {
      throwWhatsAppDomainError(400, WHATSAPP_ERROR.PRODUCT_GROUP_NOT_FOUND, 'Product not found');
    }

    const resolvedGroup = await this.resolveBindGroupFromGateway(
      normalizedId,
      options?.persistIfUnreachable === true,
    );

    const conflict = await this.prisma.productWhatsAppGroupBinding.findFirst({
      where: { groupChatId: normalizedId, productId: { not: productId } },
    });
    if (conflict) {
      throwWhatsAppDomainError(
        409,
        WHATSAPP_ERROR.GROUP_ALREADY_ASSIGNED,
        'WhatsApp group is already assigned to another Product',
      );
    }

    const existing = await this.prisma.productWhatsAppGroupBinding.findUnique({
      where: { productId },
    });
    const replaced = Boolean(existing?.groupChatId && existing.groupChatId !== normalizedId);
    if (replaced && !options?.replace) {
      throwWhatsAppDomainError(
        409,
        WHATSAPP_ERROR.GROUP_ALREADY_ASSIGNED,
        'Product already has a WhatsApp group; confirm replace',
      );
    }

    const binding = existing
      ? await this.prisma.productWhatsAppGroupBinding.update({
          where: { productId },
          data: {
            groupChatId: normalizedId,
            groupName: resolvedGroup.name,
            status: 'ACTIVE' satisfies ProductWhatsAppGroupBindingStatusEnum,
            lastErrorCode: null,
            lastErrorMessage: null,
            lastSuccessfulSyncAt: resolvedGroup.verified ? new Date() : null,
          },
        })
      : await this.prisma.productWhatsAppGroupBinding.create({
          data: {
            productId,
            groupChatId: normalizedId,
            groupName: resolvedGroup.name,
            status: 'ACTIVE',
            lastSuccessfulSyncAt: resolvedGroup.verified ? new Date() : undefined,
          },
        });

    const dedupeKey = `whatsapp-product-group:bind:${productId}:${normalizedId}`;
    const operation = await this.prisma.whatsAppGroupOperation.create({
      data: {
        productId,
        bindingId: binding.id,
        type: 'BIND_EXISTING_GROUP',
        status: 'SUCCEEDED',
        dedupeKey: `${dedupeKey}:${Date.now()}`,
        source: 'MANUAL_BIND',
        requestedById: actorId,
        completedAt: new Date(),
        resultMetadata: { groupChatId: normalizedId, verified: resolvedGroup.verified },
      },
    });

    await this.audit.log({
      entityType: WHATSAPP_AUDIT_ENTITY_PRODUCT_GROUP,
      entityId: productId,
      action: replaced ? WHATSAPP_AUDIT_GROUP_REPLACED : WHATSAPP_AUDIT_GROUP_BOUND,
      userId: actorId,
      projectId: product.projectId,
      changes: { groupChatId: normalizedId, operationId: operation.id, replaced },
    });

    if (resolvedGroup.verified) {
      await this.queueParticipantSync(productId, binding.id, actorId);
    }
    return this.getProductWhatsAppState(productId);
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

  async queueParticipantSync(productId: string, bindingId: string, actorId?: string | null) {
    const dedupeKey = `whatsapp-product-group:sync:${productId}:${Date.now()}`;
    const operation = await this.prisma.whatsAppGroupOperation.create({
      data: {
        productId,
        bindingId,
        type: 'SYNC_PRODUCT_PARTICIPANTS',
        status: 'PENDING',
        dedupeKey,
        source: 'MANUAL_SYNC',
        requestedById: actorId ?? null,
      },
    });
    await this.enqueueExisting(operation.id, dedupeKey, false);
    return operation;
  }

  async queueClientInvitation(
    productId: string,
    actorId: string,
    options?: { forceResend?: boolean },
  ) {
    const binding = await this.prisma.productWhatsAppGroupBinding.findUnique({
      where: { productId },
    });
    if (!binding?.groupChatId || binding.status !== 'ACTIVE') {
      throwWhatsAppDomainError(
        400,
        WHATSAPP_ERROR.PRODUCT_GROUP_NOT_FOUND,
        'Active WhatsApp group binding is required',
      );
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        project: { select: { contactId: true } },
        order: { select: { deal: { select: { contactId: true } } } },
      },
    });
    const contactId = product?.project.contactId ?? product?.order?.deal?.contactId ?? null;
    if (!contactId) {
      throwWhatsAppDomainError(
        400,
        WHATSAPP_ERROR.CLIENT_CONTACT_NOT_FOUND,
        'No primary client contact found for invitation',
      );
    }

    const dedupeKey = buildProductWhatsAppClientInviteDedupeKey(
      productId,
      contactId,
      binding.groupChatId,
    );
    const existing = await this.prisma.productWhatsAppClientInvitation.findUnique({
      where: { dedupeKey },
    });
    if (existing?.status === 'SENT' && !options?.forceResend) {
      return this.getProductWhatsAppState(productId);
    }
    if (existing?.status === 'OUTCOME_UNKNOWN' && !options?.forceResend) {
      throwWhatsAppDomainError(
        409,
        WHATSAPP_ERROR.CLIENT_INVITE_OUTCOME_UNKNOWN,
        'Previous invite outcome is unknown; confirm resend',
      );
    }

    const invitation = existing
      ? await this.prisma.productWhatsAppClientInvitation.update({
          where: { id: existing.id },
          data: {
            status: 'PENDING',
            lastErrorCode: null,
            lastErrorMessage: null,
          },
        })
      : await this.prisma.productWhatsAppClientInvitation.create({
          data: {
            productId,
            bindingId: binding.id,
            contactId,
            status: 'PENDING',
            dedupeKey,
          },
        });

    const opKey = options?.forceResend
      ? `${dedupeKey}:resend:${Date.now()}`
      : `whatsapp-product-group:invite-op:${invitation.id}`;
    const operation = await this.prisma.whatsAppGroupOperation.create({
      data: {
        productId,
        bindingId: binding.id,
        type: 'SEND_CLIENT_INVITE',
        status: 'PENDING',
        dedupeKey: opKey,
        source: 'MANUAL_INVITE',
        requestedById: actorId,
        safePayload: { invitationId: invitation.id, contactId },
      },
    });
    await this.enqueueExisting(operation.id, opKey, false);
    return this.getProductWhatsAppState(productId);
  }

  async listOperations(productId: string) {
    const rows = await this.prisma.whatsAppGroupOperation.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        type: true,
        status: true,
        source: true,
        errorCode: true,
        errorMessage: true,
        attemptCount: true,
        createdAt: true,
        completedAt: true,
        failedAt: true,
      },
    });
    return {
      items: rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
        completedAt: row.completedAt?.toISOString() ?? null,
        failedAt: row.failedAt?.toISOString() ?? null,
      })),
    };
  }

  previewGroupName(projectName: string, productName: string): string {
    return buildProductWhatsAppGroupName(projectName, productName);
  }

  /** PROCESSING longer than this is treated as a stuck worker lock. */
  private static readonly STALE_PROCESSING_MS = 5 * 60 * 1000;

  private isStaleProcessing(startedAt: Date | null | undefined): boolean {
    if (!startedAt) return true;
    return Date.now() - startedAt.getTime() > ProductWhatsAppGroupService.STALE_PROCESSING_MS;
  }

  private async enqueueExisting(operationId: string, dedupeKey: string, resetFailed: boolean) {
    if (resetFailed) {
      await this.prisma.whatsAppGroupOperation.update({
        where: { id: operationId },
        data: { status: 'PENDING', errorCode: null, errorMessage: null, failedAt: null },
      });
    }
    const queued = await this.queue.enqueueOperation(operationId, dedupeKey);
    await this.prisma.whatsAppGroupOperation.update({
      where: { id: operationId },
      data: {
        status: queued ? 'QUEUED' : 'PENDING',
        queuedAt: queued ? new Date() : undefined,
      },
    });
    if (!queued) {
      this.logger.warn(
        `WhatsApp operation ${operationId} left PENDING (queue unavailable); scheduler can recover`,
      );
    }
  }
}

export type { WhatsAppGroupOperationTypeEnum };
