import { Module } from '@nestjs/common';
import { PlatformLifecycleController } from './platform-lifecycle.controller';
import { PlatformTrashInventoryService } from './platform-trash-inventory.service';

@Module({
  controllers: [PlatformLifecycleController],
  providers: [PlatformTrashInventoryService],
  exports: [PlatformTrashInventoryService],
})
export class PlatformLifecycleModule {}
