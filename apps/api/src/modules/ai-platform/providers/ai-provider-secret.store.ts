import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { decrypt, encrypt } from '../../../common/utils/crypto';
import type { PrismaTransaction } from '../agents/agent-row-lock';

type SecretClient = Pick<PrismaTransaction, 'aiProviderSecret'>;

/**
 * AES-256-GCM store for provider API keys. Uses the platform
 * CREDENTIALS_ENCRYPTION_KEY — not a second crypto stack.
 *
 * Callers that only need connection metadata must never touch this store.
 */
@Injectable()
export class AiProviderSecretStore {
  private readonly encryptionKey: string;

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    configService: ConfigService,
  ) {
    this.encryptionKey = configService.getOrThrow<string>('CREDENTIALS_ENCRYPTION_KEY');
  }

  async write(
    connectionId: string,
    apiKey: string,
    client: SecretClient = this.prisma,
  ): Promise<void> {
    const encryptedApiKey = encrypt(apiKey, this.encryptionKey);
    await client.aiProviderSecret.upsert({
      where: { connectionId },
      create: { connectionId, encryptedApiKey },
      update: { encryptedApiKey },
    });
  }

  async read(connectionId: string, client: SecretClient = this.prisma): Promise<string> {
    const row = await client.aiProviderSecret.findUnique({ where: { connectionId } });
    if (!row) {
      throw new NotFoundException('Provider secret not found');
    }
    return decrypt(row.encryptedApiKey, this.encryptionKey);
  }

  async delete(connectionId: string, client: SecretClient = this.prisma): Promise<void> {
    await client.aiProviderSecret.deleteMany({ where: { connectionId } });
  }
}
