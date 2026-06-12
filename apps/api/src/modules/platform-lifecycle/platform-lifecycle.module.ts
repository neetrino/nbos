import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { DriveModule } from '../drive/drive.module';
import { PlatformLifecycleController } from './platform-lifecycle.controller';
import { PlatformTrashInventoryService } from './platform-trash-inventory.service';
import { PlatformTrashPurgeService } from './platform-trash-purge.service';

@Module({
  imports: [AuditModule, DriveModule],
  controllers: [PlatformLifecycleController],
  providers: [PlatformTrashInventoryService, PlatformTrashPurgeService],
  exports: [PlatformTrashInventoryService, PlatformTrashPurgeService],
})
export class PlatformLifecycleModule {}
