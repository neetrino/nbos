import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notifications/notification.module';
import { PlatformAccessModule } from '../platform-access/platform-access.module';
import { CredentialVaultSessionModule } from './credential-vault-session.module';
import { CredentialsController } from './credentials.controller';
import { CredentialsService } from './credentials.service';

@Module({
  imports: [AuditModule, NotificationModule, PlatformAccessModule, CredentialVaultSessionModule],
  controllers: [CredentialsController],
  providers: [CredentialsService],
  exports: [CredentialsService],
})
export class CredentialsModule {}
