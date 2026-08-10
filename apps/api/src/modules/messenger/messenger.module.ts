import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { MessengerController } from './messenger.controller';
import { MessengerGateway } from './messenger.gateway';
import { MessengerService } from './messenger.service';
import { MessengerUnifiedService } from './messenger-unified.service';

@Module({
  imports: [AuditModule],
  controllers: [MessengerController],
  providers: [MessengerService, MessengerUnifiedService, MessengerGateway],
  exports: [MessengerService, MessengerUnifiedService],
})
export class MessengerModule {}
