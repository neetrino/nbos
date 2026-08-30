import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { MessengerCoreCollectionController } from './core/messenger-core-collection.controller';
import { MessengerCoreCollectionService } from './core/messenger-core-collection.service';
import { MessengerCoreController } from './core/messenger-core.controller';
import { MessengerCoreService } from './core/messenger-core.service';
import { MessengerController } from './messenger.controller';
import { MessengerGateway } from './messenger.gateway';
import { MessengerService } from './messenger.service';

@Module({
  imports: [AuditModule],
  controllers: [MessengerController, MessengerCoreController, MessengerCoreCollectionController],
  providers: [
    MessengerService,
    MessengerCoreService,
    MessengerCoreCollectionService,
    MessengerGateway,
  ],
  exports: [MessengerService, MessengerCoreService],
})
export class MessengerModule {}
