import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import * as jwt from 'jsonwebtoken';
import { PRISMA_TOKEN } from '../../../database.module';
import { LeadsService } from '../../crm/leads/leads.service';
import type { ParsedMetaInboundMessage } from './meta.types';

const LEAD_SOURCE = 'MARKETING' as const;
const LEAD_SOURCE_DETAIL = 'SMM' as const;
const MESSAGE_PREVIEW_MAX = 200;

interface ConnectedAccountForIngest {
  id: string;
  platform: string;
  pageId: string;
  instagramBusinessAccountId: string | null;
  marketingAccountId: string | null;
  displayName: string;
}

@Injectable()
export class MetaLeadIngestService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly leadsService: LeadsService,
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

    const isDuplicate = await this.tryBeginIdempotentEvent(message);
    if (isDuplicate) {
      return;
    }

    const lead = await this.leadsService.create({
      name: this.buildLeadName(message),
      contactName: this.buildContactName(message),
      source: LEAD_SOURCE,
      sourceDetail: LEAD_SOURCE_DETAIL,
      marketingAccountId: account.marketingAccountId,
      marketingActivityId: null,
      notes: this.buildLeadNotes(message, account),
    });

    await this.prisma.metaProviderEvent.updateMany({
      where: { provider: 'META', eventId: message.eventId },
      data: { leadId: lead.id, processedAt: new Date() },
    });
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

  private buildContactName(message: ParsedMetaInboundMessage): string {
    if (message.senderName?.trim()) {
      return message.senderName.trim();
    }
    return message.platform === 'INSTAGRAM' ? 'Instagram user' : 'Facebook user';
  }

  private buildLeadName(message: ParsedMetaInboundMessage): string {
    if (message.platform === 'INSTAGRAM') {
      const handle = message.senderName?.trim();
      return handle ? `Instagram DM — @${handle.replace(/^@/, '')}` : 'Instagram DM';
    }
    const name = message.senderName?.trim();
    return name ? `Facebook Messenger — ${name}` : 'Facebook Messenger';
  }

  private buildLeadNotes(
    message: ParsedMetaInboundMessage,
    account: ConnectedAccountForIngest,
  ): string {
    const preview = message.messageText?.trim().slice(0, MESSAGE_PREVIEW_MAX) ?? '(no text)';
    const lines = [
      `Platform: ${message.platform}`,
      `Sender ID: ${message.senderId}`,
      `Page ID: ${account.pageId}`,
      `Connected account: ${account.displayName}`,
    ];
    if (account.instagramBusinessAccountId) {
      lines.push(`Instagram Business Account ID: ${account.instagramBusinessAccountId}`);
    }
    lines.push(
      `Message ID: ${message.eventId}`,
      `Timestamp: ${message.timestamp ?? 'unknown'}`,
      `Preview: ${preview}`,
    );
    return lines.join('\n');
  }
}

function isPrismaUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}
