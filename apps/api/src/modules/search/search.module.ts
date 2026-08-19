import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CredentialVaultSessionModule } from '../credentials/credential-vault-session.module';
import { NotificationModule } from '../notifications/notification.module';
import { PlatformAccessModule } from '../platform-access/platform-access.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [AuditModule, NotificationModule, PlatformAccessModule, CredentialVaultSessionModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
