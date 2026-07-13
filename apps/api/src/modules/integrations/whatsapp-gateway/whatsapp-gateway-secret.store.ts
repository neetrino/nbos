import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { decrypt, encrypt } from '../../../common/utils/crypto';

/**
 * Encrypted store for WhatsApp Gateway API token. Never log or return plaintext tokens.
 */
@Injectable()
export class WhatsAppGatewaySecretStore {
  private readonly encryptionKey: string;

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    configService: ConfigService,
  ) {
    this.encryptionKey = configService.getOrThrow<string>('CREDENTIALS_ENCRYPTION_KEY');
  }

  encryptToken(apiToken: string): string {
    return encrypt(apiToken, this.encryptionKey);
  }

  decryptToken(encryptedApiToken: string): string {
    return decrypt(encryptedApiToken, this.encryptionKey);
  }
}
