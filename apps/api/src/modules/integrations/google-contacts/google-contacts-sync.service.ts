import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { google, type people_v1 } from 'googleapis';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { GOOGLE_CONTACTS_CONNECTION_ID } from './google-contacts.constants';
import { GoogleContactsConfig } from './google-contacts.config';
import { upsertGoogleContactPerson } from './google-contacts-people-write';
import { GoogleContactsQueueService } from './google-contacts-queue.service';
import { GoogleContactsSecretStore } from './google-contacts-secret.store';

const CONTACT_SYNC_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  trashedAt: true,
  mergedIntoId: true,
  updatedAt: true,
  extraPhones: { select: { e164: true }, orderBy: { createdAt: 'asc' as const } },
};

@Injectable()
export class GoogleContactsSyncService {
  private readonly logger = new Logger(GoogleContactsSyncService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly config: GoogleContactsConfig,
    private readonly secretStore: GoogleContactsSecretStore,
    @Optional() private readonly queue?: GoogleContactsQueueService,
  ) {}

  async syncContact(contactId: string): Promise<void> {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
      select: CONTACT_SYNC_SELECT,
    });
    if (!contact || contact.trashedAt || contact.mergedIntoId) {
      return;
    }
    const snapshotUpdatedAt = contact.updatedAt;

    const people = await this.createPeopleClient();
    if (!people) return;

    const mapping = await this.prisma.googleContactMapping.findUnique({
      where: { contactId },
      select: { resourceName: true, etag: true },
    });

    try {
      const written = await upsertGoogleContactPerson(people, this.prisma, contact, mapping);
      await this.prisma.googleContactMapping.upsert({
        where: { contactId },
        create: {
          contactId,
          resourceName: written.resourceName,
          etag: written.etag,
          lastSyncedAt: new Date(),
        },
        update: {
          resourceName: written.resourceName,
          etag: written.etag,
          lastSyncedAt: new Date(),
          lastErrorCode: null,
          lastErrorMessage: null,
        },
      });
      await this.prisma.googleContactsConnection.update({
        where: { id: GOOGLE_CONTACTS_CONNECTION_ID },
        data: {
          lastSyncedAt: new Date(),
          lastErrorCode: null,
          lastErrorMessage: null,
          status: 'CONNECTED',
        },
      });
      await this.requeueIfContactChanged(contactId, snapshotUpdatedAt);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Google Contacts sync failed contactId=${contactId}: ${message}`);
      if (mapping) {
        await this.prisma.googleContactMapping.update({
          where: { contactId },
          data: {
            lastErrorCode: 'SYNC_FAILED',
            lastErrorMessage: message.slice(0, 2000),
          },
        });
      }
      await this.prisma.googleContactsConnection.update({
        where: { id: GOOGLE_CONTACTS_CONNECTION_ID },
        data: {
          lastErrorCode: 'SYNC_FAILED',
          lastErrorMessage: message.slice(0, 2000),
        },
      });
      throw error;
    }
  }

  private async requeueIfContactChanged(contactId: string, snapshotUpdatedAt: Date): Promise<void> {
    if (!this.queue?.isAvailable()) return;
    const fresh = await this.prisma.contact.findUnique({
      where: { id: contactId },
      select: { updatedAt: true },
    });
    if (fresh && fresh.updatedAt > snapshotUpdatedAt) {
      await this.queue.enqueueContact(contactId);
    }
  }

  private async createPeopleClient(): Promise<people_v1.People | null> {
    if (!this.config.isConfigured()) return null;
    const refreshToken = await this.secretStore.read();
    if (!refreshToken) return null;
    const auth = new google.auth.OAuth2(
      this.config.googleClientId,
      this.config.googleClientSecret,
      this.config.googleRedirectUri,
    );
    auth.setCredentials({ refresh_token: refreshToken });
    return google.people({ version: 'v1', auth });
  }
}
