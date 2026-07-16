import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker, type Job } from 'bullmq';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import {
  buildProductWhatsAppClientInviteDedupeKey,
  buildProductWhatsAppCreateDedupeKey,
  buildProductWhatsAppGroupName,
  buildProductWhatsAppParticipantDedupeKey,
  normalizePhoneToWhatsAppJid,
} from '@nbos/shared';
import { createRedisConnection, getRedisUrl } from '../../../common/redis/redis-connection';
import { PRISMA_TOKEN } from '../../../database.module';
import { AuditService } from '../../audit/audit.service';
import { WhatsAppGatewayClient } from './whatsapp-gateway.client';
import { WhatsAppGatewayConnectionService } from './whatsapp-gateway-connection.service';
import {
  WHATSAPP_AUDIT_ENTITY_PRODUCT_GROUP,
  WHATSAPP_AUDIT_GROUP_CREATED,
  WHATSAPP_AUDIT_GROUP_FAILED,
  WHATSAPP_AUDIT_GROUP_OUTCOME_UNKNOWN,
  WHATSAPP_AUDIT_INVITE_FAILED,
  WHATSAPP_AUDIT_INVITE_SENT,
  WHATSAPP_AUDIT_PARTICIPANT_ADDED,
  WHATSAPP_AUDIT_PARTICIPANT_FAILED,
  WHATSAPP_AUDIT_PARTICIPANT_SKIPPED,
  WHATSAPP_ERROR,
  WHATSAPP_PRODUCT_GROUP_JOB_NAME,
  WHATSAPP_PRODUCT_GROUPS_QUEUE_NAME,
} from './whatsapp-gateway.constants';
import {
  isRetryableGatewayError,
  isUnknownCreateOutcome,
  WhatsAppGatewayHttpError,
} from './whatsapp-gateway.errors';
import { ProductWhatsAppParticipantResolver } from './product-whatsapp-participant.resolver';
import {
  buildWhatsAppClientInviteMessage,
  extractContactLanguage,
} from './whatsapp-client-invite-message.builder';
import type { WhatsAppProductGroupJobPayload } from './whatsapp-product-groups-queue.service';
import { WhatsAppProductGroupsQueueService } from './whatsapp-product-groups-queue.service';

