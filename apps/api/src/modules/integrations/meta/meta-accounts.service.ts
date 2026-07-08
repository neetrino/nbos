import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { MetaProviderSecretStore } from './meta-provider-secret.store';

@Injectable()
export class MetaAccountsService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly secretStore: MetaProviderSecretStore,
  ) {}

  async listAccounts() {
    const rows = await this.prisma.metaConnectedAccount.findMany({
      where: { provider: 'META', status: { not: 'DISCONNECTED' } },
      orderBy: [{ platform: 'asc' }, { displayName: 'asc' }],
      include: {
        marketingAccount: { select: { id: true, name: true, channel: true } },
      },
    });
    return rows.map((row) => this.toDto(row));
  }

  async linkMarketingAccount(accountId: string, marketingAccountId: string | null) {
    const account = await this.requireAccount(accountId);
    if (marketingAccountId) {
      const marketingAccount = await this.prisma.marketingAccount.findUnique({
        where: { id: marketingAccountId },
        select: { id: true, channel: true },
      });
      if (!marketingAccount) {
        throw new NotFoundException(`Marketing account ${marketingAccountId} not found`);
      }
      if (marketingAccount.channel !== 'SMM') {
        throw new BadRequestException('Marketing account channel must be SMM for Meta DM leads');
      }
    }
    const updated = await this.prisma.metaConnectedAccount.update({
      where: { id: account.id },
      data: { marketingAccountId },
      include: {
        marketingAccount: { select: { id: true, name: true, channel: true } },
      },
    });
    return this.toDto(updated);
  }

  async disconnect(accountId: string): Promise<void> {
    const account = await this.requireAccount(accountId);
    await this.secretStore.delete(account.id);
    await this.prisma.metaConnectedAccount.update({
      where: { id: account.id },
      data: {
        status: 'DISCONNECTED',
        lastErrorAt: null,
        lastErrorMessage: null,
      },
    });
  }

  private async requireAccount(accountId: string) {
    const account = await this.prisma.metaConnectedAccount.findUnique({
      where: { id: accountId },
    });
    if (!account || account.status === 'DISCONNECTED') {
      throw new NotFoundException(`Meta connected account ${accountId} not found`);
    }
    return account;
  }

  private toDto(row: {
    id: string;
    provider: string;
    platform: string;
    displayName: string;
    pageId: string;
    instagramBusinessAccountId: string | null;
    externalAccountId: string;
    marketingAccountId: string | null;
    connectedByUserId: string;
    status: string;
    tokenExpiresAt: Date | null;
    scopes: unknown;
    lastErrorAt: Date | null;
    lastErrorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
    marketingAccount?: { id: string; name: string; channel: string } | null;
  }) {
    return {
      id: row.id,
      provider: row.provider,
      platform: row.platform,
      displayName: row.displayName,
      pageId: row.pageId,
      instagramBusinessAccountId: row.instagramBusinessAccountId,
      externalAccountId: row.externalAccountId,
      marketingAccountId: row.marketingAccountId,
      connectedByUserId: row.connectedByUserId,
      status: row.status,
      tokenExpiresAt: row.tokenExpiresAt?.toISOString() ?? null,
      scopes: row.scopes,
      lastErrorAt: row.lastErrorAt?.toISOString() ?? null,
      lastErrorMessage: row.lastErrorMessage,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      marketingAccount: row.marketingAccount ?? null,
    };
  }
}
