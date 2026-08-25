import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { decrypt, encrypt } from '../../../common/utils/crypto';
import { GOOGLE_CONTACTS_CONNECTION_ID } from './google-contacts.constants';

/**
 * Narrow client for optional transactional writes. A full
 * `PrismaClient | TransactionClient` union exhausts TS instantiation depth.
 */
type GoogleContactsSecretDb = Pick<InstanceType<typeof PrismaClient>, 'googleContactsSecret'>;

@Injectable()
export class GoogleContactsSecretStore {
  private readonly encryptionKey: string;

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    configService: ConfigService,
  ) {
    this.encryptionKey = configService.getOrThrow<string>('CREDENTIALS_ENCRYPTION_KEY');
  }

  async store(refreshToken: string, tx?: GoogleContactsSecretDb): Promise<void> {
    const encryptedSecret = encrypt(refreshToken, this.encryptionKey);
    const client: GoogleContactsSecretDb = tx ?? this.prisma;
    await client.googleContactsSecret.upsert({
      where: { connectionId: GOOGLE_CONTACTS_CONNECTION_ID },
      create: { connectionId: GOOGLE_CONTACTS_CONNECTION_ID, encryptedSecret },
      update: { encryptedSecret },
    });
  }

  async read(): Promise<string | null> {
    const row = await this.prisma.googleContactsSecret.findUnique({
      where: { connectionId: GOOGLE_CONTACTS_CONNECTION_ID },
    });
    if (!row) return null;
    return decrypt(row.encryptedSecret, this.encryptionKey);
  }

  async delete(): Promise<void> {
    await this.prisma.googleContactsSecret.deleteMany({
      where: { connectionId: GOOGLE_CONTACTS_CONNECTION_ID },
    });
  }
}
