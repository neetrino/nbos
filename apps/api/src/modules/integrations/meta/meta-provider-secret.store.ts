import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { decrypt, encrypt } from '../../../common/utils/crypto';
import type { MetaProviderSecretPayload } from './meta.types';

/**
 * Encrypted store for Meta page access tokens. Never log or expose plaintext tokens.
 */
@Injectable()
export class MetaProviderSecretStore {
  private readonly encryptionKey: string;

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    configService: ConfigService,
  ) {
    this.encryptionKey = configService.getOrThrow<string>('CREDENTIALS_ENCRYPTION_KEY');
  }

  async store(metaConnectedAccountId: string, secret: MetaProviderSecretPayload): Promise<void> {
    const encryptedSecret = encrypt(JSON.stringify(secret), this.encryptionKey);
    await this.prisma.metaProviderSecret.upsert({
      where: { metaConnectedAccountId },
      create: { metaConnectedAccountId, encryptedSecret },
      update: { encryptedSecret },
    });
  }

  async read(metaConnectedAccountId: string): Promise<MetaProviderSecretPayload | null> {
    const row = await this.prisma.metaProviderSecret.findUnique({
      where: { metaConnectedAccountId },
    });
    if (!row) {
      return null;
    }
    const json = decrypt(row.encryptedSecret, this.encryptionKey);
    return JSON.parse(json) as MetaProviderSecretPayload;
  }

  async delete(metaConnectedAccountId: string): Promise<void> {
    await this.prisma.metaProviderSecret.deleteMany({ where: { metaConnectedAccountId } });
  }
}
