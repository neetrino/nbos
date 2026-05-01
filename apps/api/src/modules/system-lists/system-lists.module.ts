import { Module } from '@nestjs/common';
import { SystemListsController } from './system-lists.controller';
import { SystemListsService } from './system-lists.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [SystemListsController],
  providers: [SystemListsService],
  exports: [SystemListsService],
})
export class SystemListsModule {}
