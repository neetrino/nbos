import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { MessengerController } from './messenger.controller';
import { MessengerGateway } from './messenger.gateway';
import { MessengerService } from './messenger.service';

@Module({
  imports: [AuditModule],
  controllers: [MessengerController],
  providers: [MessengerService, MessengerGateway],
  exports: [MessengerService],
})
export class MessengerModule {}
