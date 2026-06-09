import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { decrypt, encrypt } from '../../../common/utils/crypto';

export interface CorporateMailSecret {
  kind: 'corporate';
  password: string;
}

export interface GmailMailSecret {
  kind: 'gmail';
  refreshToken: string;
  accessToken?: string;
  expiryDate?: number;
}

export type MailProviderSecret = CorporateMailSecret | GmailMailSecret;

/**
 * Secure store for mailbox provider secrets. Secrets are AES-256-GCM encrypted
 * with `CREDENTIALS_ENCRYPTION_KEY` and stored as an opaque blob — never in
 * plaintext, never on MailAccount/connection rows, never logged.
 */
@Injectable()
export class MailProviderSecretStore {
  private readonly encryptionKey: string;

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    configService: ConfigService,
  ) {
    this.encryptionKey = configService.getOrThrow<string>('CREDENTIALS_ENCRYPTION_KEY');
  }

  async store(mailAccountId: string, secret: MailProviderSecret): Promise<void> {
    const encryptedSecret = encrypt(JSON.stringify(secret), this.encryptionKey);
    await this.prisma.mailProviderSecret.upsert({
      where: { mailAccountId },
      create: { mailAccountId, encryptedSecret },
      update: { encryptedSecret },
    });
  }

  async read(mailAccountId: string): Promise<MailProviderSecret | null> {
    const row = await this.prisma.mailProviderSecret.findUnique({ where: { mailAccountId } });
    if (!row) {
      return null;
    }
    const json = decrypt(row.encryptedSecret, this.encryptionKey);
    return JSON.parse(json) as MailProviderSecret;
  }

  async delete(mailAccountId: string): Promise<void> {
    await this.prisma.mailProviderSecret.deleteMany({ where: { mailAccountId } });
  }
}
