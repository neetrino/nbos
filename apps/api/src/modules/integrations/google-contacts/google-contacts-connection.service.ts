import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { AuditService } from '../../audit/audit.service';
import { PlatformOwnershipService } from '../../platform-ownership/platform-ownership.service';
import {
  GOOGLE_CONTACTS_AUDIT_DISCONNECTED,
  GOOGLE_CONTACTS_AUDIT_ENTITY,
  GOOGLE_CONTACTS_AUDIT_SYNC_REQUESTED,
  GOOGLE_CONTACTS_CONNECTION_ID,
} from './google-contacts.constants';
import { isGoogleContactsLinked } from './google-contacts-connection-state';
import { GoogleContactsConfig } from './google-contacts.config';
import { GoogleContactsQueueService } from './google-contacts-queue.service';
import { GoogleContactsSecretStore } from './google-contacts-secret.store';
import type { GoogleContactsConnectionView } from './google-contacts.types';

@Injectable()
export class GoogleContactsConnectionService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly config: GoogleContactsConfig,
    private readonly secretStore: GoogleContactsSecretStore,
    private readonly queue: GoogleContactsQueueService,
    private readonly ownership: PlatformOwnershipService,
    private readonly audit: AuditService,
  ) {}

  async getPublicView(actorId: string): Promise<GoogleContactsConnectionView> {
    await this.ownership.assertPlatformOwner(actorId);
    return this.toPublicView();
  }

  async disconnect(actorId: string): Promise<GoogleContactsConnectionView> {
    await this.ownership.assertPlatformOwner(actorId);
    await this.ensureRow();
    await this.secretStore.delete();
    await this.prisma.googleContactsConnection.update({
      where: { id: GOOGLE_CONTACTS_CONNECTION_ID },
      data: {
        status: 'DISCONNECTED',
        lastErrorCode: null,
        lastErrorMessage: null,
      },
    });
    await this.audit.log({
      entityType: GOOGLE_CONTACTS_AUDIT_ENTITY,
      entityId: GOOGLE_CONTACTS_CONNECTION_ID,
      action: GOOGLE_CONTACTS_AUDIT_DISCONNECTED,
      userId: actorId,
    });
    return this.toPublicView();
  }

  async syncNow(actorId: string): Promise<{ enqueued: number } & GoogleContactsConnectionView> {
    await this.ownership.assertPlatformOwner(actorId);
    const result = await this.queue.enqueueAllActiveContacts();
    await this.audit.log({
      entityType: GOOGLE_CONTACTS_AUDIT_ENTITY,
      entityId: GOOGLE_CONTACTS_CONNECTION_ID,
      action: GOOGLE_CONTACTS_AUDIT_SYNC_REQUESTED,
      userId: actorId,
      changes: { enqueued: result.enqueued },
    });
    const view = await this.toPublicView();
    return { ...view, enqueued: result.enqueued };
  }

  private async ensureRow(): Promise<void> {
    await this.prisma.googleContactsConnection.upsert({
      where: { id: GOOGLE_CONTACTS_CONNECTION_ID },
      create: { id: GOOGLE_CONTACTS_CONNECTION_ID, status: 'DISCONNECTED' },
      update: {},
    });
  }

  private async toPublicView(): Promise<GoogleContactsConnectionView> {
    await this.ensureRow();
    const row = await this.prisma.googleContactsConnection.findUniqueOrThrow({
      where: { id: GOOGLE_CONTACTS_CONNECTION_ID },
      select: {
        googleEmail: true,
        status: true,
        lastSyncedAt: true,
        lastErrorCode: true,
        lastErrorMessage: true,
        secret: { select: { id: true } },
      },
    });
    return {
      connected: isGoogleContactsLinked(row),
      oauthConfigured: this.config.isConfigured(),
      googleEmail: row.googleEmail,
      status: row.status,
      lastSyncedAt: row.lastSyncedAt?.toISOString() ?? null,
      lastErrorCode: row.lastErrorCode,
      lastErrorMessage: row.lastErrorMessage,
    };
  }
}
