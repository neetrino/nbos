import { Global, Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notifications/notification.module';
import { PlatformOwnershipController } from './platform-ownership.controller';
import { PlatformOwnershipService } from './platform-ownership.service';

@Global()
@Module({
  imports: [AuditModule, AuthModule, NotificationModule],
  controllers: [PlatformOwnershipController],
  providers: [PlatformOwnershipService],
  exports: [PlatformOwnershipService],
})
export class PlatformOwnershipModule {}
