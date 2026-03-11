import { Module } from '@nestjs/common';
import { AutoTasksController } from './auto-tasks.controller';
import { AutoTasksService } from './auto-tasks.service';

@Module({
  controllers: [AutoTasksController],
  providers: [AutoTasksService],
  exports: [AutoTasksService],
})
export class AutomationModule {}
