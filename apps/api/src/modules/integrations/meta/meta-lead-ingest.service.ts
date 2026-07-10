import { Inject, Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, type InputJsonValue, type TransactionClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import {
  buildMetaLeadNames,
  isGenericMetaLeadField,
  type MetaLeadPlatform,
} from './meta-lead-display';
import {
  buildLatestMessagePreview,
  buildMinimalProviderMetadata,
  isPrismaSerializationFailure,
  isPrismaUniqueViolation,
  META_TX_MAX_RETRIES,
  resolveInboundMessageType,
  resolveMessageSentAt,
} from './meta-lead-ingest.helpers';
import type { MetaProfileService } from './meta-profile.service';
import type { MetaMessagingUserProfile } from './meta-messaging-profile.types';
import type { ParsedMetaInboundMessage } from './meta.types';

const LEAD_SOURCE = 'MARKETING' as const;
const LEAD_SOURCE_DETAIL = 'SMM' as const;

interface ConnectedAccountForIngest {
  id: string;
  platform: MetaLeadPlatform;
  pageId: string;
  instagramBusinessAccountId: string | null;
  marketingAccountId: string | null;
  displayName: string;
  scopes: unknown;
}

@Injectable()
export class MetaLeadIngestService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly profileService: MetaProfileService,
  ) {}

  async ingestMessage(message: ParsedMetaInboundMessage): Promise<void> {
    const account = await this.resolveConnectedAccount(message);
    if (!account) {
      await this.recordSkippedEvent(message, 'no_connected_account');
      return;
    }
    if (!account.marketingAccountId) {
      await this.recordSkippedEvent(message, 'marketing_account_not_linked', account.id);
      return;
    }

    const isDuplicateEvent = await this.tryBeginIdempotentEvent(message);
    if (isDuplicateEvent) {
      return;
    }

    const platform = account.platform;
    const existingIdentity = await this.prisma.metaSenderIdentity.findUnique({
      where: {
        platform_metaConnectedAccountId_senderScopedId: {
          platform,
          metaConnectedAccountId: account.id,
          senderScopedId: message.senderId,
        },
      },
    });

    const resolvedProfile = await this.profileService.resolveSenderProfile(
      account,
      message.senderId,
      existingIdentity,
    );

    const leadId = await this.persistInboundMessage({
      account,
      message,
      platform,
      resolvedProfile,
    });

    await this.prisma.metaProviderEvent.updateMany({
      where: { provider: 'META', eventId: message.eventId },
      data: { leadId, processedAt: new Date() },
    });
  }

  private async persistInboundMessage(params: {
    account: ConnectedAccountForIngest;
    message: ParsedMetaInboundMessage;
    platform: MetaLeadPlatform;
    resolvedProfile: Awaited<ReturnType<MetaProfileService['resolveSenderProfile']>>;
  }): Promise<string> {
    const { account, message, platform, resolvedProfile } = params;
    const preview = buildLatestMessagePreview(message.messageText);
    const sentAt = resolveMessageSentAt(message.timestamp);
    const messageType = resolveInboundMessageType(message.messageText);
    const providerMetadata = buildMinimalProviderMetadata(message);

    for (let attempt = 0; attempt < META_TX_MAX_RETRIES; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const senderIdentity = await tx.metaSenderIdentity.upsert({
              where: {
                platform_metaConnectedAccountId_senderScopedId: {
                  platform,
                  metaConnectedAccountId: account.id,
                  senderScopedId: message.senderId,
                },
              },
              create: {
                platform,
                metaConnectedAccountId: account.id,
                senderScopedId: message.senderId,
                ...resolvedProfile.identityPatch,
                profileFetchedAt: resolvedProfile.profileFetchedAt,
                profileFetchStatus: resolvedProfile.profileFetchStatus,
                lastProfileFetchError: resolvedProfile.lastProfileFetchError,
              },
              update: resolvedProfile.fetchedNow
                ? {
                    ...resolvedProfile.identityPatch,
                    profileFetchedAt: resolvedProfile.profileFetchedAt,
                    profileFetchStatus: resolvedProfile.profileFetchStatus,
                    lastProfileFetchError: resolvedProfile.lastProfileFetchError,
                  }
                : {},
            });

            const conversation = await tx.metaConversation.upsert({
              where: {
                metaConnectedAccountId_senderIdentityId: {
                  metaConnectedAccountId: account.id,
                  senderIdentityId: senderIdentity.id,
                },
              },
              create: {
                metaConnectedAccountId: account.id,
                senderIdentityId: senderIdentity.id,
              },
              update: {},
            });

            let leadId = conversation.leadId;
            if (!leadId) {
              const leadNames = buildMetaLeadNames(platform, resolvedProfile.profile);
              const lead = await tx.lead.create({
                data: {
                  code: await this.generateLeadCode(tx),
                  name: leadNames.name,
                  contactName: leadNames.contactName,
                  source: LEAD_SOURCE,
                  sourceDetail: LEAD_SOURCE_DETAIL,
                  marketingAccountId: account.marketingAccountId,
                },
                select: { id: true },
              });
              leadId = lead.id;
              await tx.metaConversation.update({
                where: { id: conversation.id },
                data: { leadId },
              });
            } else if (resolvedProfile.fetchedNow) {
              await this.maybeEnrichExistingLead(tx, leadId, platform, resolvedProfile.profile);
            }

            try {
              await tx.metaMessage.create({
                data: {
                  conversationId: conversation.id,
                  metaConnectedAccountId: account.id,
                  providerMessageId: message.eventId,
                  platform,
                  direction: 'INBOUND',
                  messageType,
                  text: message.messageText,
                  sentAt,
                  providerMetadata: (providerMetadata ?? undefined) as InputJsonValue | undefined,
                },
              });
            } catch (error) {
              if (!isPrismaUniqueViolation(error)) {
                throw error;
              }
            }

            await tx.metaConversation.update({
              where: { id: conversation.id },
              data: {
                lastMessageAt: sentAt ?? new Date(),
                latestMessagePreview: preview,
              },
            });

            return leadId;
          },
          {
            isolationLevel: 'Serializable',
            maxWait: 5000,
            timeout: 10000,
          },
        );
      } catch (error) {
        if (isPrismaSerializationFailure(error) && attempt < META_TX_MAX_RETRIES - 1) {
          continue;
        }
        throw error;
      }
    }

    throw new Error('Meta lead ingest transaction failed after retries');
  }

  private async maybeEnrichExistingLead(
    tx: TransactionClient,
    leadId: string,
    platform: MetaLeadPlatform,
    profile: MetaMessagingUserProfile,
  ): Promise<void> {
    const lead = await tx.lead.findUnique({
      where: { id: leadId },
      select: { name: true, contactName: true },
    });
    if (!lead) {
      return;
    }

    const leadNames = buildMetaLeadNames(platform, profile);
    const data: Prisma.LeadUpdateInput = {};
    if (isGenericMetaLeadField(lead.name, platform)) {
      data.name = leadNames.name;
    }
    if (isGenericMetaLeadField(lead.contactName, platform)) {
      data.contactName = leadNames.contactName;
    }
    if (Object.keys(data).length === 0) {
      return;
    }
    await tx.lead.update({ where: { id: leadId }, data });
  }

  private async generateLeadCode(tx: TransactionClient): Promise<string> {
    const year = new Date().getFullYear();
    const lastLead = await tx.lead.findFirst({
      where: { code: { startsWith: `L-${year}-` } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    const nextNum = lastLead ? parseInt(lastLead.code.split('-')[2] ?? '0', 10) + 1 : 1;
    return `L-${year}-${String(nextNum).padStart(4, '0')}`;
  }

  private async resolveConnectedAccount(
    message: ParsedMetaInboundMessage,
  ): Promise<ConnectedAccountForIngest | null> {
    const objectId = message.objectId;
    return this.prisma.metaConnectedAccount.findFirst({
      where: {
        provider: 'META',
        status: 'CONNECTED',
        OR: [
          { externalAccountId: objectId },
          { pageId: objectId },
          { instagramBusinessAccountId: objectId },
        ],
      },
      select: {
        id: true,
        platform: true,
        pageId: true,
        instagramBusinessAccountId: true,
        marketingAccountId: true,
        displayName: true,
        scopes: true,
      },
    });
  }

  private async tryBeginIdempotentEvent(message: ParsedMetaInboundMessage): Promise<boolean> {
    try {
      await this.prisma.metaProviderEvent.create({
        data: {
          provider: 'META',
          eventId: message.eventId,
          objectId: message.objectId,
          eventType: 'message',
          payload: {
            platform: message.platform,
            senderId: message.senderId,
          },
        },
      });
      return false;
    } catch (error) {
      if (isPrismaUniqueViolation(error)) {
        return true;
      }
      throw error;
    }
  }

  private async recordSkippedEvent(
    message: ParsedMetaInboundMessage,
    reason: string,
    connectedAccountId?: string,
  ): Promise<void> {
    try {
      await this.prisma.metaProviderEvent.create({
        data: {
          provider: 'META',
          eventId: message.eventId,
          objectId: message.objectId,
          eventType: 'message',
          processedAt: new Date(),
          payload: {
            skipped: true,
            reason,
            connectedAccountId: connectedAccountId ?? null,
            platform: message.platform,
            senderId: message.senderId,
          },
        },
      });
    } catch (error) {
      if (isPrismaUniqueViolation(error)) {
        return;
      }
      throw error;
    }
  }
}