@Injectable()
export class WhatsAppProductGroupsWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsAppProductGroupsWorker.name);
  private worker: Worker<WhatsAppProductGroupJobPayload> | null = null;
  private connection: ReturnType<typeof createRedisConnection> | null = null;

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly connectionService: WhatsAppGatewayConnectionService,
    private readonly client: WhatsAppGatewayClient,
    private readonly participants: ProductWhatsAppParticipantResolver,
    private readonly audit: AuditService,
    private readonly queue: WhatsAppProductGroupsQueueService,
  ) {}

  onModuleInit() {
    const redisUrl = getRedisUrl();
    if (!redisUrl) {
      this.logger.warn('REDIS_URL unset — WhatsApp product group worker disabled');
      return;
    }
    this.connection = createRedisConnection(redisUrl);
    this.worker = new Worker<WhatsAppProductGroupJobPayload>(
      WHATSAPP_PRODUCT_GROUPS_QUEUE_NAME,
      async (job) => this.process(job),
      { connection: this.connection },
    );
    this.worker.on('failed', (job, error) => {
      this.logger.error(`WhatsApp job failed operationId=${job?.data.operationId}`, error);
      void this.onJobExhausted(job, error);
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.connection?.quit();
  }

  async process(job: Job<WhatsAppProductGroupJobPayload>): Promise<void> {
    const operation = await this.prisma.whatsAppGroupOperation.findUnique({
      where: { id: job.data.operationId },
    });
    if (!operation) return;
    if (['SUCCEEDED', 'SKIPPED', 'OUTCOME_UNKNOWN'].includes(operation.status)) {
      return;
    }

    const locked = await this.prisma.whatsAppGroupOperation.updateMany({
      where: {
        id: operation.id,
        status: { in: ['PENDING', 'QUEUED', 'FAILED'] },
      },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
        attemptCount: { increment: 1 },
      },
    });
    if (locked.count === 0) return;

    try {
      switch (operation.type) {
        case 'CREATE_PRODUCT_GROUP':
          await this.handleCreate(operation.id);
          break;
        case 'SYNC_PRODUCT_PARTICIPANTS':
        case 'ADD_PRODUCT_PARTICIPANT':
          await this.handleParticipants(operation.id);
          break;
        case 'SEND_CLIENT_INVITE':
          await this.handleInvite(operation.id);
          break;
        case 'BIND_EXISTING_GROUP':
          await this.markSucceeded(operation.id, {});
          break;
        default:
          await this.markFailed(
            operation.id,
            'UNSUPPORTED_OPERATION',
            'Unsupported operation type',
          );
      }
    } catch (error) {
      if (error instanceof WhatsAppGatewayHttpError && isUnknownCreateOutcome(error.code)) {
        await this.markOutcomeUnknown(operation.id, error.code, error.message);
        return;
      }
      if (error instanceof WhatsAppGatewayHttpError && isRetryableGatewayError(error.code)) {
        await this.releaseProcessingForRetry(operation.id, error);
        throw error;
      }
      if (error instanceof WhatsAppGatewayHttpError) {
        await this.markFailed(operation.id, error.code, error.message);
        return;
      }
      // Unknown/transient (network after client wrap should already be WhatsAppGatewayHttpError).
      await this.releaseProcessingForRetry(operation.id, error);
      throw error;
    }
  }

  private async handleCreate(operationId: string) {
    const operation = await this.prisma.whatsAppGroupOperation.findUniqueOrThrow({
      where: { id: operationId },
    });
    const product = await this.prisma.product.findUniqueOrThrow({
      where: { id: operation.productId },
      select: {
        id: true,
        name: true,
        projectId: true,
        project: { select: { name: true, contactId: true } },
      },
    });

    const resolved = await this.participants.resolve(product.id, operation.contextDealId);
    if (resolved.candidates.length === 0) {
      await this.prisma.productWhatsAppGroupBinding.updateMany({
        where: { productId: product.id },
        data: {
          status: 'FAILED',
          lastErrorCode: WHATSAPP_ERROR.NO_VALID_INTERNAL_PARTICIPANTS,
          lastErrorMessage: 'No valid internal participants with WhatsApp phones',
        },
      });
      await this.markFailed(
        operationId,
        WHATSAPP_ERROR.NO_VALID_INTERNAL_PARTICIPANTS,
        'No valid internal participants with WhatsApp phones',
      );
      return;
    }

    let binding = await this.prisma.productWhatsAppGroupBinding.findUnique({
      where: { productId: product.id },
    });
    if (!binding) {
      binding = await this.prisma.productWhatsAppGroupBinding.create({
        data: {
          productId: product.id,
          status: 'CREATING',
          createdFromDealId: operation.contextDealId,
        },
      });
    } else {
      binding = await this.prisma.productWhatsAppGroupBinding.update({
        where: { id: binding.id },
        data: { status: 'CREATING', lastErrorCode: null, lastErrorMessage: null },
      });
    }

    for (const candidate of resolved.candidates) {
      await this.prisma.productWhatsAppParticipantSync.upsert({
        where: {
          bindingId_employeeId: {
            bindingId: binding.id,
            employeeId: candidate.employeeId,
          },
        },
        create: {
          productId: product.id,
          bindingId: binding.id,
          employeeId: candidate.employeeId,
          sourceRoles: candidate.roles,
          status: 'PENDING',
        },
        update: {
          sourceRoles: candidate.roles,
          status: 'PENDING',
        },
      });
    }
    for (const warning of resolved.warnings) {
      if (!warning.employeeId) continue;
      if (warning.code !== 'PHONE_MISSING' && warning.code !== 'PHONE_INVALID') continue;
      await this.prisma.productWhatsAppParticipantSync.upsert({
        where: {
          bindingId_employeeId: {
            bindingId: binding.id,
            employeeId: warning.employeeId,
          },
        },
        create: {
          productId: product.id,
          bindingId: binding.id,
          employeeId: warning.employeeId,
          sourceRoles: [warning.role],
          status: warning.code === 'PHONE_MISSING' ? 'SKIPPED_NO_PHONE' : 'SKIPPED_INVALID_PHONE',
          lastErrorCode: warning.code,
          lastErrorMessage: warning.message,
          lastAttemptAt: new Date(),
        },
        update: {
          status: warning.code === 'PHONE_MISSING' ? 'SKIPPED_NO_PHONE' : 'SKIPPED_INVALID_PHONE',
          lastErrorCode: warning.code,
          lastErrorMessage: warning.message,
          lastAttemptAt: new Date(),
        },
      });
      await this.audit.log({
        entityType: WHATSAPP_AUDIT_ENTITY_PRODUCT_GROUP,
        entityId: product.id,
        action: WHATSAPP_AUDIT_PARTICIPANT_SKIPPED,
        userId: operation.requestedById ?? product.id,
        projectId: product.projectId,
        changes: { employeeId: warning.employeeId, code: warning.code },
      });
    }

    const groupName = buildProductWhatsAppGroupName(product.project.name, product.name);
    const config = await this.connectionService.requireClientConfig();
    const idempotencyKey = buildProductWhatsAppCreateDedupeKey(product.id);

    let created;
    try {
      created = await this.client.createGroup(
        config,
        {
          name: groupName,
          participants: resolved.candidates.map((c) => c.jid),
        },
        idempotencyKey,
      );
    } catch (error) {
      if (error instanceof WhatsAppGatewayHttpError && isUnknownCreateOutcome(error.code)) {
        await this.prisma.productWhatsAppGroupBinding.update({
          where: { id: binding.id },
          data: {
            status: 'OUTCOME_UNKNOWN',
            lastErrorCode: WHATSAPP_ERROR.PRODUCT_GROUP_OUTCOME_UNKNOWN,
            lastErrorMessage: error.message,
          },
        });
        await this.markOutcomeUnknown(operationId, error.code, error.message);
        await this.audit.log({
          entityType: WHATSAPP_AUDIT_ENTITY_PRODUCT_GROUP,
          entityId: product.id,
          action: WHATSAPP_AUDIT_GROUP_OUTCOME_UNKNOWN,
          userId: operation.requestedById ?? product.id,
          projectId: product.projectId,
          changes: { code: error.code },
        });
        return;
      }
      throw error;
    }

    binding = await this.prisma.productWhatsAppGroupBinding.update({
      where: { id: binding.id },
      data: {
        groupChatId: created.id,
        groupName: created.name,
        status: 'ACTIVE',
        lastSuccessfulSyncAt: new Date(),
        lastErrorCode: null,
        lastErrorMessage: null,
      },
    });

    for (const candidate of resolved.candidates) {
      await this.prisma.productWhatsAppParticipantSync.update({
        where: {
          bindingId_employeeId: {
            bindingId: binding.id,
            employeeId: candidate.employeeId,
          },
        },
        data: {
          status: 'ADDED',
          addedAt: new Date(),
          lastAttemptAt: new Date(),
        },
      });
    }

    await this.markSucceeded(operationId, {
      groupChatId: created.id,
      participantCount: resolved.candidates.length,
      warningCount: resolved.warnings.length,
    });

    await this.audit.log({
      entityType: WHATSAPP_AUDIT_ENTITY_PRODUCT_GROUP,
      entityId: product.id,
      action: WHATSAPP_AUDIT_GROUP_CREATED,
      userId: operation.requestedById ?? product.id,
      projectId: product.projectId,
      changes: {
        groupChatId: created.id,
        participantCount: resolved.candidates.length,
      },
    });

    await this.enqueueClientInviteAfterCreate(product.id, binding.id, operation.contextDealId);
  }

  private async handleParticipants(operationId: string) {
    const operation = await this.prisma.whatsAppGroupOperation.findUniqueOrThrow({
      where: { id: operationId },
    });
    const binding = await this.prisma.productWhatsAppGroupBinding.findUnique({
      where: { productId: operation.productId },
    });
    if (!binding?.groupChatId || binding.status !== 'ACTIVE') {
      await this.markFailed(
        operationId,
        WHATSAPP_ERROR.PRODUCT_GROUP_NOT_FOUND,
        'Active group binding required for participant sync',
      );
      return;
    }

    const payload = (operation.safePayload ?? {}) as { employeeId?: string };
    const candidates =
      operation.type === 'ADD_PRODUCT_PARTICIPANT' && payload.employeeId
        ? [await this.participants.resolveTechnicalSpecialist(operation.productId)].filter(
            (row): row is NonNullable<typeof row> => row != null,
          )
        : (await this.participants.resolve(operation.productId, operation.contextDealId))
            .candidates;

    if (candidates.length === 0) {
      await this.markSucceeded(operationId, { added: 0 });
      return;
    }

    const config = await this.connectionService.requireClientConfig();
    const jids = candidates.map((c) => c.jid);
    const idempotencyKey =
      operation.type === 'ADD_PRODUCT_PARTICIPANT' && payload.employeeId
        ? buildProductWhatsAppParticipantDedupeKey(operation.productId, payload.employeeId)
        : operation.dedupeKey;

    const result = await this.client.addParticipants(
      config,
      binding.groupChatId,
      jids,
      idempotencyKey,
    );

    for (const candidate of candidates) {
      const already = result.alreadyMembers.includes(candidate.jid);
      const added = result.added.includes(candidate.jid);
      const failed = result.failed.some((row) => row.id === candidate.jid);
      await this.prisma.productWhatsAppParticipantSync.upsert({
        where: {
          bindingId_employeeId: {
            bindingId: binding.id,
            employeeId: candidate.employeeId,
          },
        },
        create: {
          productId: operation.productId,
          bindingId: binding.id,
          employeeId: candidate.employeeId,
          sourceRoles: candidate.roles,
          status: failed ? 'FAILED' : already ? 'ALREADY_MEMBER' : 'ADDED',
          addedAt: added || already ? new Date() : null,
          lastAttemptAt: new Date(),
          lastErrorCode: failed ? WHATSAPP_ERROR.PARTICIPANT_SYNC_FAILED : null,
        },
        update: {
          sourceRoles: candidate.roles,
          status: failed ? 'FAILED' : already ? 'ALREADY_MEMBER' : 'ADDED',
          addedAt: added || already ? new Date() : undefined,
          lastAttemptAt: new Date(),
          lastErrorCode: failed ? WHATSAPP_ERROR.PARTICIPANT_SYNC_FAILED : null,
        },
      });
      await this.audit.log({
        entityType: WHATSAPP_AUDIT_ENTITY_PRODUCT_GROUP,
        entityId: operation.productId,
        action: failed ? WHATSAPP_AUDIT_PARTICIPANT_FAILED : WHATSAPP_AUDIT_PARTICIPANT_ADDED,
        userId: operation.requestedById ?? operation.productId,
        changes: { employeeId: candidate.employeeId, already },
      });
    }

    await this.prisma.productWhatsAppGroupBinding.update({
      where: { id: binding.id },
      data: { lastSuccessfulSyncAt: new Date() },
    });
    await this.markSucceeded(operationId, {
      added: result.added.length,
      alreadyMembers: result.alreadyMembers.length,
      failed: result.failed.length,
    });
  }

  private async handleInvite(operationId: string) {
    const operation = await this.prisma.whatsAppGroupOperation.findUniqueOrThrow({
      where: { id: operationId },
    });
    const payload = (operation.safePayload ?? {}) as {
      invitationId?: string;
      contactId?: string;
    };
    const binding = await this.prisma.productWhatsAppGroupBinding.findUnique({
      where: { productId: operation.productId },
    });
    if (!binding?.groupChatId || binding.status !== 'ACTIVE') {
      await this.markFailed(
        operationId,
        WHATSAPP_ERROR.PRODUCT_GROUP_NOT_FOUND,
        'Active group required for client invite',
      );
      return;
    }

    const product = await this.prisma.product.findUniqueOrThrow({
      where: { id: operation.productId },
      select: {
        id: true,
        name: true,
        projectId: true,
        project: {
          select: {
            contactId: true,
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                messengerLinks: true,
              },
            },
          },
        },
        order: {
          select: {
            deal: {
              select: {
                contactId: true,
                contact: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    messengerLinks: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const contact = product.project.contact ?? product.order?.deal?.contact ?? null;
    if (!contact) {
      const invitation = payload.invitationId
        ? await this.prisma.productWhatsAppClientInvitation.update({
            where: { id: payload.invitationId },
            data: { status: 'SKIPPED_NO_CONTACT', lastAttemptAt: new Date() },
          })
        : null;
      await this.markSucceeded(operationId, {
        invitationId: invitation?.id ?? null,
        skipped: 'NO_CONTACT',
      });
      return;
    }

    const phone = normalizePhoneToWhatsAppJid(contact.phone);
    if (!phone.success) {
      const dedupeKey = buildProductWhatsAppClientInviteDedupeKey(
        product.id,
        contact.id,
        binding.groupChatId,
      );
      await this.prisma.productWhatsAppClientInvitation.upsert({
        where: { dedupeKey },
        create: {
          productId: product.id,
          bindingId: binding.id,
          contactId: contact.id,
          dedupeKey,
          status: 'SKIPPED_NO_PHONE',
          lastAttemptAt: new Date(),
          lastErrorCode: phone.reason,
        },
        update: {
          status: 'SKIPPED_NO_PHONE',
          lastAttemptAt: new Date(),
          lastErrorCode: phone.reason,
        },
      });
      await this.markSucceeded(operationId, { skipped: phone.reason });
      return;
    }

    const config = await this.connectionService.requireClientConfig();
    let inviteUrl: string;
    try {
      const invite = await this.client.getInviteLink(config, binding.groupChatId);
      inviteUrl = invite.inviteUrl;
    } catch (error) {
      const code =
        error instanceof WhatsAppGatewayHttpError
          ? error.code
          : WHATSAPP_ERROR.CLIENT_INVITE_FAILED;
      const message = error instanceof Error ? error.message : 'Invite link failed';
      await this.markFailed(operationId, code, message);
      return;
    }

    const message = buildWhatsAppClientInviteMessage({
      clientName: `${contact.firstName} ${contact.lastName}`.trim(),
      productName: product.name,
      inviteUrl,
      locale: extractContactLanguage(contact.messengerLinks),
    });

    const dedupeKey = buildProductWhatsAppClientInviteDedupeKey(
      product.id,
      contact.id,
      binding.groupChatId,
    );
    const invitation = await this.prisma.productWhatsAppClientInvitation.upsert({
      where: { dedupeKey },
      create: {
        productId: product.id,
        bindingId: binding.id,
        contactId: contact.id,
        dedupeKey,
        status: 'QUEUED',
        attemptCount: 1,
        lastAttemptAt: new Date(),
      },
      update: {
        status: 'QUEUED',
        attemptCount: { increment: 1 },
        lastAttemptAt: new Date(),
      },
    });

    try {
      await this.client.sendTextMessage(config, {
        chatId: phone.jid,
        text: message.text,
      });
    } catch (error) {
      if (error instanceof WhatsAppGatewayHttpError && error.status >= 500) {
        await this.prisma.productWhatsAppClientInvitation.update({
          where: { id: invitation.id },
          data: {
            status: 'OUTCOME_UNKNOWN',
            lastErrorCode: WHATSAPP_ERROR.CLIENT_INVITE_OUTCOME_UNKNOWN,
            lastErrorMessage: error.message,
          },
        });
        await this.markOutcomeUnknown(
          operationId,
          WHATSAPP_ERROR.CLIENT_INVITE_OUTCOME_UNKNOWN,
          error.message,
        );
        await this.audit.log({
          entityType: WHATSAPP_AUDIT_ENTITY_PRODUCT_GROUP,
          entityId: product.id,
          action: WHATSAPP_AUDIT_INVITE_FAILED,
          userId: operation.requestedById ?? product.id,
          projectId: product.projectId,
          changes: { contactId: contact.id, outcome: 'UNKNOWN' },
        });
        return;
      }
      const code =
        error instanceof WhatsAppGatewayHttpError
          ? error.code
          : WHATSAPP_ERROR.CLIENT_INVITE_FAILED;
      const msg = error instanceof Error ? error.message : 'Invite send failed';
      await this.prisma.productWhatsAppClientInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'FAILED',
          lastErrorCode: code,
          lastErrorMessage: msg,
        },
      });
      await this.markFailed(operationId, code, msg);
      await this.audit.log({
        entityType: WHATSAPP_AUDIT_ENTITY_PRODUCT_GROUP,
        entityId: product.id,
        action: WHATSAPP_AUDIT_INVITE_FAILED,
        userId: operation.requestedById ?? product.id,
        projectId: product.projectId,
        changes: { contactId: contact.id },
      });
      return;
    }

    await this.prisma.productWhatsAppClientInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        lastErrorCode: null,
        lastErrorMessage: null,
      },
    });
    await this.markSucceeded(operationId, {
      invitationId: invitation.id,
      contactId: contact.id,
      locale: message.locale,
    });
    await this.audit.log({
      entityType: WHATSAPP_AUDIT_ENTITY_PRODUCT_GROUP,
      entityId: product.id,
      action: WHATSAPP_AUDIT_INVITE_SENT,
      userId: operation.requestedById ?? product.id,
      projectId: product.projectId,
      changes: { contactId: contact.id, locale: message.locale },
    });
  }

  private async enqueueClientInviteAfterCreate(
    productId: string,
    bindingId: string,
    contextDealId: string | null,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        project: { select: { contactId: true } },
        order: { select: { deal: { select: { contactId: true } } } },
      },
    });
    const contactId =
      product?.project.contactId ??
      (contextDealId
        ? (
            await this.prisma.deal.findUnique({
              where: { id: contextDealId },
              select: { contactId: true },
            })
          )?.contactId
        : null) ??
      product?.order?.deal?.contactId ??
      null;

    const binding = await this.prisma.productWhatsAppGroupBinding.findUnique({
      where: { id: bindingId },
    });
    if (!binding?.groupChatId) return;

    if (!contactId) {
      await this.prisma.productWhatsAppClientInvitation.create({
        data: {
          productId,
          bindingId,
          contactId: null,
          status: 'SKIPPED_NO_CONTACT',
          dedupeKey: `whatsapp-product-group:${productId}:client-invite:none:${binding.groupChatId}`,
        },
      });
      return;
    }

    const dedupeKey = buildProductWhatsAppClientInviteDedupeKey(
      productId,
      contactId,
      binding.groupChatId,
    );
    const invitation = await this.prisma.productWhatsAppClientInvitation.upsert({
      where: { dedupeKey },
      create: {
        productId,
        bindingId,
        contactId,
        status: 'PENDING',
        dedupeKey,
      },
      update: {},
    });
    if (invitation.status === 'SENT') return;

    const opKey = `whatsapp-product-group:invite-op:${invitation.id}`;
    const existingOp = await this.prisma.whatsAppGroupOperation.findUnique({
      where: { dedupeKey: opKey },
    });
    if (existingOp) return;

    const inviteOp = await this.prisma.whatsAppGroupOperation.create({
      data: {
        productId,
        bindingId,
        type: 'SEND_CLIENT_INVITE',
        status: 'PENDING',
        dedupeKey: opKey,
        source: 'PRODUCT_CREATED',
        contextDealId,
        safePayload: { invitationId: invitation.id, contactId },
      },
    });
    await this.queue.enqueueOperation(inviteOp.id, opKey);
    await this.prisma.whatsAppGroupOperation.update({
      where: { id: inviteOp.id },
      data: { status: 'QUEUED', queuedAt: new Date() },
    });
  }

  private async markSucceeded(operationId: string, metadata: Record<string, unknown>) {
    await this.prisma.whatsAppGroupOperation.update({
      where: { id: operationId },
      data: {
        status: 'SUCCEEDED',
        completedAt: new Date(),
        resultMetadata: metadata as InputJsonValue,
        errorCode: null,
        errorMessage: null,
      },
    });
  }

  private async markFailed(operationId: string, code: string, message: string) {
    const operation = await this.prisma.whatsAppGroupOperation.update({
      where: { id: operationId },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        errorCode: code,
        errorMessage: message,
      },
    });
    if (operation.type === 'CREATE_PRODUCT_GROUP') {
      await this.prisma.productWhatsAppGroupBinding.updateMany({
        where: {
          productId: operation.productId,
          status: { in: ['PENDING', 'CREATING'] },
        },
        data: {
          status: 'FAILED',
          lastErrorCode: code,
          lastErrorMessage: message,
        },
      });
      await this.audit.log({
        entityType: WHATSAPP_AUDIT_ENTITY_PRODUCT_GROUP,
        entityId: operation.productId,
        action: WHATSAPP_AUDIT_GROUP_FAILED,
        userId: operation.requestedById ?? operation.productId,
        changes: { code },
      });
    }
  }

  private async markOutcomeUnknown(operationId: string, code: string, message: string) {
    await this.prisma.whatsAppGroupOperation.update({
      where: { id: operationId },
      data: {
        status: 'OUTCOME_UNKNOWN',
        failedAt: new Date(),
        errorCode: code,
        errorMessage: message,
      },
    });
  }

  /**
   * After a transient Gateway/WAHA failure the row must leave PROCESSING,
   * otherwise BullMQ retries cannot re-acquire the lock (stuck forever).
   */
  private async releaseProcessingForRetry(operationId: string, error: unknown): Promise<void> {
    const code =
      error instanceof WhatsAppGatewayHttpError ? error.code : WHATSAPP_ERROR.GATEWAY_UNAVAILABLE;
    const message = error instanceof Error ? error.message : 'Transient WhatsApp failure';
    await this.prisma.whatsAppGroupOperation.updateMany({
      where: { id: operationId, status: 'PROCESSING' },
      data: {
        status: 'QUEUED',
        errorCode: code,
        errorMessage: message,
      },
    });
  }

  private async onJobExhausted(
    job: Job<WhatsAppProductGroupJobPayload> | undefined,
    error: Error,
  ): Promise<void> {
    if (!job?.data.operationId) return;
    const maxAttempts = job.opts.attempts ?? 1;
    if (job.attemptsMade < maxAttempts) return;

    const code =
      error instanceof WhatsAppGatewayHttpError
        ? error.code
        : WHATSAPP_ERROR.PRODUCT_GROUP_CREATE_FAILED;
    try {
      const operation = await this.prisma.whatsAppGroupOperation.findUnique({
        where: { id: job.data.operationId },
      });
      if (!operation) return;
      if (['SUCCEEDED', 'SKIPPED', 'OUTCOME_UNKNOWN', 'FAILED'].includes(operation.status)) {
        return;
      }
      await this.markFailed(operation.id, code, error.message);
    } catch (markError) {
      this.logger.error(
        `Failed to mark exhausted WhatsApp operation ${job.data.operationId}`,
        markError,
      );
    }
  }
}
