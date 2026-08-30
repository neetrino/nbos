import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { MessengerCoreController } from './core/messenger-core.controller';
import { MessengerCoreService } from './core/messenger-core.service';
import { MessengerController } from './messenger.controller';
import { MessengerGateway } from './messenger.gateway';
import { MessengerService } from './messenger.service';

@Module({
  imports: [AuditModule],
  controllers: [MessengerController, MessengerCoreController],
  providers: [MessengerService, MessengerCoreService, MessengerGateway],
  exports: [MessengerService, MessengerCoreService],
})
export class MessengerModule {}
