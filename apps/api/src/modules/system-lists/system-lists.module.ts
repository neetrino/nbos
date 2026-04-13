import { Module } from '@nestjs/common';
import { SystemListsController } from './system-lists.controller';
import { SystemListsService } from './system-lists.service';

@Module({
  controllers: [SystemListsController],
  providers: [SystemListsService],
  exports: [SystemListsService],
})
export class SystemListsModule {}
