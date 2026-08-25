import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { GoogleContactsConfig } from './google-contacts.config';
import { GoogleContactsConnectionService } from './google-contacts-connection.service';
import { GoogleContactsController } from './google-contacts.controller';
import { GoogleContactsOAuthService } from './google-contacts-oauth.service';
import { GoogleContactsQueueService } from './google-contacts-queue.service';
import { GoogleContactsSecretStore } from './google-contacts-secret.store';
import { GoogleContactsSyncService } from './google-contacts-sync.service';

/** Producers + HTTP. BullMQ Worker lives in QueueWorkersModule. */
@Module({
  imports: [AuditModule],
  controllers: [GoogleContactsController],
  providers: [
    GoogleContactsConfig,
    GoogleContactsSecretStore,
    GoogleContactsQueueService,
    GoogleContactsSyncService,
    GoogleContactsOAuthService,
    GoogleContactsConnectionService,
  ],
  exports: [GoogleContactsQueueService, GoogleContactsSyncService],
})
export class GoogleContactsModule {}
