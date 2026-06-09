import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notifications/notification.module';
import { MailAccountAccessService } from './mail-account-access.service';
import { MailAccountCommandService } from './mail-account-command.service';
import { MailCollabController } from './mail-collab.controller';
import { MailComposeService } from './mail-compose.service';
import { MailConnectService } from './mail-connect.service';
import { MailController } from './mail.controller';
import { MailGmailOAuthService } from './mail-gmail-oauth.service';
import { MailImapIdleService } from './mail-imap-idle.service';
import { MailOutboundMutationService } from './mail-outbound-mutation.service';
import { MailOutboundSendMutationService } from './mail-outbound-send-mutation.service';
import { MailProviderController } from './mail-provider.controller';
import { MailPubSubService } from './mail-pubsub.service';
import { MailQueueService } from './mail-queue.service';
import { MailSendService } from './mail-send.service';
import { MailService } from './mail.service';
import { MailSyncService } from './mail-sync.service';
import { MailThreadAssignmentService } from './mail-thread-assignment.service';
import { MailThreadCommandService } from './mail-thread-command.service';
import { MailWorker } from './mail.worker';
import { MailProviderAdapterFactory } from './providers/mail-provider-adapter.factory';
import { MailProviderConfig } from './providers/mail-provider.config';
import { MailProviderSecretStore } from './providers/mail-provider-secret.store';

@Module({
  imports: [AuditModule, NotificationModule],
  controllers: [MailController, MailProviderController, MailCollabController],
  providers: [
    MailService,
    MailOutboundMutationService,
    MailOutboundSendMutationService,
    MailThreadCommandService,
    MailThreadAssignmentService,
    MailAccountCommandService,
    MailAccountAccessService,
    MailComposeService,
    MailConnectService,
    MailGmailOAuthService,
    MailPubSubService,
    MailSyncService,
    MailSendService,
    MailQueueService,
    MailWorker,
    MailImapIdleService,
    MailProviderConfig,
    MailProviderSecretStore,
    MailProviderAdapterFactory,
  ],
  exports: [MailService],
})
export class MailModule {}
